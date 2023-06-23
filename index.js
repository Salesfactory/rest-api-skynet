const express = require('express');
const app = express();
const port = 5000;
const bodyParser = require("body-parser");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// BigQuery
const { BigQuery } = require('@google-cloud/bigquery');

app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.send('Hello!');
});

// Create a new dataset for testing, this might be removed later
// move routes to a new file
app.get("/create-test-dataset", (req, res) => {
  try {
    const datasetName = req.query.datasetName;
    async function createDataset() {
      // Creates a client
      const bigqueryClient = new BigQuery();
  
      // Create the dataset
      const [dataset] = await bigqueryClient.createDataset(datasetName);
      console.log(`Dataset ${dataset.id} created.`);
      res.send(`Dataset ${dataset.id} created.`);
    }
    if (datasetName) {
      createDataset();
    } else {
      res.send("Please provide dataset name");
    }
  } catch (error) {
    res.send(error.message);
  }
});

app.listen(port, (err) => {
  console.log(`Server is running on port ${port}`);
});