const { Response } = require('../services/responseService');
const { CompareObjectStruct, InitObject } = require('../utils/objectUtil');
const { IsEmptyOrNull } = require('../utils/stringUtils');

exports.ColumnController = (req, res, config, datasFiles) => {
    const path = decodeURI(req.url.split("?")[0]);
    const pathSplit = path.split("/");
    const method = req.method;

    const databaseName = pathSplit[2];
    if (!config.file.databases[databaseName]){
        Response(res, 400, { error: `The database ${databaseName} does not exist !` });
        return;
    }
    const tableName = pathSplit[4];
    if (!config.file.databases[databaseName].tables[tableName]){
        Response(res, 400, { error: `The table ${tableName} does not exist !` });
        return;
    }

    const fileDatas = datasFiles[`config/${databaseName}_${tableName}.json`]

    if(method === 'GET'){
        const name = pathSplit[6];
        if (IsEmptyOrNull(name) && pathSplit.length === 6){
            Response(res, 200, Object.keys(config.file.databases[databaseName].tables[tableName].columns).map(columnName =>{
                    return{
                        name: columnName,
                        ...config.file.databases[databaseName].tables[tableName].columns[columnName]
                    }
                })
            );
            return;
        }
        
        if (config.file.databases[databaseName].tables[tableName].columns[name]){
            Response(res, 200, { name: name, ...config.file.databases[databaseName].tables[tableName].columns[name]});
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
            
            if (columnObject.name === "id"){
                Response(res, 400, { error: `The column name "id" is not allowed !` });
                return;
            }

            if (config.file.databases[databaseName].tables[tableName].columns[columnObject.name] !== undefined){
                Response(res, 400, { error: `The column ${columnObject.name} already exist !` });
                return;
            }

            config.file.databases[databaseName].tables[tableName].columns[columnObject.name] = { 
                isIndex: columnObject.isIndex,
                type: columnObject.type
            }

            if(columnObject.isIndex){
                fileDatas.file.index[columnObject.name] = { }
            }

            Object.keys(fileDatas.file.datas).forEach(id => {
                fileDatas.file.datas[id][columnObject.name] = null;
            })

            config.isModified = true;
            fileDatas.isModified = true;

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

            if (config.file.databases[databaseName].tables[tableName].columns[name] === undefined){
                Response(res, 400, { error: `The column ${name} does not exist !` });
                return;
            }

            if (name !== columnObject.name){
                Response(res, 400, { error: `Wrong name !` });
                return;
            }

            if (config.file.databases[databaseName].tables[tableName].columns[name].type !== columnObject.type){
                Response(res, 400, { error: `Type can't be modified !` });
                return;
            }

            if(columnObject.isIndex){
                if (!fileDatas.file.index[name]){ // column is not an index
                    fileDatas.file.index[name] = { }
                }
            }
            else{
                if (fileDatas.file.index[name]){ // column is an index
                    delete fileDatas.file.index[name]
                }
            }
            config.file.databases[databaseName].tables[tableName].columns[name].isIndex = columnObject.isIndex

            config.isModified = true;
            fileDatas.isModified = true;

            Response(res, 204);
        });
    }else if(method === 'DELETE' && pathSplit.length === 7){
        const name = pathSplit[6];
        if (IsEmptyOrNull(name)){
            Response(res, 400, { error: "Invalid path" });
            return;
        }

        if (config.file.databases[databaseName].tables[tableName].columns[name] === undefined){
            Response(res, 400, { error: `The column ${name} does not exist !` });
            return;
        }

        if (config.file.databases[databaseName].tables[tableName].columns[name].isIndex){
            delete fileDatas.file.index[name]
        }
        
        Object.keys(fileDatas.file.datas).forEach(id => {
            delete fileDatas.file.datas[id][name];
        })

        delete config.file.databases[databaseName].tables[tableName].columns[name]

        config.isModified = true;
        fileDatas.isModified = true;

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