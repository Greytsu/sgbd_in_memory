const http = require('http');
const fs = require('fs');
const { TableController } = require('./controllers/tableController');
const { DatabaseController } = require('./controllers/databaseController');
const { Response } = require('./services/responseService')

const hostname = '127.0.0.1';
const port = 3000;

const configFilePath = 'config/config.json';
if(!fs.existsSync(configFilePath)){
    fs.writeFileSync(configFilePath, '{"databases":[]}');
}
const configRaws = fs.readFileSync(configFilePath);
let config = JSON.parse(configRaws);

const server = http.createServer((req, res) => {
    const path = req.url.split("?")[0].toLowerCase();
    const pathSplit = path.split("/");

    if(path === '/' && req.method === 'GET'){
        Response(res, 200, `{"paths": ["/status", "/databases"]}`);
    }
    else if(path === '/status' && req.method === 'GET'){
        Response(res, 200, `{"status": "OK"}`);
    }
    else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables'){
        TableController(req, res, config);
    }
    else if(pathSplit[1] === 'databases'){
        DatabaseController(req, res, config);
    } 
    else{
        Response(res, 404, `{"error": "Not found"}`);
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

setInterval(() => {
    console.log("Save file");
    fs.writeFileSync(configFilePath, JSON.stringify(config));
}, 10000);
