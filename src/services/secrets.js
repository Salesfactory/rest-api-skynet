const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');

const secret_name = process.env.SECRET_NAME; // Use the environment variable for the secret name

const secretsManagerClient = new SecretsManagerClient({
    region: 'us-east-2',
});

async function getSecrets() {
    try {
        const response = await secretsManagerClient.send(
            new GetSecretValueCommand({
                SecretId: secret_name,
                VersionStage: 'AWSCURRENT',
            })
        );

        return JSON.parse(response.SecretString); // Assuming the secret is a JSON object
    } catch (error) {
        throw error;
    }
}

module.exports = getSecrets;
