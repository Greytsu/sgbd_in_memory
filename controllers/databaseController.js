const fs = require('fs');
const { Response } = require('../services/responseService')
const { IsEmptyOrNull } = require('../utils/stringUtils');
const { CompareObjectStruct, InitObject } = require('../utils/objectUtil');

exports.DatabaseController = (req, res, config, datasFiles) => {
    const path = decodeURI(req.url.split("?")[0]);
    const pathSplit = path.split("/");
    const method = req.method;
    
    if(method === 'GET'){
        const name = pathSplit[2];
        if (IsEmptyOrNull(name) && pathSplit.length === 2){
            Response(res, 200, Object.keys(config.file.databases).map(databaseName => {
                        return {
                            name: databaseName,
                            tables: Object.keys(config.file.databases[databaseName].tables).length
                        }
                    })
                );
            return;
        }
        
        if (config.file.databases[name]){
            Response(res, 200, { name: name, tables: Object.keys(config.file.databases[name].tables).length });
            return;
        }

        Response(res, 400, { error: `The database ${name} does not exist !` });
    }else if(method === 'POST' && pathSplit.length === 2){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(IsEmptyOrNull(data)){
                Response(res, 400, { error: "Empty json" });
                return;
            }
            const strucObject = InitObject(["name"]);
            const databaseObject = JSON.parse(data);
            if(!CompareObjectStruct(strucObject, databaseObject) 
            || typeof databaseObject.name !== 'string'
            || IsEmptyOrNull(databaseObject.name)){
                Response(res, 400, { error: "Invalid json" });
                return;
            }
            
            if (config.file.databases[databaseObject.name]){
                Response(res, 400, { error: `The database ${databaseObject.name} already exist !` });
                return;
            }

            config.file.databases[databaseObject.name] = { tables: {} }
            config.isModified = true;

            Response(res, 201, { name: databaseObject.name, tables: 0 });
        });
    }else if(method === 'DELETE' && pathSplit.length === 3){
        
        const name = pathSplit[2];
        if(IsEmptyOrNull(name)){
            Response(res, 400, { error: "Invalid path" });
            return;
        }
        
        if (!config.file.databases[name]){
            Response(res, 400, { error: `The database ${name} does not exist !` });
            return;
        }

        Object.keys(config.file.databases[name].tables).forEach(elem => {
            const filePath = `config/${name}_${elem}.json`
            clearInterval(datasFiles[filePath].interval)
            delete datasFiles[filePath]
            fs.unlinkSync(filePath);
        })
        delete config.file.databases[name]

        config.isModified = true;

        Response(res, 204);
    }else if(method === 'OPTIONS'){
        if (pathSplit.length === 2){
            Response(res, 200, { method: ["GET", "POST", "OPTIONS"] })
            return;
        }
        Response(res, 200, { method: ["GET", "DELETE", "OPTIONS"] })
    }
    else{
        Response(res, 405, { error: "Method not allowed" });
    }
}