const supertest = require('supertest');
const makeApp = require('../src/app');

jest.mock('../src/models', () => ({}));

jest.mock('@aws-sdk/client-s3', () => {
    return {
        S3Client: jest.fn().mockImplementation(() => {
            return {
                send: jest.fn().mockImplementation(() => {
                    return {
                        $metadata: {
                            httpStatusCode: 200,
                        },
                    };
                }),
            };
        }),
        GetObjectCommand: jest.fn().mockImplementation(() => {
            return {
                Bucket: 'test-bucket',
                Key: 'test-key',
            };
        }),
        PutObjectCommand: jest.fn().mockImplementation(() => {
            return {
                Bucket: 'test-bucket',
                Key: 'test-key',
                Body: 'test-body',
                ContentType: 'test-content-type',
            };
        }),
    };
});

jest.mock('@aws-sdk/s3-request-presigner', () => {
    return {
        getSignedUrl: jest.fn().mockImplementation(() => {
            return 'https://test-url.com';
        }),
    };
});

const getSecrets = jest.fn(() => ({
    CLIENT_ID: 'TEST',
}));

const app = makeApp({ getSecrets });
const request = supertest(app);

describe('S3 API Endpoints', () => {
    const originalBase64Image =
        '/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgAIAAgAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A+pof2nvH+tNN4l0HSNB1Dwszs9locqSx6hd2wJCSC783y0eRcOEMOBuClxywoaz8RfiL4ru431TxmPBy3BJg0Xw3HBwBzte4uI3klYd2jEQ/2e9Ylh4Wn+GPjjxD4DnG+30tIr7S5lYFX064knFuhHUPH5EkRB4IjVgfnwvnHxY1HxhB4x8H6rplzLpfgm2kl/4SdZYVYmGOSCeLHBfl4cfIMk4B4NcnPJy5G7bn31LL8H9XhiqVPnvyrr1aTdvLXy0PYtF+I3xF8J3TyaZ4xHjOO3I8/RfEccALD+6lxbxo8THBw0iyj/Z7j6Q+GPxK0v4qeFk1nTFmtnSVra8sLsBbiyuExvhlAJAYZBBBKsrKykqwJ+DvhFf+MJPFXjHVNXuZtV8HXUsX/CLiKFV220ktxcyE8B/v3OPn5GNvRa9s+Gnipfhp8XobmcFdC8Wi30q7ZTxBfK5W0lK+knmeQWHOfIGCAStRnaXI2cOPy2MsN9apQ5Wm7ryTav8Ar2sch+1H8ZfBvhz9o7RrO21dZtUl03+ydc8tSYbJ0kMtmJJfuhv9IuAVGSvmRlto5N46tb3lvJBdRJNFIpSSORQVYHggg9R7V4d8Tv8Agn18bTr2orpl5pPi7SJr65vILh7/AMid2mkLu80cigCRieSHYH26DqfhF+x3+0dpU9pZal4g8N6J4fjZVZNRmfUZoU9I0RVzgcBTMqjjAoq0XL3ovU+nwuJyjAZfSSxPPK12rO6b1stNvXrrdp6ej/2vb2lvHBbRJFFGoRI41AVQOAAB0Arzv4dfEnTvjj8cNM8CRX1jpljY6paX0epXNw3/ABMzaypcNBagJtZy0O07nX5Nzpv21F8XP2Ov2j9Xmu7HT9f8N65oEjMqx6dO+nSzJ6SI6tjI4KiZlPeuc+Ff/BP341x+JNKbVb3SfCWkW2oW1/NOl/59wrQyB1aFI1KlwRwS6ge/QqnQa96b1NK+NyvE4Cq44nklZ2Vm232emie2nrdJa//Z';

    describe('POST /api/s3/uploadImage', () => {
        it('should upload an image successfully', async () => {
            const response = await request
                .post('/api/s3/uploadImage')
                .send({ base64File: originalBase64Image });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('File uploaded successfully.');
            expect(response.body.data).toHaveProperty('key');
            expect(response.body.data).toHaveProperty('url');
        });

        it('should handle missing base64 file data', async () => {
            const response = await request.post('/api/s3/uploadImage');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('No base64 file data provided.');
        });

        it('should handle b64 images starting with data:', async () => {
            const base64Image = 'data:image/jpeg;base64,' + originalBase64Image;

            const response = await request
                .post('/api/s3/uploadImage')
                .send({ base64File: base64Image });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('File uploaded successfully.');
        });

        it('should handle invalid image files', async () => {
            const base64Image = 'data:image/jpeg;base64,invalid-image';

            const response = await request
                .post('/api/s3/uploadImage')
                .send({ base64File: base64Image });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid image file.');
        });
    });

    describe('GET /api/s3/getFileLink', () => {
        it('should retrieve a file link successfully', async () => {
            const filename = 'example.jpg';

            const response = await request.get(
                `/api/s3/getFileLink?filename=${filename}`
            );

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('File retrieved successfully.');
            expect(response.body.data).toHaveProperty('key', filename);
            expect(response.body.data).toHaveProperty('url');
        });

        it('should handle missing filename parameter', async () => {
            const response = await request.get('/api/s3/getFileLink');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Filename is required.');
        });
    });
});
