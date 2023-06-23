const express = require('express');
const app = express();
const port = 5000;
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require('helmet');
const morgan = require("morgan");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// set security HTTP headers
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet());

// enable all CORS requests
app.use(cors());

// log all requests to the console
app.use(morgan("common"));

// parse requests
app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.send('Hello!');
});

// custom 404
app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!");
});

// custom error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, (err) => {
  console.log(`Server is running on port ${port}`);
});