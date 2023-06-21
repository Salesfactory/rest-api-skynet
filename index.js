const express = require('express');
const app = express();
const port = 5000;
const bodyParser = require("body-parser");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.listen(port, (err) => {
  console.log(`Server is running on port ${port}`);
});