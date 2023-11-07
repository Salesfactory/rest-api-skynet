require('dotenv').config();
const makeApp = require('./src/app');
const getSecrets = require('./src/services/secrets');
// amazon create
const { createAmazonCampaign } = require('./src/services/amazon');
const {
    getAmazonDSPCampaigns,
    createAmazonDSPCampaigns,
} = require('./src/services/amazonDSP');
const { createCampaign } = require('./src/services/facebook');

const app = makeApp({
    getSecrets,
    amazon: { create: createAmazonCampaign },
    amazonDSP: {
        list: getAmazonDSPCampaigns,
        create: createAmazonDSPCampaigns,
    },
    facebook: { create: createCampaign },
});
const port = process.env.PORT || 5000;
app.listen(port, err => {
    console.log(`Server is running on port ${port}`);
});
