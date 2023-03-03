const http = require('http');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

const configFilePath = 'config/config.json';
if(!fs.existsSync(configFilePath)){
    fs.writeFileSync(configFilePath, '{"databases":[]}');
}
const configRaws = fs.readFileSync(configFilePath);
let config = JSON.parse(configRaws);

const server = http.createServer((req, res) => {
    const path = req.url.split("?")[0];
    const pathSplit = path.split("/");
    const method = req.method;

    console.log("config => ", config);
    console.log("PATH => ", path);
    console.log("METHODE => ", method);

    if(path.toLowerCase() === '/status' && method === 'GET'){
        res.writeHead(400, {'Content-Type' : 'application/json'});
        res.end(`{"status": "OK"}`);
        return;
    }

    if(pathSplit[1].toLowerCase() === 'database' && pathSplit[3]?.toLowerCase() === 'table')
    {
        const databaseName = pathSplit[2];
        const databaseIndex = config.databases.findIndex(x => x.name == databaseName);
        if (databaseIndex === -1){
            res.writeHead(400, {'Content-Type' : 'application/json'});
            res.end(`{ "error": "The database ${databaseName} not exist !" }`);
            return;
        }
        console.log("databaseName", databaseName)
        if(method === 'GET'){
            const tableName = pathSplit[4];
            console.log("tableName", tableName)
            if (tableName){
                const tablesFilter = config.databases[databaseIndex].tables.filter(x => x.name == tableName);
                if (tablesFilter.length === 0){
                    res.writeHead(400, {'Content-Type' : 'application/json'});
                    res.end(`{ "error": "The table ${tableName} not exist !" }`);
                    return;
                }
                res.writeHead(200, {'Content-Type' : 'application/json'});
                res.end(JSON.stringify(tablesFilter[0]));
                return;
            }
            res.writeHead(200, {'Content-Type' : 'application/json'});
            res.end(JSON.stringify(config.databases[databaseIndex].tables));
        }else if(method === 'POST'){
            let data ='';
            req.on('data', (chunk) => {
                data = chunk.toString();
            }).on('end', () => {

                if(data.trim() === '' || !data){
                    res.writeHead(400, {'Content-Type' : 'application/json'});
                    res.end(`{ "error": "Empty json"`);
                    return;
                }
                
                const { name, columns } = JSON.parse(data);
                if(name === '' || !name || columns.lenght <= 0 || !columns){
                    res.writeHead(400, {'Content-Type' : 'application/json'});
                    res.end(`{ "error": "Invalid json" }"`);
                    return;
                }
                
                if (config.databases[databaseIndex].tables.filter(x => x.name == name).length > 0){
                    res.writeHead(400, {'Content-Type' : 'application/json'});
                    res.end(`{ "error": "The table ${name} already exist !" }`);
                    return;
                }

                const table = { name: name, columns: columns}
                config.databases[databaseIndex].tables.push(table);

                res.writeHead(201, {'Content-Type' : 'application/json'});
                res.end(JSON.stringify(table));
            });
        }else if(method === 'PUT'){
            let data ='';
            req.on('data', (chunk) => {
                data = chunk.toString();
            }).on('end', () => {

                if(data.trim() === '' || !data){
                    res.writeHead(400, {'Content-Type' : 'application/json'});
                    res.end(`{ "error": "Empty json"`);
                    return;
                }
                
                const { name, columns } = JSON.parse(data);
                if(name === '' || !name || columns.lenght <= 0 || !columns){
                    res.writeHead(400, {'Content-Type' : 'application/json'});
                    res.end(`{ "error": "Invalid json" }"`);
                    return;
                }
                
                const index = config.databases[databaseIndex].tables.findIndex(x => x.name == name);
                if (index === -1){
                    res.writeHead(400, {'Content-Type' : 'application/json'});
                    res.end(`{ "error": "The table ${name} not exist !" }`);
                    return;
                }

                const table = { name: name, columns: columns}
                config.databases[databaseIndex].tables[index] = table;

                res.writeHead(204, {'Content-Type' : 'application/json'});
                res.end();
            });
        }else if(method === 'DELETE'){
            
            const name = pathSplit[4];
            if(name === '' || !name){
                res.writeHead(400, {'Content-Type' : 'application/json'});
                res.end(`{ "error": "Invalid path" }"`);
                return;
            }
            
            const index = config.databases[databaseIndex].tables.findIndex(x => x.name == name);
            if (index === -1){
                res.writeHead(400, {'Content-Type' : 'application/json'});
                res.end(`{ "error": "The table ${name} not exist !" }`);
                return;
            }

            config.databases[databaseIndex].tables.splice(index, 1);

            res.writeHead(204, {'Content-Type' : 'application/json'});
            res.end();
        }else{
            res.writeHead(405, {'Content-Type' : 'application/json'});
            res.end(`{ "error": "Method not allowed" }`);
        }
    }
    else if(pathSplit[1].toLowerCase() === 'database'){
        if(method === 'GET'){
            const name = pathSplit[2];
            if (name){
                const databasesFilter = config.databases.filter(x => x.name == name);
                if (databasesFilter.length === 0){
                    res.writeHead(400, {'Content-Type' : 'application/json'});
                    res.end(`{ "error": "The database ${name} not exist !" }`);
                    return;
                }
                res.writeHead(200, {'Content-Type' : 'application/json'});
                res.end(JSON.stringify(databasesFilter[0]));
                return;
            }
            res.writeHead(200, {'Content-Type' : 'application/json'});
            res.end(JSON.stringify(config.databases));
        }else if(method === 'POST'){
            let data ='';
            req.on('data', (chunk) => {
                data = chunk.toString();
            }).on('end', () => {

                if(data.trim() === '' || !data){
                    res.writeHead(400, {'Content-Type' : 'application/json'});
                    res.end(`{ "error": "Empty json"`);
                    return;
                }
                
                const { name } = JSON.parse(data);
                if(name === '' || !name){
                    res.writeHead(400, {'Content-Type' : 'application/json'});
                    res.end(`{ "error": "Invalid json" }"`);
                    return;
                }
                
                if (config.databases.filter(x => x.name == name).length > 0){
                    res.writeHead(400, {'Content-Type' : 'application/json'});
                    res.end(`{ "error": "The database ${name} already exist !" }`);
                    return;
                }

                const database = { name: name, tables: []}
                config.databases.push(database);

                res.writeHead(201, {'Content-Type' : 'application/json'});
                res.end(JSON.stringify(database));
            });
        }else if(method === 'DELETE'){
            
            const name = pathSplit[2];
            if(name === '' || !name){
                res.writeHead(400, {'Content-Type' : 'application/json'});
                res.end(`{ "error": "Invalid path" }"`);
                return;
            }
            
            const index = config.databases.findIndex(x => x.name == name);
            if (index === -1){
                res.writeHead(400, {'Content-Type' : 'application/json'});
                res.end(`{ "error": "The database ${name} not exist !" }`);
                return;
            }

            config.databases.splice(index, 1);

            res.writeHead(204, {'Content-Type' : 'application/json'});
            res.end();
        }else{
            res.writeHead(405, {'Content-Type' : 'application/json'});
            res.end(`{ "error": "Method not allowed" }`);
        }
    } 
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

var interval = setInterval(() => {
    console.log("Save file");
    fs.writeFileSync(configFilePath, JSON.stringify(config));
}, 10000);
