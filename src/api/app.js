const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const instagramRoutes = require('../routes/instagramRoutes');
const globalErrHandler = require('../controllers/errorController');
const AppError = require('../utils/appError');

// defining the Express app
const app = express();

// adding Helmet to enhance your Rest API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));



// Root route of express app
app.get("/", (req, res) => {
  res.send("Hello World");
});

// defining an endpoint to return all ads
app.use('/api/v1/instagram', instagramRoutes);

// handle undefined Routes
app.use('*', (req, res, next) => {
    const err = new AppError(404, 'fail', 'undefined route');
    next(err, req, res, next);
});

app.use(globalErrHandler);
// starting the server

module.exports = app;
