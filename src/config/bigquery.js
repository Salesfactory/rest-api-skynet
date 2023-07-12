const { BigQuery } = require('@google-cloud/bigquery');

const projectId = process.env.project_id;

const keyFileContent = atob(process.env.BQ_CONFIG);

const credentials = JSON.parse(keyFileContent);

const options = {
    projectId,
    credentials,
};

const bigqueryClient = new BigQuery(options);

module.exports = { bigqueryClient };
