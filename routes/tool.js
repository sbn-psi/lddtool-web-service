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

let ingestFile,
    pathOnly;

// Redirect GET requests from tool to root
router.get('/', function(req, res) {
    res.redirect('/');
});

router.post('/', function(req, res, next) {
    // Remove all files from temporary directories
    clearTempDirs();
    
    if (req.headers['x-path-only'] && req.headers['x-path-only'] == 'true') pathOnly = true;
    else pathOnly = false;
    
    function clearTempDirs() {
        Promise.all(['tmp', 'tar'].map(dir => fse.emptyDir(dir))).then(() => {
            console.log('emptied temporary directories');

            const contentType = req.headers['content-type'];

            function contentTypeIncludes(ct) {
                const regex = new RegExp(ct,'g');
                return regex.test(contentType);
            };
            
            if (/multipart\/form-data/g.test(contentType)) {
                startBusboy();
            } else if (/json|x-www-form-urlencoded/g.test(contentType)) {
                ingestFile = new IngestFile(req.body.filename, req.body.xml, path.basename(req.body.filename, '.xml'));
                
                fse.mkdirSync(ingestFile.workDir);
                
                fse.writeFile(path.resolve(ingestFile.workDir, ingestFile.filename), ingestFile.xml, function() {
                    runLddTool(sendJson); 
                });
            } else {
                console.error(`unexpected content-type: ${contentType}`);
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
        if (!/\.xml/g.test(filename)) return res.render('error', { message: `Invalid file extension: "${filename}"`});
        
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
        const archiveFiles = fse.readdirSync(ingestFile.workDir).map(file => file);
        
        if (pathOnly) res.json( path.join(ingestFile.tar.tarDir, ingestFile.tar.tarName) );
        else res.render('files', {
            tarFile: path.join(ingestFile.tar.tarDir, ingestFile.tar.tarName),
            archiveFiles: archiveFiles
        })
    };
    
    function sendJson(process) {
        // return some object that contains information about
        // how the client can download the compressed directory
        res.json(ingestFile.tar.tarName);
    };
});

router.get('/download', function(req, res, next) {
    const filename = req.query.filename;
    const downloadPath = path.join(__dirname, '../', filename);
    const exists = fse.existsSync(downloadPath);

    if (exists) res.download(downloadPath);
    else res.status(403).json('Invalid file name.');
});

module.exports = router;