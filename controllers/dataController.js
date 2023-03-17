const { Response } = require('../services/responseService');
const { CompareObjectStruct, InitObject, SortObject } = require('../utils/objectUtil');
const { IsEmptyOrNull } = require('../utils/stringUtils');

exports.DataController = (req, res, config, datasFiles) => {
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

    const fileDatas = datasFiles[`config/${databaseName}_${tableName}.json`].file

    if(method === 'GET'){
        const id = pathSplit[6];
        if (IsEmptyOrNull(id)){
            Response(res, 200, JSON.stringify(Object.keys(fileDatas.datas).map(elem => {
                return{
                    id: elem,
                    ...fileDatas.datas[elem]
                }
            })));
            return;
        }

        if (fileDatas.datas[id]){
            Response(res, 200, JSON.stringify({
                id: id,
                ...fileDatas.datas[id]
            }));
            return;
        }

        Response(res, 400, `{ "error": "The object ${id} not exist !" }`);
    }else if(method === 'POST'){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(IsEmptyOrNull(data)){
                Response(res, 400, `{ "error": "Empty json"`);
                return;
            }
            
            const columnsName = Object.keys(config.databases[databaseName].tables[tableName].columns)
            const strucObject = InitObject(columnsName);
            const datasObject = SortObject(JSON.parse(data));

            let hasValidType = true;
            Object.keys(datasObject).forEach(elem => {
                if (config.databases[databaseName].tables[tableName].columns[elem].type !== typeof datasObject[elem]){
                    hasValidType = false;
                }
            })
            
            if(!(CompareObjectStruct(strucObject, datasObject) && hasValidType)){
                Response(res, 400, `{ "error": "Invalid json" }`);
                return;
            }

            fileDatas.sequence++
            fileDatas.datas[fileDatas.sequence] = datasObject;

            Object.keys(fileDatas.index).forEach(key => {
                if (!fileDatas.index[key][datasObject[key]]){
                    fileDatas.index[key][datasObject[key]] = []
                }
                fileDatas.index[key][datasObject[key]].push(fileDatas.sequence)
            })

            Response(res, 201, JSON.stringify({id: fileDatas.sequence, ...datasObject}));
        });
    }else if(method === 'PUT'){
        const id = parseInt(pathSplit[6]);
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if (!fileDatas.datas[id]){
                Response(res, 400, `{ "error": "The object ${id} not exist !" }`);
                return;
            }
            
            if(IsEmptyOrNull(data)){
                Response(res, 400, `{ "error": "Empty json"`);
                return;
            }

            const columnsName = Object.keys(config.databases[databaseName].tables[tableName].columns);
            const strucObject = InitObject(columnsName);
            const datasObject = SortObject(JSON.parse(data));

            let hasValidType = true;
            Object.keys(datasObject).forEach(elem => {
                if (config.databases[databaseName].tables[tableName].columns[elem].type !== typeof datasObject[elem]){
                    hasValidType = false;
                }
            })

            if(!(CompareObjectStruct(strucObject, datasObject) && hasValidType)){
                Response(res, 400, `{ "error": "Invalid json" }`);
                return;
            }

            Object.keys(fileDatas.index).forEach(key => {
                
                const index = fileDatas.index[key][fileDatas.datas[id][key]].findIndex(x => x == id)
                if (index !== -1){
                    fileDatas.index[key][fileDatas.datas[id][key]].splice(index, 1);
                }

                if (!fileDatas.index[key][datasObject[key]]){
                    fileDatas.index[key][datasObject[key]] = []
                }
                
                fileDatas.index[key][datasObject[key]].push(id)

                if (fileDatas.index[key][fileDatas.datas[id][key]].length === 0){
                    delete fileDatas.index[key][fileDatas.datas[id][key]]
                }
            })

            fileDatas.datas[id] = datasObject;

            Response(res, 204, '');
        });
    }else if(method === 'DELETE'){
        const id = pathSplit[6];
        if (!id){
            Response(res, 400, `{ "error": "Invalid path" }`);
            return;
        }

        if (!fileDatas.datas[id]){
            Response(res, 400, `{ "error": "The object ${id} not exist !" }`);
            return;
        }

        Object.keys(fileDatas.index).forEach(key => {
            const index = fileDatas.index[key][fileDatas.datas[id][key]].findIndex(x => x == id)
            if (index !== -1){
                fileDatas.index[key][fileDatas.datas[id][key]].splice(index, 1);
            }
            if (fileDatas.index[key][fileDatas.datas[id][key]].length === 0){
                delete fileDatas.index[key][fileDatas.datas[id][key]]
            }
        })
        
        delete fileDatas.datas[id]

        Response(res, 204, '');
    }else if(method === 'OPTIONS'){
        Response(res, 200, '{ "method": ["GET", "POST", "PUT", "DELETE"] }')
    }
    else{
        Response(res, 405, `{ "error": "Method not allowed" }`);
    }
}