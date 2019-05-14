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
    Promise.all(['tmp', 'tar'].map(dir => fse.emptyDir(dir))).then(() => {
        console.log('emptied temporary directories');
        getIngestFile(req, res);
    });
    
    function getIngestFile(req, res, callback) {
        const busboy = new Busboy({
            headers: req.headers
        });
        
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            const INGEST_BASENAME = path.basename(filename, '.xml');
            const workdir = `tmp/${INGEST_BASENAME}`;
            fse.mkdirSync(workdir);
            
            const STREAM = fse.createWriteStream(path.resolve(workdir, filename));
            file.pipe(STREAM);
            
            STREAM.on('close', function runLddTool() {
                const INGEST_FILE_PATH = path.resolve(__dirname, '../tmp', INGEST_BASENAME, filename);
                
                // 2. Run LDD Tool
                const CMD = shell.exec(`cd ${workdir} && lddtool -lp --sync ${INGEST_BASENAME}.xml > ${INGEST_BASENAME}.log`);
                console.log(`Exit: ${CMD.code}\n`);
                
                // 3. Zip up artifacts and send them back to client
                const TAR_NAME = `tar-${INGEST_BASENAME}.tar.gz`;
                const TAR_DIR = '../tar';
                
                shell.exec(`cd tmp && tar -zcf ${TAR_NAME} ${INGEST_BASENAME} && mv ${TAR_NAME} ${TAR_DIR}`);
                
                res.download(path.resolve(__dirname, TAR_DIR, TAR_NAME));
            });
        });
        
        return req.pipe(busboy);
    };
});

module.exports = router;