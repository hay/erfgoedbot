'use strict';

const fs = require('fs');

// Read config
const config = fs.existsSync('config/production.json')
    ? JSON.parse(fs.readFileSync('config/production.json', 'utf-8'))
    : {
        "appSecret": process.env.MESSENGER_APP_SECRET,
        "pageAccessToken": process.env.MESSENGER_PAGE_ACCESS_TOKEN,
        "validationToken": process.env.MESSENGER_VALIDATION_TOKEN,
        "serverURL": process.env.SERVER_URL,
        "pathPrefix": "",
        "port": process.env.PORT
    };

const
    bodyParser = require('body-parser'),
    express = require('express'),
    fb = require("./fb/fb-lib")(config),
    botHandlers = require("./bot/handlers")(fb),
    webHook = require("./bot/webhook")(fb, botHandlers);

const PATH_PREFIX = config.pathPrefix;

const app = express();
app.set('port', config.port);
app.use(bodyParser.json({verify: fb.verifyRequestSignature}));

app.get(`${PATH_PREFIX}/webhook`, fb.validateWebhook);
app.post(`${PATH_PREFIX}/webhook`, webHook);
app.listen(app.get('port'), () => console.log('Node app is running on port', app.get('port')));

module.exports = app;