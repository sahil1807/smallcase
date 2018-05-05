var winston = require('winston');
var expressWinston = require('express-winston');
winston.emitErrs = true;

var tsFormat = function (){ (new Date()) };

// Set up logger
//emerg: 0, alert: 1, crit: 2, error: 3, warn: 4, info: 5, trace: 6, debug: 7
var customColors = {
    trace: 'white',
    debug: 'white',
    info: 'green',
    warn: 'yellow',
    error: 'red',
    alert: 'red',
    crit: 'red',
    emerg: 'red'
};

var logger = new winston.Logger({
    colors: customColors,
    levels: {
        emerg: 0,
        alert: 1,
        crit: 2,
        error: 3,
        warn: 4,
        info: 5,
        trace: 6,
        debug: 7
    },
    transports: [
        new (require('winston-daily-rotate-file'))({
            filename: './logs/dev-logs/all-logs.log',
            handleExceptions: true,
            humanReadableUnhandledException: true,
            json: true,
            timestamp: tsFormat,
            datePattern: 'yyyy-MM-dd',
            prepend: true,
            level: 'debug',
            colorize: false
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            humanReadableUnhandledException: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

winston.addColors(customColors);

// Extend logger object to properly log 'Error' types
var origLog = logger.log;

logger.log = function (level, msg) {
    if (msg instanceof Error) {
        var args = Array.prototype.slice.call(arguments);
        args[1] = msg.stack;
        origLog.apply(logger, args);
    } else {
        origLog.apply(logger, arguments);
    }
};


var expressLogger = new expressWinston.logger({
    transports: [
        new (require('winston-daily-rotate-file'))({
            filename: './logs/express/all-express-logs.log',
            handleExceptions: true,
            humanReadableUnhandledException: true,
            json: true,
            timestamp: tsFormat,
            datePattern: 'yyyy-MM-dd',
            prepend: true,
            level: 'info',
            colorize: true
        }),
    ],
    meta: false, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: true, // Color the text and status code, using the Express/morgan color pavarte (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) { return false; }
});

var expressErrorLogger = new expressWinston.errorLogger({
    transports: [
        new winston.transports.Console({
            json: true,
            timestamp: tsFormat,
            datePattern: 'yyyy-MM-dd',
            prepend: true,
            level: 'error',
            colorize: true
        }),
        new (require('winston-daily-rotate-file'))({
            filename: './logs/express-errors/all-express-logs.log',
            json: true,
            timestamp: tsFormat,
            datePattern: 'yyyy-MM-dd',
            prepend: true,
            level: 'error',
            colorize: true
        }),

    ]
});


module.exports = logger;
module.exports.expressLogger = expressLogger;
module.exports.expressErrorLogger = expressErrorLogger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};