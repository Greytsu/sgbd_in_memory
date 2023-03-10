const fs = require('fs');
const { Response } = require('../services/responseService')

exports.TableController = (req, res, config) => {
    const path = req.url.split("?")[0];
    const pathSplit = path.split("/");
    const method = req.method;

    const databaseName = pathSplit[2];
    const databaseIndex = config.databases.findIndex(x => x.name == databaseName);
    if (databaseIndex === -1){
        Response(res, 400, `{ "error": "The database ${databaseName} not exist !" }`);
        return;
    }
    console.log("databaseName", databaseName)
    if(method === 'GET'){
        const tableName = pathSplit[4];
        if (!tableName){
            Response(res, 200, JSON.stringify(config.databases[databaseIndex].tables));
            return;
        }
        const tablesFilter = config.databases[databaseIndex].tables.filter(x => x.name == tableName);
        if (tablesFilter.length > 0){
            Response(res, 200, JSON.stringify(tablesFilter[0]));
            return;
        }
        Response(res, 400, `{ "error": "The table ${tableName} not exist !" }`);
    }else if(method === 'POST'){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(IsEmptyOrNull(data)){
                Response(res, 400, `{ "error": "Empty json"`);
                return;
            }
            
            const { name, columns } = JSON.parse(data);
            if(name === '' || !name || columns.lenght <= 0 || !columns){
                Response(res, 400, `{ "error": "Invalid json"`);
                return;
            }
            
            if (config.databases[databaseIndex].tables.filter(x => x.name == name).length > 0){
                Response(res, 400, `{ "error": "The table ${name} already exist !" }`);
                return;
            }

            const table = { name: name, columns: columns.filter(x => x === 'ID').length > 0 ? columns : ["ID", ...columns]} 
            config.databases[databaseIndex].tables.push(table);

            fs.writeFileSync(`config/${databaseName}_${name}.json`, '{"sequence" : 1, "datas" : [] }');

            Response(res, 201, JSON.stringify(table));
        });
    }else if(method === 'PUT'){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(IsEmptyOrNull(data)){
                Response(res, 400, `{ "error": "Empty json"`);
                return;
            }
            
            const { name, columns } = JSON.parse(data);
            if(name === '' || !name || columns.lenght <= 0 || !columns){
                Response(res, 400, `{ "error": "Invalid json"`);
                return;
            }
            
            const index = config.databases[databaseIndex].tables.findIndex(x => x.name == name);
            if (index === -1){
                Response(res, 400, `{ "error": "The table ${name} not exist !" }`);
                return;
            }

            const table = { name: name, columns: columns}
            config.databases[databaseIndex].tables[index] = table;

            Response(res, 204, '');
        });
    }else if(method === 'DELETE'){
        
        const name = pathSplit[4];
        if(name === '' || !name){
            Response(res, 400, `{ "error": "Invalid path"`);
            return;
        }
        
        const index = config.databases[databaseIndex].tables.findIndex(x => x.name == name);
        if (index === -1){
            Response(res, 400, `{ "error": "The table ${name} not exist !" }`);
            return;
        }

        config.databases[databaseIndex].tables.splice(index, 1);

        Response(res, 204, '');
        res.end();
    }else if(method === 'OPTIONS'){
        Response(res, 200, '{ "method": ["GET", "POST", "PUT", "DELETE"] }')
    }
    else{
        Response(res, 405, `{ "error": "Method not allowed" }`);
    }
}