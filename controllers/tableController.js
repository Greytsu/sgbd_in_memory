const fs = require('fs');
const { Response } = require('../services/responseService')
const { IsEmptyOrNull } = require('../utils/stringUtils');

exports.TableController = (req, res, config, datasFiles) => {
    const path = req.url.split("?")[0];
    const pathSplit = path.split("/");
    const method = req.method;

    const databaseName = pathSplit[2];
    if (!config.databases[databaseName]){
        Response(res, 400, `{ "error": "The database ${databaseName} not exist !" }`);
        return;
    }
    console.log("databaseName", databaseName)
    if(method === 'GET'){
        const tableName = pathSplit[4];
        if (!tableName){
            Response(res, 200, JSON.stringify(
                Object.keys(config.databases[databaseName].tables).map(tableName => {
                    return {
                        name: tableName,
                        columns: Object.keys(config.databases[databaseName].tables[tableName].columns).length,
                        datas: datasFiles.filter(x => x.filePath === `config/${databaseName}_${tableName}.json`)[0].data.datas.length
                    };
                })));
            return;
        }
        
        if (config.databases[databaseName].tables[tableName]){
            Response(res, 200, JSON.stringify({
                columns: Object.keys(config.databases[databaseName].tables[tableName].columns).length,
                datas: datasFiles.filter(x => x.filePath === `config/${databaseName}_${tableName}.json`)[0].data.datas.length
            }));
            return;
        }
        Response(res, 400, `{ "error": "The table ${tableName} not exist !" }`);
    }else if(method === 'POST'){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(IsEmptyOrNull(data)){
                Response(res, 400, `{ "error": "Empty json"`);
                return;
            }
            
            const { name } = JSON.parse(data);
            if(IsEmptyOrNull(name)){
                Response(res, 400, `{ "error": "Invalid json"`);
                return;
            }
            
            if (config.databases[databaseName].tables[name]){
                Response(res, 400, `{ "error": "The table ${name} already exist !" }`);
                return;
            }

            fs.writeFileSync(`config/${databaseName}_${name}.json`, '{"sequence" : 1, "key": null, "index": {}, "datas" : []}');
            
            config.databases[databaseName].tables[name] = { columns: {}};

            Response(res, 201, JSON.stringify({ columns: 0, datas: 0 }));
        });
    }/*else if(method === 'PUT'){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(IsEmptyOrNull(data)){
                Response(res, 400, `{ "error": "Empty json"`);
                return;
            }
            
            const { name, columns } = JSON.parse(data);
            if(name === '' || !name || columns.lenght <= 0 || !columns){
                Response(res, 400, `{ "error": "Invalid json"`);
                return;
            }
            
            const index = config.databases[databaseIndex].tables.findIndex(x => x.name == name);
            if (index === -1){
                Response(res, 400, `{ "error": "The table ${name} not exist !" }`);
                return;
            }

            const table = { name: name, columns: columns}
            config.databases[databaseIndex].tables[index] = table;

            Response(res, 204, '');
        });
    }*/else if(method === 'DELETE'){
        const tableName = pathSplit[4];
        if(IsEmptyOrNull(tableName)){
            Response(res, 400, `{ "error": "Invalid path" }"`);
            return;
        }
        
        if (!config.databases[databaseName].tables[tableName]){
            Response(res, 400, `{ "error": "The table ${tableName} not exist !" }`);
            return;
        }

        delete config.databases[databaseName].tables[tableName]

        Response(res, 204, '');
    }else if(method === 'OPTIONS'){
        Response(res, 200, '{ "method": ["GET", "POST", "PUT", "DELETE"] }')
    }
    else{
        Response(res, 405, `{ "error": "Method not allowed" }`);
    }
}