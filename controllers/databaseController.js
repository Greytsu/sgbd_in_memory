const fs = require('fs');
const { Response } = require('../services/responseService')
const { IsEmptyOrNull } = require('../utils/stringUtils');
const { CompareObjectStruct, InitObject } = require('../utils/objectUtil');

exports.DatabaseController = (req, res, config, datasFiles) => {
    const path = req.url.split("?")[0];
    const pathSplit = path.split("/");
    const method = req.method;
    
    if(method === 'GET'){
        const name = pathSplit[2];
        if (IsEmptyOrNull(name)){
            Response(res, 200, JSON.stringify(
                Object.keys(config.databases).map(databaseName => {
                        return {
                            name: databaseName,
                            tables: Object.keys(config.databases[databaseName].tables).length
                        }
                    })
                ));
            return;
        }
        
        if (config.databases[name]){
            Response(res, 200, JSON.stringify({
                tables: Object.keys(config.databases[name].tables).length
            }));
            return;
        }

        Response(res, 400, `{ "error": "The database ${name} not exist !" }`);
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
            const databaseObject = JSON.parse(data);
            if(!CompareObjectStruct(strucObject, databaseObject) 
            || typeof databaseObject.name !== 'string'
            || IsEmptyOrNull(databaseObject.name)){
                Response(res, 400, `{ "error": "Invalid json"`);
                return;
            }
            
            if (config.databases[databaseObject.name]){
                Response(res, 400, `{ "error": "The database ${databaseObject.name} already exist !" }`);
                return;
            }

            config.databases[databaseObject.name] = { tables: {} }

            Response(res, 201, JSON.stringify({ name: databaseObject.name, tables: 0 }));
        });
    }else if(method === 'DELETE'){
        
        const name = pathSplit[2];
        if(IsEmptyOrNull(name)){
            Response(res, 400, `{ "error": "Invalid path" }"`);
            return;
        }
        
        if (!config.databases[name]){
            Response(res, 400, `{ "error": "The database ${name} not exist !" }`);
            return;
        }

        Object.keys(config.databases[name].tables).forEach(elem => {
            const filePath = `config/${name}_${elem}.json`
            clearInterval(datasFiles[filePath].interval)
            delete datasFiles[filePath]
            fs.unlinkSync(filePath);
        })
        delete config.databases[name]

        Response(res, 204, '');
    }else if(method === 'OPTIONS'){
        Response(res, 200, '{ "method": ["GET", "POST", "DELETE"] }')
    }
    else{
        Response(res, 405, `{ "error": "Method not allowed" }`);
    }
}