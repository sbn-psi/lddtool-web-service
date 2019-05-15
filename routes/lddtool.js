const express = require('express');
const router = express.Router();
const path = require('path');
const fse = require('fs-extra');
const Busboy = require('busboy');
const shell = require('shelljs');

// Redirect GET requests to lddtool to root
router.get('/', function(req, res) {
    res.redirect('/');
});

router.post('/', function(req, res, next) {
    // Remove all files from temporary directories
    clearTempDirs();
    
    function clearTempDirs() {
        Promise.all(['tmp', 'tar'].map(dir => fse.emptyDir(dir))).then(() => {
            console.log('emptied temporary directories');

            const contentType = req.headers['content-type'];

            switch (contentType) {
                case 'multipart/form-data':
                    startBusboy();
                    break;
                case 'application/json':
                    const FILENAME = req.body.filename;
                    const XML = req.body.xml;
                    const INGEST_BASENAME = path.basename(FILENAME, '.xml');
                    const WORK_DIR = `tmp/${INGEST_BASENAME}`;
                    fse.mkdirSync(WORK_DIR);
                    
                    fse.writeFileSync('test.txt', "heloo worldddz");
                    
                    fse.writeFile(path.resolve(WORK_DIR, FILENAME), XML, function() {
                        console.log('callback!');
                        // res.send('API under development- good call!');
                        runLddTool(INGEST_BASENAME, WORK_DIR, FILENAME, sendJson); 
                    });
                    
                    break;
                default:
                    console.error(`unexpected content-type: ${contentType}`);
                    break;
            };
        });
    };
    
    function startBusboy() {
        const busboy = new Busboy({
            headers: req.headers
        });
        
        busboy.on('file', saveFile);
        
        req.pipe(busboy);
    };
    
    function saveFile(fieldname, file, filename, encoding, mimetype) {
        const INGEST_BASENAME = path.basename(filename, '.xml');
        const WORK_DIR = `tmp/${INGEST_BASENAME}`;
        fse.mkdirSync(WORK_DIR);
        
        const STREAM = fse.createWriteStream(path.resolve(WORK_DIR, filename));
        file.pipe(STREAM);
        
        STREAM.on('close', function() {
            runLddTool(INGEST_BASENAME, WORK_DIR, filename, sendTar);
        });
    };
    
    function runLddTool(basename, workdir, filename, cb) {
        const INGEST_FILE_PATH = path.resolve(__dirname, '../tmp', basename, filename);
        const CMD = shell.exec(`cd ${workdir} && lddtool -lp --sync ${basename}.xml > ${basename}.log`);
        
        console.log(`Exit: ${CMD.code}\n`);
        
        makeTar(basename, cb);
    };
    
    function makeTar(basename, cb) {
        // Zip up artifacts and send them back to client
        const TAR_NAME = `tar-${basename}.tar.gz`;
        const TAR_DIR = '../tar';
        const CMD = `cd tmp && tar -zcf ${TAR_NAME} ${basename} && mv ${TAR_NAME} ${TAR_DIR}`;
        
        cb(shell.exec(CMD));
    }
    
    function sendTar() {
        res.download(path.resolve(__dirname, TAR_DIR, TAR_NAME));
    };
    
    function sendJson(process) {
        res.json({
            // some object that contains information about
            // how the client can download the compressed directory
            code: process.code
        })
    }
});

module.exports = router;