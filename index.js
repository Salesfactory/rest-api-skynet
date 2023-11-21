require('dotenv').config();
const makeApp = require('./src/app');
const getSecrets = require('./src/services/secrets');
const { createDSPCampaign, createDSPAdset } = require('./src/services/amazon');
const { createCampaign, createAdset } = require('./src/services/facebook');
const app = makeApp({
    getSecrets,
    amazon: {
        createCampaign: createDSPCampaign,
        createAdset: createDSPAdset,
    },
    facebook: {
        createCampaign: createCampaign,
        createAdset: createAdset,
    },
});
const port = process.env.PORT || 5000;
app.listen(port, err => {
    console.log(`Server is running on port ${port}`);
});
