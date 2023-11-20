const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * @returns an AWS S3 client
 */
const getClient = ({ secrets }) => {
    return new S3Client({
        region: secrets.S3_REGION,
        credentials: {
            accessKeyId: secrets.S3_ACCESS_KEY,
            secretAccessKey: secrets.S3_SECRET_KEY,
        },
    });
};

/**
 * this function makes use of the signatures object to detect the MIME type of the image
 * signature is the first few bytes of the image (in base64 format)
 * (it is not 100% accurate, but it works for most cases)
 */
const detectMimeType = b64 => {
    const signatures = {
        R0lGODdh: { type: 'image/gif', ext: 'gif' },
        R0lGODlh: { type: 'image/gif', ext: 'gif' },
        iVBORw0KGgo: { type: 'image/png', ext: 'png' },
        '/9j/4': { type: 'image/jpeg', ext: 'jpeg' },
        '/9j/': { type: 'image/jpg', ext: 'jpg' },
    };

    for (var s in signatures) {
        if (b64.indexOf(s) === 0) {
            return signatures[s];
        }
    }
};

/**
 * This function is used to get a signed url from AWS S3
 */
const getS3SignedUrl = async ({ filename, secrets }) => {
    try {
        const client = getClient({ secrets });
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: filename,
        });
        const url = await getSignedUrl(client, command, { expiresIn: 3600 });
        return url;
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Error getting presigned url from AWS S3', error);
        }
        return null;
    }
};

module.exports = {
    getClient,
    getS3SignedUrl,
    detectMimeType,
};
