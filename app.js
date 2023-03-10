const http = require('http');
const fs = require('fs');
const { TableController } = require('./controllers/tableController');
const { DatabaseController } = require('./controllers/databaseController');
const { Response } = require('./services/responseService');
const { DataController } = require('./controllers/dataController');

const hostname = '127.0.0.1';
const port = 3030;
const saveInterval = 10000;

const configDirectoryPath = 'config'
const configFilePath = `${configDirectoryPath}/config.json`;

if (!fs.existsSync(configDirectoryPath)){
    fs.mkdirSync(configDirectoryPath);
}
if(!fs.existsSync(configFilePath)){
    fs.writeFileSync(configFilePath, '{"databases":[]}');
}
const configRaws = fs.readFileSync(configFilePath);
let config = JSON.parse(configRaws);

const datasFiles = [];
config.databases.forEach(database => {
    database.tables.forEach(table => {
        const dataFilePath = `config/${database.name}_${table.name}.json`;
        datasFiles.push({
            filePath: dataFilePath,
            data: JSON.parse(fs.readFileSync(dataFilePath))
        })
    })
});

const server = http.createServer((req, res) => {
    const path = req.url.split("?")[0].toLowerCase();
    const pathSplit = path.split("/");

    if(path === '/' && req.method === 'GET'){
        Response(res, 200, `{"paths": ["/status", "/databases"]}`);
    }
    else if(path === '/status' && req.method === 'GET'){
        Response(res, 200, `{"status": "OK"}`);
    }
    else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables' && pathSplit[5] === 'datas'){
        DataController(req, res, config, datasFiles);
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
    console.log(`Save file ${configFilePath}`);
    if (!fs.existsSync(configDirectoryPath)){
        fs.mkdirSync(configDirectoryPath);
    }
    if(!fs.existsSync(configFilePath)){
        fs.writeFileSync(configFilePath, JSON.stringify(config));
    }
    fs.writeFileSync(configFilePath, JSON.stringify(config));
}, saveInterval);

datasFiles.forEach(datasFile => {
    setInterval(() => {
        console.log(`Save file ${datasFile.filePath}`);
        if (!fs.existsSync(configDirectoryPath)){
            fs.mkdirSync(configDirectoryPath);
        }
        if(!fs.existsSync(datasFile.filePath)){
            fs.writeFileSync(datasFile.filePath, JSON.stringify(datasFile.data));
        }
        fs.writeFileSync(datasFile.filePath, JSON.stringify(datasFile.data));
    }, saveInterval);
})
