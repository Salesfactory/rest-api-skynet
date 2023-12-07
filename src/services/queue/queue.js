function createQueue(jobs) {
    return {
        addJobToQueue: async jobData => {
            try {
                const job = await jobs.create({
                    data: jobData,
                });
                console.log(`Job added with ID: ${job.id}`);
                return job.id;
            } catch (error) {
                console.error('Error adding job to the queue:', error);
                throw new Error(error);
            }
        },
        startProcessingtJobs: async jobProcessingLogic => {
            const job = await jobs.findOne({ where: { status: 'pending' } });

            if (job) {
                await job.update({ status: 'processing' });

                jobProcessingLogic(job);
                console.log(`Processing job: ${job.id}`);

                // Update status to 'completed'
                await job.update({
                    status: 'completed',
                    processedAt: new Date(),
                });
            }
        },
        getCompletedJobs: async () => {
            const completedJobs = await jobs.findAll({
                where: { status: 'completed' },
                attributes: ['id', 'processedAt'],
            });
            return completedJobs;
        },
    };
}

// Initialize Queue

module.exports = { createQueue };
