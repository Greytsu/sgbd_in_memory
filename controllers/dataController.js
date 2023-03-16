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

    const savedDatas = datasFiles[`config/${databaseName}_${tableName}.json`]

    if(method === 'GET'){
        const id = pathSplit[6];
        if (IsEmptyOrNull(id)){
            Response(res, 200, JSON.stringify(Object.keys(savedDatas.datas).map(elem => {
                return{
                    id: elem,
                    ...savedDatas.datas[elem]
                }
            })));
            return;
        }

        if (savedDatas.datas[id]){
            Response(res, 200, JSON.stringify({
                id: id,
                ...savedDatas.datas[id]
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
            if(!CompareObjectStruct(strucObject, datasObject)){
                Response(res, 400, `{ "error": "Invalid json" }`);
                return;
            }

            savedDatas.sequence++
            savedDatas.datas[savedDatas.sequence] = datasObject;

            Object.keys(savedDatas.index).forEach(key => {
                if (!savedDatas.index[key][datasObject[key]]){
                    savedDatas.index[key][datasObject[key]] = []
                }
                savedDatas.index[key][datasObject[key]].push(savedDatas.sequence)
            })

            Response(res, 201, JSON.stringify({id: savedDatas.sequence, ...datasObject}));
        });
    }else if(method === 'PUT'){
        const id = parseInt(pathSplit[6]);
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if (!savedDatas.datas[id]){
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
            if(!CompareObjectStruct(strucObject, datasObject)){
                Response(res, 400, `{ "error": "Invalid json" }`);
                return;
            }

            Object.keys(savedDatas.index).forEach(key => {
                
                const index = savedDatas.index[key][savedDatas.datas[id][key]].findIndex(x => x == id)
                if (index !== -1){
                    savedDatas.index[key][savedDatas.datas[id][key]].splice(index, 1);
                }

                if (!savedDatas.index[key][datasObject[key]]){
                    savedDatas.index[key][datasObject[key]] = []
                }
                
                savedDatas.index[key][datasObject[key]].push(id)

                if (savedDatas.index[key][savedDatas.datas[id][key]].length === 0){
                    delete savedDatas.index[key][savedDatas.datas[id][key]]
                }
            })
            
            savedDatas.datas[id] = datasObject;

            Response(res, 204, '');
        });
    }else if(method === 'DELETE'){
        const id = pathSplit[6];
        if (!id){
            Response(res, 400, `{ "error": "Invalid path" }`);
            return;
        }

        if (!savedDatas.datas[id]){
            Response(res, 400, `{ "error": "The object ${id} not exist !" }`);
            return;
        }

        Object.keys(savedDatas.index).forEach(key => {
            const index = savedDatas.index[key][savedDatas.datas[id][key]].findIndex(x => x == id)
            if (index !== -1){
                savedDatas.index[key][savedDatas.datas[id][key]].splice(index, 1);
            }
            if (savedDatas.index[key][savedDatas.datas[id][key]].length === 0){
                delete savedDatas.index[key][savedDatas.datas[id][key]]
            }
        })
        
        delete savedDatas.datas[id]

        Response(res, 204, '');
    }else if(method === 'OPTIONS'){
        Response(res, 200, '{ "method": ["GET", "POST", "PUT", "DELETE"] }')
    }
    else{
        Response(res, 405, `{ "error": "Method not allowed" }`);
    }
}