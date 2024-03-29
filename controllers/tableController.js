const fs = require('fs');
const { SaveFile } = require('../services/fileService');
const { Response } = require('../services/responseService')
const { CompareObjectStruct, InitObject } = require('../utils/objectUtil');
const { IsEmptyOrNull } = require('../utils/stringUtils');

exports.TableController = (req, res, config, datasFiles) => {
    const path = decodeURI(req.url.split("?")[0]);
    const pathSplit = path.split("/");
    const method = req.method;

    const databaseName = pathSplit[2];
    if (!config.file.databases[databaseName]){
        Response(res, 400, { error: `The database ${databaseName} does not exist !` });
        return;
    }
    if(method === 'GET'){
        const tableName = pathSplit[4];
        if (IsEmptyOrNull(tableName) && pathSplit.length === 4){
            Response(res, 200, Object.keys(config.file.databases[databaseName].tables).map(tableName => {
                    return {
                        name: tableName,
                        columns: Object.keys(config.file.databases[databaseName].tables[tableName].columns).length,
                        datas: Object.keys(datasFiles[`config/${databaseName}_${tableName}.json`].file.datas).length
                    };
                }));
            return;
        }
        
        if (config.file.databases[databaseName].tables[tableName]){
            Response(res, 200, {
                name: tableName,
                columns: Object.keys(config.file.databases[databaseName].tables[tableName].columns).length,
                datas: Object.keys(datasFiles[`config/${databaseName}_${tableName}.json`].file.datas).length
            });
            return;
        }

        Response(res, 400, { error: `The table ${tableName} does not exist !` });
    }else if(method === 'POST' && pathSplit.length === 4){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(IsEmptyOrNull(data)){
                Response(res, 400, { error: "Empty json" });
                return;
            }
            
            const strucObject = InitObject(["name"]);
            const tableObject = JSON.parse(data);
            if(!CompareObjectStruct(strucObject, tableObject) 
            || typeof tableObject.name !== 'string'
            || IsEmptyOrNull(tableObject.name)){
                Response(res, 400, { error: "Invalid json" });
                return;
            }
            
            if (config.file.databases[databaseName].tables[tableObject.name]){
                Response(res, 400, { error: `The table ${tableObject.name} already exist !` });
                return;
            }

            const filePath = `config/${databaseName}_${tableObject.name}.json`
            const datas = {sequence: 0, index: {}, datas: {}}
            fs.writeFileSync(filePath, JSON.stringify(datas));
            
            config.file.databases[databaseName].tables[tableObject.name] = { columns: {}};
            datasFiles[filePath] = { file: datas, isModified: true};
            datasFiles[filePath].interval = SaveFile(filePath, datasFiles[filePath])

            config.isModified = true;

            Response(res, 201, { name: tableObject.name, columns: 0, datas: 0 });
        });
    }else if(method === 'DELETE' && pathSplit.length === 5){
        const tableName = pathSplit[4];
        if(IsEmptyOrNull(tableName)){
            Response(res, 400, { error: "Invalid path" });
            return;
        }
        
        if (!config.file.databases[databaseName].tables[tableName]){
            Response(res, 400, { error: `The table ${tableName} does not exist !` });
            return;
        }
        
        const filePath = `config/${databaseName}_${tableName}.json`
        clearInterval(datasFiles[filePath].interval)
        delete datasFiles[filePath]
        fs.unlinkSync(filePath);
        
        delete config.file.databases[databaseName].tables[tableName]
        
        config.isModified = true;

        Response(res, 204);
    }else if(method === 'OPTIONS'){
        if (pathSplit.length === 4){
            Response(res, 200, { method: ["GET", "POST", "OPTIONS"] })
            return;
        }
        Response(res, 200, { method: ["GET", "DELETE", "OPTIONS"] })
    }
    else{
        Response(res, 405, { error: "Method not allowed" });
    }
}