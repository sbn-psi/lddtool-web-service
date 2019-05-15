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

const lddtool = require('./routes/lddtool.js');
app.use('/lddtool',lddtool);

app.listen(PORT);
console.log(`ldd-tool-webify listening on port ${PORT}`);