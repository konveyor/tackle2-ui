const express = require("express");
const path = require("path");
const app = express(),
  bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const setupProxy = require("./setupProxy");

const port = 8080;

const helpers = require('./helpers');
app.use(cookieParser());

setupProxy(app);

app.engine('ejs', require('ejs').renderFile);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../client/dist")));


app.get('*', (_, res) => {
  if (process.env['NODE_ENV'] !== 'production' ) {
    // In dev mode, window._env was populated at build time
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  } else {
    res.render('index.html.ejs', {
      _env: helpers.getEncodedEnv(),
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port::${port}`);
});
