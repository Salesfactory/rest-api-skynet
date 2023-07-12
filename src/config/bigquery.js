const { BigQuery } = require('@google-cloud/bigquery');

const projectId = process.env.project_id;

let keyFileContent;
let credentials;

try {
    keyFileContent = atob(process.env.BQ_CONFIG);
    credentials = JSON.parse(keyFileContent);
} catch (error) {
    // while running tests 'aton' won't find a value so credentials will raise an error
    credentials = {};
}

const options = {
    projectId,
    credentials,
};

const bigqueryClient = new BigQuery(options);

module.exports = { bigqueryClient };
