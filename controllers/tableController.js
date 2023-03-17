const fs = require('fs');
const { SaveFile } = require('../services/fileService');
const { Response } = require('../services/responseService')
const { CompareObjectStruct, InitObject } = require('../utils/objectUtil');
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
                        datas: Object.keys(datasFiles[`config/${databaseName}_${tableName}.json`].file.datas).length
                    };
                })));
            return;
        }
        
        if (config.databases[databaseName].tables[tableName]){
            Response(res, 200, JSON.stringify({
                columns: Object.keys(config.databases[databaseName].tables[tableName].columns).length,
                datas: Object.keys(datasFiles[`config/${databaseName}_${tableName}.json`].file.datas).length
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
            
            const strucObject = InitObject(["name"]);
            const tableObject = JSON.parse(data);
            if(!CompareObjectStruct(strucObject, tableObject) 
            || typeof tableObject.name !== 'string'
            || IsEmptyOrNull(tableObject.name)){
                Response(res, 400, `{ "error": "Invalid json"`);
                return;
            }
            
            if (config.databases[databaseName].tables[tableObject.name]){
                Response(res, 400, `{ "error": "The table ${tableObject.name} already exist !" }`);
                return;
            }

            const filePath = `config/${databaseName}_${tableObject.name}.json`
            const datas = {sequence: 0, index: {}, datas: {}}
            fs.writeFileSync(filePath, JSON.stringify(datas));
            
            config.databases[databaseName].tables[tableObject.name] = { columns: {}};
            datasFiles[filePath] = {};
            datasFiles[filePath].file = datas;
            datasFiles[filePath].interval = SaveFile(filePath, datas)

            console.log("datasFiles", datasFiles)
            Response(res, 201, JSON.stringify({ columns: 0, datas: 0 }));
        });
    }else if(method === 'DELETE'){
        const tableName = pathSplit[4];
        if(IsEmptyOrNull(tableName)){
            Response(res, 400, `{ "error": "Invalid path" }"`);
            return;
        }
        
        if (!config.databases[databaseName].tables[tableName]){
            Response(res, 400, `{ "error": "The table ${tableName} not exist !" }`);
            return;
        }
        
        const filePath = `config/${databaseName}_${tableName}.json`
        clearInterval(datasFiles[filePath].interval)
        delete datasFiles[filePath]
        fs.unlinkSync(filePath);
        
        delete config.databases[databaseName].tables[tableName]

        Response(res, 204, '');
    }else if(method === 'OPTIONS'){
        Response(res, 200, '{ "method": ["GET", "POST", "PUT", "DELETE"] }')
    }
    else{
        Response(res, 405, `{ "error": "Method not allowed" }`);
    }
}