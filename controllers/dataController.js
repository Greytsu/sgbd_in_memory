const { Response } = require('../services/responseService');
const { GetFilter, DynamicFilter } = require('../utils/filterUtil');
const { CompareObjectStruct, InitObject, SortObject } = require('../utils/objectUtil');
const { GetSortFields, SortDatas } = require('../utils/sortUtil');
const { IsEmptyOrNull } = require('../utils/stringUtils');

exports.DataController = (req, res, config, datasFiles) => {
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
        const id = pathSplit[6];
        if (IsEmptyOrNull(id) && pathSplit.length === 6){
            let listIds = Object.keys(fileDatas.file.datas)

            const filters = GetFilter(req)
            if(filters.length > 0) {
                listIds = DynamicFilter(config.file.databases[databaseName].tables[tableName].columns, fileDatas.file, filters)
            }

            let datas = listIds.map(elem => {
                return{
                    id: elem,
                    ...fileDatas.file.datas[elem]
                }
            })

            const sortFields = GetSortFields(req)
            if(sortFields.length > 0) {
                datas = SortDatas(datas, sortFields)
            }
            
            Response(res, 200, datas);
            return;
        }

        if (fileDatas.file.datas[id]){
            Response(res, 200, { id: id, ...fileDatas.file.datas[id] });
            return;
        }

        Response(res, 400, { error: `The object ${id} does not exist !` });
    }else if(method === 'POST' && pathSplit.length === 6){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(IsEmptyOrNull(data)){
                Response(res, 400, { error: "Empty json" });
                return;
            }
            
            const columnsName = Object.keys(config.file.databases[databaseName].tables[tableName].columns)
            const strucObject = InitObject(columnsName);
            const datasObject = SortObject(JSON.parse(data));

            let hasValidType = true;
            Object.keys(datasObject).forEach(elem => {
                if (config.file.databases[databaseName].tables[tableName].columns[elem]?.type !== typeof datasObject[elem]){
                    hasValidType = false;
                }
            })
            
            if(!(CompareObjectStruct(strucObject, datasObject) && hasValidType)){
                Response(res, 400, { error: "Invalid json" });
                return;
            }

            fileDatas.file.sequence++
            fileDatas.file.datas[fileDatas.file.sequence] = datasObject;

            Object.keys(fileDatas.file.index).forEach(key => {
                if (!fileDatas.file.index[key][datasObject[key]]){
                    fileDatas.file.index[key][datasObject[key]] = []
                }
                fileDatas.file.index[key][datasObject[key]].push(fileDatas.file.sequence)
            })

            fileDatas.isModified = true;

            Response(res, 201, { id: fileDatas.file.sequence, ...datasObject });
        });
    }else if(method === 'PUT' && pathSplit.length === 7){
        const id = parseInt(pathSplit[6]);
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if (!fileDatas.file.datas[id]){
                Response(res, 400, { error: `The object ${id} does not exist !` });
                return;
            }
            
            if(IsEmptyOrNull(data)){
                Response(res, 400, { error: "Empty json" });
                return;
            }

            const columnsName = [ "id", ...Object.keys(config.file.databases[databaseName].tables[tableName].columns) ];
            const strucObject = InitObject(columnsName);
            const datasObject = SortObject(JSON.parse(data));

            let hasValidType = true;
            Object.keys(datasObject).forEach(elem => {
                if (elem !== "id"){
                    if (config.file.databases[databaseName].tables[tableName].columns[elem]?.type !== typeof datasObject[elem]){
                        hasValidType = false;
                    }
                }
                else if (typeof datasObject[elem] !== "number"){
                    hasValidType = false;
                }
            })

            if(!(CompareObjectStruct(strucObject, datasObject) && hasValidType)){
                Response(res, 400, { error: "Invalid json" });
                return;
            }

            if (id !== datasObject.id){
                Response(res, 400, { error: `Wrong id !` });
                return;
            }

            Object.keys(fileDatas.file.index).forEach(key => {
                
                const index = fileDatas.file.index[key][fileDatas.file.datas[id][key]].findIndex(x => x == id)
                if (index !== -1){
                    fileDatas.file.index[key][fileDatas.file.datas[id][key]].splice(index, 1);
                }

                if (!fileDatas.file.index[key][datasObject[key]]){
                    fileDatas.file.index[key][datasObject[key]] = []
                }
                
                fileDatas.file.index[key][datasObject[key]].push(id)

                if (fileDatas.file.index[key][fileDatas.file.datas[id][key]].length === 0){
                    delete fileDatas.file.index[key][fileDatas.file.datas[id][key]]
                }
            })

            fileDatas.file.datas[id] = datasObject;

            fileDatas.isModified = true;

            Response(res, 204);
        });
    }else if(method === 'DELETE' && pathSplit.length === 7){
        const id = pathSplit[6];
        if (!id){
            Response(res, 400, { error: "Invalid path" });
            return;
        }

        if (!fileDatas.file.datas[id]){
            Response(res, 400, { error: `The object ${id} does not exist !` });
            return;
        }

        Object.keys(fileDatas.file.index).forEach(key => {
            const index = fileDatas.file.index[key][fileDatas.file.datas[id][key]].findIndex(x => x == id)
            if (index !== -1){
                fileDatas.file.index[key][fileDatas.file.datas[id][key]].splice(index, 1);
            }
            if (fileDatas.file.index[key][fileDatas.file.datas[id][key]].length === 0){
                delete fileDatas.file.index[key][fileDatas.file.datas[id][key]]
            }
        })
        
        delete fileDatas.file.datas[id]

        fileDatas.isModified = true;

        Response(res, 204);
    }else if(method === 'OPTIONS'){
        if (pathSplit.length === 6){
            Response(res, 200, { 
                method: ["GET", "POST", "OPTIONS"],
                queryParam: [
                    {
                        name: "filter",
                        methodAllowed: "GET",
                        queryParam: {
                            key: "filters",
                            value: ["column name", "operator", "value"],
                            operators: [">=", "<=", ">", "<", "!=", "="],
                            separator: ","
                        }
                    },{
                        name: "sort",
                        methodAllowed: "GET",
                        queryParam: {
                            key: "sort",
                            value: "column name",
                            separator: ",",
                            descending: {
                                value: "!",
                                info: "before value"
                            }
                        }
                    }
                ]
            })
            return;
        }
        Response(res, 200, { method: ["GET", "PUT", "DELETE", "OPTIONS"] })
    }
    else{
        Response(res, 405, { error: "Method not allowed" });
    }
}