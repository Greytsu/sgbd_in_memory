const { Response } = require('../services/responseService');
const { CompareObjectStruct, InitObject } = require('../utils/objectUtil');
const { IsEmptyOrNull } = require('../utils/stringUtils');

exports.ColumnController = (req, res, config, datasFiles) => {
    const path = req.url.split("?")[0];
    const pathSplit = path.split("/");
    const method = req.method;

    const databaseName = pathSplit[2];
    if (!config.databases[databaseName]){
        Response(res, 400, `{ "error": "The database ${databaseName} not exist !" }`);
        return;
    }
    const tableName = pathSplit[4];
    if (!config.databases[databaseName].tables[tableName]){
        Response(res, 400, `{ "error": "The table ${tableName} not exist !" }`);
        return;
    }

    const dataFilePath = `config/${databaseName}_${tableName}.json`
    const savedDatas = datasFiles.filter(x => x.filePath === dataFilePath)[0]

    if(method === 'GET'){
        const name = pathSplit[6];
        if (IsEmptyOrNull(name)){
            Response(res, 200, JSON.stringify(
                Object.keys(config.databases[databaseName].tables[tableName].columns).map(columnName =>{
                    return{
                        name: columnName,
                        ...config.databases[databaseName].tables[tableName].columns[columnName]
                    }
                })
            ));
            return;
        }
        
        if (config.databases[databaseName].tables[tableName].columns[name]){
            Response(res, 200, JSON.stringify({ ...config.databases[databaseName].tables[tableName].columns[name]}));
            return;
        }

        Response(res, 400, `{ "error": "The column ${name} not exist !" }`);
    }else if(method === 'POST'){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(IsEmptyOrNull(data)){
                Response(res, 400, `{ "error": "Empty json"`);
                return;
            }
            
            const strucObject = InitObject(["name", "isKey","isIndex"]);
            const columnObject = JSON.parse(data);
            if(!CompareObjectStruct(strucObject, columnObject) 
            || typeof columnObject.isKey !== 'boolean' 
            || typeof columnObject.isIndex !== 'boolean' 
            || typeof columnObject.name !== 'string'){
                Response(res, 400, `{ "error": "Invalid json" }`);
                return;
            }

            console.log("columnObject", columnObject)
            if (config.databases[databaseName].tables[tableName].columns[columnObject.name] !== undefined){
                Response(res, 400, `{ "error": "The column ${columnObject.name} already exist !" }`);
                return;
            }

            config.databases[databaseName].tables[tableName].columns[columnObject.name] = { 
                isKey: columnObject.isKey, 
                isIndex: columnObject.isIndex 
            }

            if (columnObject.isKey){
                savedDatas.data.key = columnObject.name
                savedDatas.data.index[columnObject.name] = { }
                Object.keys(config.databases[databaseName].tables[tableName].columns)
                    .filter(key => key !== columnObject.name)
                    .forEach(key =>  {
                        config.databases[databaseName].tables[tableName].columns[key].isKey = false
                    })
                config.databases[databaseName].tables[tableName].columns[columnObject.name].isIndex = true
            }else if(columnObject.isIndex){
                savedDatas.data.index[columnObject.name] = { }
            }

            Response(res, 201, JSON.stringify(columnObject));
        });
    }else if(method === 'PUT'){
        const name = pathSplit[6];
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if (IsEmptyOrNull(name)){
                Response(res, 400, `{ "error": "Invalid path" }`);
                return;
            }

            if(IsEmptyOrNull(data)){
                Response(res, 400, `{ "error": "Empty json"`);
                return;
            }
            
            const columnObject = JSON.parse(data);
            if(!CompareObjectStruct(InitObject(["isKey", "isIndex"]), columnObject) 
            || typeof columnObject.isKey !== 'boolean' 
            || typeof columnObject.isIndex !== 'boolean' ){
                Response(res, 400, `{ "error": "Invalid json" }`);
                return;
            }

            if (config.databases[databaseName].tables[tableName].columns[name] === undefined){
                Response(res, 400, `{ "error": "The column ${name} does not exist !" }`);
                return;
            }
            
            if (savedDatas.data.key === name && !columnObject.isKey){
                Response(res, 400, `{ "error": "Cannot remove primary key" }`);
                return;
            }

            if (columnObject.isKey){
                savedDatas.data.key = name
                if (!savedDatas.data.index[name]){ // column is not an index
                    savedDatas.data.index[name] = { }
                }
                
                Object.keys(config.databases[databaseName].tables[tableName].columns)
                    .forEach(key =>  {
                        config.databases[databaseName].tables[tableName].columns[key].isKey = false
                    })

                config.databases[databaseName].tables[tableName].columns[name].isKey = true
                config.databases[databaseName].tables[tableName].columns[name].isIndex = true
            }else {
                if(columnObject.isIndex){
                    if (!savedDatas.data.index[name]){ // column is not an index
                        savedDatas.data.index[name] = { }
                    }
                }else if (!columnObject.isIndex){
                    if (savedDatas.data.index[name]){ // column is an index
                        delete savedDatas.data.index[name]
                    }
                }
                config.databases[databaseName].tables[tableName].columns[name].isIndex = columnObject.isIndex
            }

            Response(res, 204, '');
        });
    }else if(method === 'DELETE'){
        const name = pathSplit[6];
        if (IsEmptyOrNull(name)){
            Response(res, 400, `{ "error": "Invalid path" }`);
            return;
        }

        if (config.databases[databaseName].tables[tableName].columns[name] === undefined){
            Response(res, 400, `{ "error": "The column ${name} not exist !" }`);
            return;
        }

        if (savedDatas.data.key === name){
            Response(res, 400, `{ "error": "Cannot delete primary key" }`);
            return;
        }

        if (config.databases[databaseName].tables[tableName].columns[name].isIndex){
            delete savedDatas.data.index[name]
        }

        delete config.databases[databaseName].tables[tableName].columns[name]

        Response(res, 204, '');
    }else if(method === 'OPTIONS'){
        Response(res, 200, '{ "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }')
    }
    else{
        Response(res, 405, `{ "error": "Method not allowed" }`);
    }
}