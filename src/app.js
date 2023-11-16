const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');
const cronjobs = require('./cronjobs');
const session = require('express-session');
// api router
const apiRouter = require('./routes');

module.exports = function ({ getSecrets, amazon, amazonDSP, facebook }) {
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

    // start job queue
    cronjobs.start();

    // sessions
    const session_secret = process.env.SESSION_SECRET || 'secret';

    var sess = {
        secret: session_secret,
        resave: false,
        saveUninitialized: true,
        cookie: {},
    };

    if (app.get('env') !== 'test' && app.get('env') !== 'development') {
        app.set('trust proxy', 1);
        sess.cookie.secure = true;
    }

    app.use(session(sess));

    // parse requests
    app.use(bodyParser.json({ limit: '5mb' }));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.get('/', (req, res) => {
        res.send('Hello!');
    });

    // api routes
    app.use(
        '/api',
        (req, res, next) => {
            // Attach the getSecrets function to the request object
            req.getSecrets = getSecrets;
            req.amazon = amazon;
            req.amazonDSP = amazonDSP;
            req.facebook = facebook;
            next();
        },
        apiRouter
    );
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
