const { createQueue } = require('./queue');
const jobs = require('../../../__mocks__/jobs');
const sendEmails = require('../../../__mocks__/sendEmails');

describe('Queue Module', () => {
    const mockQueue = createQueue(jobs, sendEmails);

    beforeEach(() => {
        jest.clearAllMocks();
        jobs.findOne.mockReset();
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
            const mockJob = {
                id: '123',
                batchId: 'batch1',
                data: {},
                update: jest.fn(),
            };
            jobs.findOne
                .mockResolvedValueOnce(mockJob) // First call for finding the job
                .mockResolvedValueOnce(null); // Second call returns null to exit loop

            const mockJobProcessingLogic = jest.fn();

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
        it('should process jobs in batches and call sendEmails after each batch', async () => {
            // Mock job data
            const mockJobs = [
                { id: '1', batchId: 'batch1', data: {}, update: jest.fn() },
                { id: '2', batchId: 'batch1', data: {}, update: jest.fn() },
                { id: '3', batchId: 'batch2', data: {}, update: jest.fn() },
            ];

            // Setup jobs.findOne to return mock jobs and then null
            jobs.findOne
                .mockResolvedValueOnce(mockJobs[0])
                .mockResolvedValueOnce(mockJobs[1])
                .mockResolvedValueOnce(mockJobs[2])
                .mockResolvedValueOnce(null);

            // Mock job processing logic
            const jobProcessingLogic = jest.fn();

            // Execute startProcessingJobs
            await mockQueue.startProcessingJobs(jobProcessingLogic);

            // Verify job processing logic is called for each job
            expect(jobProcessingLogic).toHaveBeenCalledTimes(3);

            // Verify sendEmails is called after each batch
            expect(sendEmails).toHaveBeenCalledTimes(2);
            expect(sendEmails).toHaveBeenCalledWith([
                mockJobs[0].data,
                mockJobs[1].data,
            ]);
            expect(sendEmails).toHaveBeenCalledWith([mockJobs[2].data]);

            // Verify job updates
            mockJobs.forEach(job => {
                expect(job.update).toHaveBeenCalledWith({
                    status: 'processing',
                });
                expect(job.update).toHaveBeenCalledWith({
                    status: 'completed',
                    processedAt: expect.any(Date),
                });
            });
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
