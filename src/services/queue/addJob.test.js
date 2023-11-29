const { addJobToQueue } = require('./addJob');
const { amzQueue } = require('./queue');

jest.mock('./queue', () => ({
    amzQueue: {
        add: jest.fn().mockResolvedValue({ id: '123' }),
    },
}));

describe('addJobToQueue', () => {
    it('should add a job to the queue and return its ID', async () => {
        const jobData = { text: 'Test job' };
        const jobId = await addJobToQueue(jobData);
        expect(amzQueue.add).toHaveBeenCalledWith('myJob', jobData);
        expect(jobId).toBe('123');
    });

    it('should throw an error if adding a job fails', async () => {
        amzQueue.add.mockRejectedValueOnce(new Error('Failed to add job'));
        await expect(addJobToQueue({ text: 'Test job' })).rejects.toThrow(
            'Failed to add job'
        );
    });
});
