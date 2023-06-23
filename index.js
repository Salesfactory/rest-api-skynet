const express = require('express');
const app = express();
const port = 5000;
const bodyParser = require("body-parser");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
// routes
const userRouter = require('./src/routes/users.route');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.send('Hello!');
});

// user routes
app.use('/api/users', userRouter);

app.listen(port, (err) => {
  console.log(`Server is running on port ${port}`);
});