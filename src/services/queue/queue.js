function createQueue(jobs) {
    let isProcessing = false;
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
        startProcessingJobs: async jobProcessingLogic => {
            if (isProcessing) {
                return;
            }
            isProcessing = true;

            let job = await jobs.findOne({ where: { status: 'pending' } });

            while (job) {
                await job.update({ status: 'processing' });

                try {
                    await jobProcessingLogic(job);
                    await job.update({
                        status: 'completed',
                        processedAt: new Date(),
                    });
                } catch (error) {
                    await job.update({
                        status: 'failed',
                        processedAt: new Date(),
                    });
                    console.error(`Error processing job ${job.id}:`, error);
                }

                job = await jobs.findOne({ where: { status: 'pending' } });
            }

            isProcessing = false;
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
