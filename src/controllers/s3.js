const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { createHash } = require('crypto');
const { detectMimeType, getS3SignedUrl, getClient } = require('../services/s3');

/**
 * This function is used to upload an image to AWS S3
 */
const uploadImage = async (req, res) => {
    const secrets = await req.getSecrets();

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    let { base64File } = req.body;

    if (!base64File) {
        return res
            .status(400)
            .json({ message: 'No base64 file data provided.' });
    }

    // check if image is starts with data: and remove it
    if (base64File.startsWith('data:')) {
        base64File = base64File.split('base64,')[1];
    }

    const fileContent = Buffer.from(base64File, 'base64');

    if (fileContent.length > MAX_FILE_SIZE) {
        return res
            .status(400)
            .json({ message: 'File size exceeds the limit (5MB).' });
    }

    // Detect the MIME type of the image
    const mimeType = detectMimeType(base64File);

    if (!mimeType) {
        return res.status(400).json({ message: 'Invalid image file.' });
    }

    // Generate a random image name
    const randomName = createHash('sha1')
        .update(Date.now().toString())
        .digest('hex');
    const imageKey = `${randomName}.${mimeType.ext}`;

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: imageKey,
        Body: fileContent,
        ContentType: mimeType.mime,
    });

    try {
        const client = getClient({ secrets });

        const response = await client.send(command);

        if (response.$metadata.httpStatusCode !== 200) {
            throw new Error();
        }

        const url = await getS3SignedUrl({
            filename: imageKey,
            secrets,
        });

        res.json({
            message: 'File uploaded successfully.',
            data: {
                key: imageKey,
                url,
            },
        });
    } catch (err) {
        console.error(err);
        res.json({ message: 'Error uploading file.' });
    }
};

/*
 * This function is used to return a signed url for a file in S3
 */
const getFileLink = async (req, res) => {
    const { filename } = req.query;

    const secrets = await req.getSecrets();

    if (!filename) {
        return res.status(400).json({ message: 'Filename is required.' });
    }

    try {
        const url = await getS3SignedUrl({ filename, secrets });

        if (!url) {
            return res.status(400).json({ message: 'File not found.' });
        }

        res.json({
            message: 'File retrieved successfully.',
            data: {
                key: filename,
                url,
            },
        });
    } catch (err) {
        console.error(err);
        res.json({ message: 'Error retrieving file.' });
    }
};

module.exports = {
    uploadImage,
    getFileLink,
};
