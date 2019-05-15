'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fse = require('fs-extra');
const Busboy = require('busboy');
const shell = require('shelljs');

let IngestFile = class {
    constructor(filename, xml, basename) {
        this.filename = filename;
        this.xml = xml;
        this.basename = basename;
        
        this.workDir = `tmp/${basename}`;
    };
    
    setTar(obj) {
        this.tar = obj;
        this.setPath();
    };
    
    setPath() {
        this.tar.tarPath = path.join(this.tar.tarDir,this.tar.tarName);
    };
};

let ingestFile;

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
                    ingestFile = new IngestFile(req.body.filename, req.body.xml, path.basename(req.body.filename, '.xml'));
                    
                    fse.mkdirSync(ingestFile.workDir);
                    
                    fse.writeFile(path.resolve(ingestFile.workDir, ingestFile.filename), ingestFile.xml, function() {
                        runLddTool(sendJson); 
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
        ingestFile = new IngestFile(filename, null, path.basename(filename, '.xml'));

        fse.mkdirSync(ingestFile.workDir);
        
        const STREAM = fse.createWriteStream(path.resolve(ingestFile.workDir, filename));
        file.pipe(STREAM);
        
        STREAM.on('close', function() {
            runLddTool(sendTar);
        });
    };
    
    function runLddTool(cb) {
        const CMD = shell.exec(`cd ${ingestFile.workDir} && lddtool -lp --sync ${ingestFile.basename}.xml > ${ingestFile.basename}.log`);
        
        console.log(`Exit: ${CMD.code}\n`);
        
        makeTar(cb);
    };
    
    function makeTar(cb) {
        // Zip up artifacts and send them back to client
        ingestFile.setTar({
            tarName: `tar-${ingestFile.basename}.tar.gz`,
            tarDir: 'tar/'
        });
        
        const CMD = `cd tmp && tar -zcf ${ingestFile.tar.tarName} ${ingestFile.basename} && mv ${ingestFile.tar.tarName} ../${ingestFile.tar.tarDir}`;
        
        cb(shell.exec(CMD));
    }
    
    function sendTar() {
        res.download(path.resolve(ingestFile.tar.tarDir, ingestFile.tar.tarName));
    };
    
    function sendJson(process) {
        // return some object that contains information about
        // how the client can download the compressed directory
        res.json(ingestFile.tar.tarName);
    };
});

router.post('/download', function(req, res, next) {
    const filename = req.body.filename;
    const downloadPath = path.resolve(__dirname, '../', ingestFile.tar.tarDir, filename);
    
    const exists = fse.existsSync(downloadPath);
    
    if (exists) {
        res.download(downloadPath);
    } else {
        res.status(403).json('Invalid file name.');
    };
});

module.exports = router;