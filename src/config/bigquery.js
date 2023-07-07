const { BigQuery } = require('@google-cloud/bigquery');

const projectId = process.env.project_id;

const keyFileContent = `{
    "type": "${process.env.BQ_TYPE}",
    "project_id": "${process.env.BQ_PROJECT_ID}",
    "private_key_id": "${process.env.BQ_PRIVATE_KEY_ID}",
    "private_key": "${process.env.BQ_PRIVATE_KEY}",
    "client_email": "${process.env.BQ_CLIENT_EMAIL}",
    "client_id": "${process.env.BQ_CLIENT_ID}",
    "auth_uri": "${process.env.BQ_AUTH_URI}",
    "token_uri": "${process.env.BQ_TOKEN_URI}",
    "auth_provider_x509_cert_url": "${process.env.BQ_AUTH_PROVIDER_X509_CERT_URL}",
    "client_x509_cert_url": "${process.env.BQ_CLIENT_X509_CERT_URL}",
    "universe_domain": "${process.env.BQ_UNIVERSE_DOMAIN}"
}`;

const credentials = JSON.parse(keyFileContent);

const options = {
    projectId,
    credentials,
};

const bigqueryClient = new BigQuery(options);

module.exports = { bigqueryClient };
