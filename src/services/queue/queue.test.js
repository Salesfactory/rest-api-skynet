jest.mock('bullmq'); // Mock the bull library
const { createQueue } = require('./queue'); // Adjust the import path as needed
const { Queue, Worker } = require('bullmq');

jest.mock('ioredis'); // Mock the IORedis module

describe('createQueue', () => {
    let originalConsoleLog;

    beforeAll(() => {
        // Spy on console.log and store the original implementation
        originalConsoleLog = console.log;
        console.log = jest.fn();
    });

    afterEach(() => {
        console.log = originalConsoleLog;
        jest.clearAllMocks();
    });

    it('should create a queue object with addJobToQueue method', async () => {
        // Mock the Queue constructor
        const mockQueueInstance = {
            add: jest.fn().mockResolvedValue({ id: '123' }),
        };
        Queue.mockImplementationOnce(() => mockQueueInstance);

        const queue = createQueue();

        expect(queue.addJobToQueue).toBeDefined();
        const jobData = { text: 'Test job' };
        const jobId = await queue.addJobToQueue(jobData);

        expect(Queue).toHaveBeenCalledWith('AmzQueue', expect.anything());
        expect(mockQueueInstance.add).toHaveBeenCalledWith('myJob', jobData);
        expect(jobId).toBe('123');
    });

    it('should create a queue object with startProcessingtJobs method', async () => {
        // Mock the Worker constructor
        const mockWorkerInstance = {
            on: jest.fn(),
        };
        Worker.mockImplementationOnce(() => mockWorkerInstance);

        const queue = createQueue();

        expect(queue.startProcessingtJobs).toBeDefined();

        const jobProcessingLogic = jest.fn();
        queue.startProcessingtJobs(jobProcessingLogic);

        expect(Worker).toHaveBeenCalledWith('AmzQueue', expect.any(Function));
        expect(mockWorkerInstance.on).toHaveBeenCalledWith(
            'completed',
            expect.any(Function)
        );
        expect(mockWorkerInstance.on).toHaveBeenCalledWith(
            'failed',
            expect.any(Function)
        );
    });
});
