const express = require('express');
const bodyParser = require('body-parser');
const PORT = 3002;

const app = express();
app.use(express.static('src'));
app.use(bodyParser.json({
    type: ['application/json','application/gzip']
}));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(function(req, res, next) {
    res.locals.BASE = process.env.BASE;
    console.log(res.locals);
    next();
});

app.set('views', './views');
app.set('view engine', 'pug');

app.get('/', function(req, res, next) {
    res.render('index', {});
});

const tool = require('./routes/tool.js');
app.use('/tool',tool);

app.listen(PORT);
console.log(`ldd-tool-webify listening on port ${PORT}`);