require('dotenv').config();
const makeApp = require('./src/app');
const getSecrets = require('./src/services/secrets');
// amazon create
const { createDSPCampaign } = require('./src/services/amazon');
const { createCampaign } = require('./src/services/facebook');

const app = makeApp({
    getSecrets,
    amazon: { createCampaign: createDSPCampaign },
    facebook: { create: createCampaign },
});
const port = process.env.PORT || 5000;
app.listen(port, err => {
    console.log(`Server is running on port ${port}`);
});
