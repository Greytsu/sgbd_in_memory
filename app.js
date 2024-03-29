const http = require('http');
const fs = require('fs');
const { TableController } = require('./controllers/tableController');
const { DatabaseController } = require('./controllers/databaseController');
const { Response } = require('./services/responseService');
const { DataController } = require('./controllers/dataController');
const { ColumnController } = require('./controllers/columnController');
const { SaveFile } = require('./services/fileService');

const hostname = '127.0.0.1';
const port = 3030;

const configDirectoryPath = 'config'
const configFilePath = `${configDirectoryPath}/config.json`;

if (!fs.existsSync(configDirectoryPath)){
    fs.mkdirSync(configDirectoryPath);
}
if(!fs.existsSync(configFilePath)){
    fs.writeFileSync(configFilePath, '{"databases":{}}');
}
const configRaws = fs.readFileSync(configFilePath);
let config = { file: JSON.parse(configRaws), isModified: false}

const datasFiles = {};
Object.keys(config.file.databases).forEach(databaseName => {
    Object.keys(config.file.databases[databaseName].tables).forEach(tableName => {
        const dataFilePath = `config/${databaseName}_${tableName}.json`;
        datasFiles[dataFilePath] = { file: JSON.parse(fs.readFileSync(dataFilePath)), isModified: false }
    })
});

const server = http.createServer((req, res) => {
    const path = req.url.split("?")[0].toLowerCase();
    const pathSplit = path.split("/");
    
    if(path === '/' && req.method === 'GET'){
        Response(res, 200, { paths: ["/status", "/databases"] });
    }
    else if(path === '/' && req.method === 'OPTIONS'){
        Response(res, 200, { method: ["GET", "OPTIONS"] })
    }
    else if(path === '/status' && req.method === 'GET'){
        Response(res, 200, { status: "OK" });
    }
    else if(path === '/status' && req.method === 'OPTIONS'){
        Response(res, 200, { method: ["GET", "OPTIONS"] })
    }
    else if(pathSplit[1] === 'databases' && pathSplit.length < 4){
        DatabaseController(req, res, config, datasFiles);
    } 
    else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables' && pathSplit.length < 6){
        TableController(req, res, config, datasFiles);
    }
    else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables' && pathSplit[5] === 'columns'){
        ColumnController(req, res, config, datasFiles);
    }
    else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables' && pathSplit[5] === 'datas'){
        DataController(req, res, config, datasFiles);
    }
    else{
        Response(res, 404, { error: "Not found" });
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

SaveFile(configFilePath, config)

Object.keys(datasFiles).forEach(datasFile => {
    datasFiles[datasFile].interval = SaveFile(datasFile, datasFiles[datasFile])
})
