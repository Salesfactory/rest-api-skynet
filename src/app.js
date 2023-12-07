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
const IORedis = require('ioredis');

module.exports = function ({
    getSecrets,
    amazon,
    amazonDSP,
    facebook,
    amzQueue,
}) {
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

    // Endpoint to add a job to the queue
    app.post('/add-job', async (req, res) => {
        try {
            const jobData = req.body;
            const jobId = await amzQueue.addJobToQueue(jobData);
            res.status(200).json({ message: `Job added with ID: ${jobId}` });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    // Endpoint to manually trigger job processing
    app.post('/process-job', async (req, res) => {
        try {
            async function storeResultinRedis(job) {
                return null;
            }

            await amzQueue.startProcessingtJobs(storeResultinRedis);

            res.status(200).json({ message: 'Job processing initiated' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    // GET endpoint to retrieve all processed job results
    app.get('/get-job-results', async (req, res) => {
        try {
            const completedJobs = await amzQueue.getCompletedJobs();
            res.status(200).json({ data: completedJobs });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: 'Error retrieving job results',
                error: error.message,
            });
        }
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
