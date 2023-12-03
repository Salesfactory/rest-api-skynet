const { createQueue } = require('./queue');
const jobs = require('../../../__mocks__/jobs');

describe('Queue Module', () => {
    const mockQueue = createQueue(jobs);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('addJobToQueue', () => {
        it('should add a job to the queue', async () => {
            const mockJobData = { task: 'test' };
            jobs.create.mockResolvedValue({ id: '123', data: mockJobData });

            const jobId = await mockQueue.addJobToQueue(mockJobData);

            expect(jobs.create).toHaveBeenCalledWith({ data: mockJobData });
            expect(jobId).toBe('123');
        });

        it('should throw an error if job creation fails', async () => {
            jobs.create.mockRejectedValue(new Error('Failed to create job'));

            await expect(mockQueue.addJobToQueue({})).rejects.toThrow(
                'Failed to create job'
            );
        });
    });

    describe('startProcessingJobs', () => {
        it('should process a pending job with a delay', async () => {
            const mockJob = { id: '123', update: jest.fn() };
            jobs.findOne
                .mockResolvedValueOnce(mockJob) // First call for finding the job
                .mockResolvedValueOnce(null); // Second call returns null to exit loop

            const mockJobProcessingLogic = jest.fn(() => {});

            await mockQueue.startProcessingJobs(mockJobProcessingLogic);

            expect(jobs.findOne).toHaveBeenCalledWith({
                where: { status: 'pending' },
            });
            expect(mockJob.update).toHaveBeenCalledWith({
                status: 'processing',
            });
            expect(mockJobProcessingLogic).toHaveBeenCalledWith(mockJob);
            expect(mockJob.update).toHaveBeenCalledWith({
                status: 'completed',
                processedAt: expect.any(Date),
            });
            expect(mockJob.update).toHaveBeenCalledTimes(2);
        });
    });

    describe('getCompletedJobs', () => {
        it('should return completed jobs', async () => {
            const mockCompletedJobs = [{ id: '123', processedAt: new Date() }];
            jobs.findAll.mockResolvedValue(mockCompletedJobs);

            const completedJobs = await mockQueue.getCompletedJobs();

            expect(jobs.findAll).toHaveBeenCalledWith({
                where: { status: 'completed' },
                attributes: ['id', 'processedAt'],
            });
            expect(completedJobs).toEqual(mockCompletedJobs);
        });
    });
});
