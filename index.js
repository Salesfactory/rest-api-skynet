require('dotenv').config();
const makeApp = require('./src/app');
const getSecrets = require('./src/services/secrets');
// amazon create
const { createAmazonCampaign } = require('./src/services/amazon');
const app = makeApp({
    getSecrets,
    amazon: {
        create: createAmazonCampaign,
    },
});
const port = process.env.PORT || 5000;
app.listen(port, err => {
    console.log(`Server is running on port ${port}`);
});
