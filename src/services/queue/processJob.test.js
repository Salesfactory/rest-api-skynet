const { jobProcessor } = require('./processJob');

describe('jobProcessor', () => {
    it('should process a job correctly', async () => {
        const mockJob = { id: '123', data: { text: 'Test job' } };
        const _jobProcessor = jobProcessor(() => null);
        const result = await _jobProcessor(mockJob);
        expect(result).toBe('processed');
    });
});
