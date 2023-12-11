function createQueue(jobs, sendEmails) {
    let isProcessing = false;
    return {
        addJobToQueue: async ({ jobData, batchId }) => {
            try {
                const job = await jobs.create({
                    data: jobData,
                    batchId,
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

            let job = await jobs.findOne({
                where: { status: 'pending' },
                order: [['batchId', 'ASC']],
            });
            let currentBatchId = null;
            let batchJobsData = [];

            while (job) {
                const { batchId } = job;

                // Check if we are starting a new batch
                if (currentBatchId !== batchId) {
                    if (currentBatchId !== null) {
                        // Call sendEmails for the completed batch
                        await sendEmails(currentBatchId);
                    }
                    currentBatchId = batchId;
                    batchJobsData = []; // Reset batch data for the new batch
                }

                await job.update({ status: 'processing' });
                try {
                    await jobProcessingLogic(job);
                    await job.update({
                        status: 'completed',
                        processedAt: new Date(),
                    });
                    batchJobsData.push(job.data); // Collect job data for the batch
                } catch (error) {
                    await job.update({
                        status: 'failed',
                        processedAt: new Date(),
                    });
                    batchJobsData.push(job.data); // Collect job data for the batch
                    console.error(`Error processing job ${job.id}:`, error);
                }

                job = await jobs.findOne({ where: { status: 'pending' } });
            }

            // Call sendEmails for the last batch if there are any jobs
            if (batchJobsData.length > 0) {
                await sendEmails(currentBatchId);
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
