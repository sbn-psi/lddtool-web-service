const express = require('express');
const PORT = 3002;

const app = express();
app.use(express.static('src'));


const lddtool = require('./routes/lddtool.js');
app.use('/lddtool',lddtool);

app.listen(PORT);
console.log(`ldd-tool-webify listening on port ${PORT}`);