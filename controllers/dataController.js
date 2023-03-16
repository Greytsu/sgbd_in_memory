const { Response } = require('../services/responseService');
const { CompareObjectStruct, InitObject } = require('../utils/objectUtil');
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
        const ID = pathSplit[6];
        if (!ID){
            Response(res, 200, JSON.stringify(savedDatas.data.datas));
            return;
        }

        const savedData = savedDatas.data.datas.filter(x => x.ID == ID)
        if (savedData.length > 0){
            Response(res, 200, JSON.stringify(savedData[0]));
            return;
        }

        Response(res, 400, `{ "error": "The object ${ID} not exist !" }`);
    }else if(method === 'POST'){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(IsEmptyOrNull(data)){
                Response(res, 400, `{ "error": "Empty json"`);
                return;
            }
            
            const columns = config.databases[databaseIndex].tables[tableIndex].columns.filter(x => x !== 'ID');
            const strucObject = InitObject(columns);
            
            const datasObject = JSON.parse(data);
            if(!CompareObjectStruct(strucObject, datasObject)){
                Response(res, 400, `{ "error": "Invalid json" }`);
                return;
            }

            const combinedDatas = { ID: savedDatas.data.sequence++ , ...datasObject };
            savedDatas.data.datas.push(combinedDatas);

            Response(res, 201, JSON.stringify(combinedDatas));
        });
    }else if(method === 'PUT'){
        const ID = pathSplit[6];
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {
            
            if(IsEmptyOrNull(data)){
                Response(res, 400, `{ "error": "Empty json"`);
                return;
            }

            const columns = config.databases[databaseIndex].tables[tableIndex].columns.filter(x => x !== 'ID');
            const strucObject = InitObject(columns);
            
            const datasObject = JSON.parse(data);
            if(!CompareObjectStruct(strucObject, datasObject)){
                Response(res, 400, `{ "error": "Invalid json" }`);
                return;
            }

            const indexData = savedDatas.data.datas.findIndex(x => x.ID == ID)
            if (indexData === -1){
                Response(res, 400, `{ "error": "The object ${ID} not exist !" }`);
                return;
            }
            
            const combinedDatas = { ID: ID , ...datasObject };
            savedDatas.data.datas[indexData] = combinedDatas

            Response(res, 204, '');
        });
    }else if(method === 'DELETE'){
        const ID = pathSplit[6];
        if (!ID){
            Response(res, 400, `{ "error": "Invalid path" }`);
            return;
        }

        const indexData = savedDatas.data.datas.findIndex(x => x.ID == ID)
        if (indexData === -1){
            Response(res, 400, `{ "error": "The object ${ID} not exist !" }`);
            return;
        }

        savedDatas.data.datas.splice(indexData, 1);

        Response(res, 204, '');
    }else if(method === 'OPTIONS'){
        Response(res, 200, '{ "method": ["GET", "POST", "PUT", "DELETE"] }')
    }
    else{
        Response(res, 405, `{ "error": "Method not allowed" }`);
    }
}