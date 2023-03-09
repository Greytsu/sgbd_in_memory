const fs = require('fs');
const { Response } = require('../services/responseService');
const { CompareObjectStruct, InitObject } = require('../utils/objectUtil');
const { IsEmptyOrNull } = require('../utils/stringUtils');

exports.DataController = (req, res, config) => {
    const path = req.url.split("?")[0];
    const pathSplit = path.split("/");
    const method = req.method;

    const databaseName = pathSplit[2];
    const databaseIndex = config.databases.findIndex(x => x.name == databaseName);
    if (databaseIndex === -1){
        Response(res, 400, `{ "error": "The database ${databaseName} not exist !" }`);
        return;
    }
    const tableName = pathSplit[4];
    const tableIndex = config.databases[databaseIndex].tables.findIndex(x => x.name == tableName);
    if (tableIndex === -1){
        Response(res, 400, `{ "error": "The table ${tableName} not exist !" }`);
        return;
    }

    const dataFilePath = `config/${databaseName}_${tableName}.json`

    if(method === 'GET'){
        const ID = pathSplit[6];
        const savedDatas = JSON.parse(fs.readFileSync(dataFilePath));
        if (!ID){
            Response(res, 200, JSON.stringify(savedDatas.datas));
            return;
        }

        const savedData = savedDatas.datas.filter(x => x.ID == ID)
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

            const savedDatas = JSON.parse(fs.readFileSync(dataFilePath));

            const combinedDatas = { ID: savedDatas.sequence++ , ...datasObject };
            savedDatas.datas.push(combinedDatas);

            fs.writeFileSync(dataFilePath, JSON.stringify(savedDatas));
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

            const savedDatas = JSON.parse(fs.readFileSync(dataFilePath));
            const indexData = savedDatas.datas.findIndex(x => x.ID == ID)
            if (indexData === -1){
                Response(res, 400, `{ "error": "The object ${ID} not exist !" }`);
                return;
            }
            
            const combinedDatas = { ID: ID , ...datasObject };
            savedDatas.datas[indexData] = combinedDatas

            fs.writeFileSync(dataFilePath, JSON.stringify(savedDatas));
            Response(res, 204, '');
        });
    }else if(method === 'DELETE'){
        const ID = pathSplit[6];
        if (!ID){
            Response(res, 400, `{ "error": "Invalid path" }`);
            return;
        }

        const savedDatas = JSON.parse(fs.readFileSync(dataFilePath));
        const indexData = savedDatas.datas.findIndex(x => x.ID == ID)
        if (indexData === -1){
            Response(res, 400, `{ "error": "The object ${ID} not exist !" }`);
            return;
        }

        savedDatas.datas.splice(indexData, 1);
        fs.writeFileSync(dataFilePath, JSON.stringify(savedDatas));

        Response(res, 204, '');
    }else{
        Response(res, 405, `{ "error": "Method not allowed" }`);
    }
}