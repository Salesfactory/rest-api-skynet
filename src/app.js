const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');
// api router
const apiRouter = require('./routes');

module.exports = function () {
    const app = express();

    // override the default json response
    app.response.json = function (body) {
        this.contentType('json').end(
            JSON.stringify({
                code: this.statusCode,
                message: body.message ?? '',
                data: body.data ?? {},
            })
        );
        return this;
    };

    // set security HTTP headers
    app.use(helmet.xssFilter());
    app.use(helmet.noSniff());
    app.use(helmet.frameguard());
    app.use(helmet.hidePoweredBy());
    app.use(helmet());

    // enable all CORS requests
    app.use(cors());

    // log all requests to the console
    app.use(morgan('common'));

    // parse requests
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.get('/', (req, res) => {
        res.send('Hello!');
    });

    // api routes
    app.use('/api', apiRouter);

    // custom 404
    app.use((req, res, next) => {
        res.status(404).send("Sorry can't find that!");
    });

    // custom error handler
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });

    return app;
};