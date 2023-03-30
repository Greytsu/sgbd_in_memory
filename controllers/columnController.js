const { Response } = require('../services/responseService');
const { CompareObjectStruct, InitObject } = require('../utils/objectUtil');
const { IsEmptyOrNull } = require('../utils/stringUtils');

exports.ColumnController = (req, res, config, datasFiles) => {
    const path = req.url.split("?")[0];
    const pathSplit = path.split("/");
    const method = req.method;

    const databaseName = pathSplit[2];
    if (!config.databases[databaseName]){
        Response(res, 400, { error: `The database ${databaseName} does not exist !` });
        return;
    }
    const tableName = pathSplit[4];
    if (!config.databases[databaseName].tables[tableName]){
        Response(res, 400, { error: `The table ${tableName} does not exist !` });
        return;
    }

    const fileDatas = datasFiles[`config/${databaseName}_${tableName}.json`].file

    if(method === 'GET'){
        const name = pathSplit[6];
        if (IsEmptyOrNull(name) && pathSplit.length === 6){
            Response(res, 200, Object.keys(config.databases[databaseName].tables[tableName].columns).map(columnName =>{
                    return{
                        name: columnName,
                        ...config.databases[databaseName].tables[tableName].columns[columnName]
                    }
                })
            );
            return;
        }
        
        if (config.databases[databaseName].tables[tableName].columns[name]){
            Response(res, 200, { name: name, ...config.databases[databaseName].tables[tableName].columns[name]});
            return;
        }

        Response(res, 400, { error: `The column ${name} does not exist !` });
    }else if(method === 'POST' && pathSplit.length === 6){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(IsEmptyOrNull(data)){
                Response(res, 400, { error: "Empty json" });
                return;
            }
            
            const strucObject = InitObject(["name","isIndex", "type"]);
            const columnObject = JSON.parse(data);
            if(!CompareObjectStruct(strucObject, columnObject) 
            || typeof columnObject.isIndex !== 'boolean' 
            || typeof columnObject.name !== 'string'
            || typeof columnObject.type !== 'string'
            || !["number", "string", "boolean"].includes(columnObject.type)){
                Response(res, 400, { error: "Invalid json" });
                return;
            }

            if (config.databases[databaseName].tables[tableName].columns[columnObject.name] !== undefined){
                Response(res, 400, { error: `The column ${columnObject.name} already exist !` });
                return;
            }

            config.databases[databaseName].tables[tableName].columns[columnObject.name] = { 
                isIndex: columnObject.isIndex,
                type: columnObject.type
            }

            if(columnObject.isIndex){
                fileDatas.index[columnObject.name] = { }
            }

            Response(res, 201, columnObject);
        });
    }else if(method === 'PUT' && pathSplit.length === 7){
        const name = pathSplit[6];
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if (IsEmptyOrNull(name)){
                Response(res, 400, { error: "Invalid path" });
                return;
            }

            if(IsEmptyOrNull(data)){
                Response(res, 400, { error: "Empty json" });
                return;
            }
            
            const strucObject = InitObject(["name","isIndex", "type"]);
            const columnObject = JSON.parse(data);
            if(!CompareObjectStruct(strucObject, columnObject) 
            || typeof columnObject.isIndex !== 'boolean' 
            || typeof columnObject.name !== 'string'
            || typeof columnObject.type !== 'string'
            || !["number", "string", "boolean"].includes(columnObject.type)){
                Response(res, 400, { error: "Invalid json" });
                return;
            }

            if (config.databases[databaseName].tables[tableName].columns[name] === undefined){
                Response(res, 400, { error: `The column ${name} does not exist !` });
                return;
            }

            if (name !== columnObject.name){
                Response(res, 400, { error: `Wrong name !` });
                return;
            }

            if (config.databases[databaseName].tables[tableName].columns[name].type !== columnObject.type){
                Response(res, 400, { error: `Type can't be modified !` });
                return;
            }

            if(columnObject.isIndex){
                if (!fileDatas.index[name]){ // column is not an index
                    fileDatas.index[name] = { }
                }
            }
            else{
                if (fileDatas.index[name]){ // column is an index
                    delete fileDatas.index[name]
                }
            }
            config.databases[databaseName].tables[tableName].columns[name].isIndex = columnObject.isIndex

            Response(res, 204);
        });
    }else if(method === 'DELETE' && pathSplit.length === 7){
        const name = pathSplit[6];
        if (IsEmptyOrNull(name)){
            Response(res, 400, { error: "Invalid path" });
            return;
        }

        if (config.databases[databaseName].tables[tableName].columns[name] === undefined){
            Response(res, 400, { error: `The column ${name} does not exist !` });
            return;
        }

        if (config.databases[databaseName].tables[tableName].columns[name].isIndex){
            console.log("fileDatas", fileDatas)
            delete fileDatas.index[name]
        }

        delete config.databases[databaseName].tables[tableName].columns[name]

        Response(res, 204);
    }else if(method === 'OPTIONS'){
        if (pathSplit.length === 6){
            Response(res, 200, { method: ["GET", "POST", "OPTIONS"] })
            return;
        }
        Response(res, 200, { method: ["GET", "PUT", "DELETE", "OPTIONS"] })
    }
    else{
        Response(res, 405, { error: "Method not allowed" });
    }
}