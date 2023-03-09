const { Response } = require('../services/responseService')

exports.DatabaseController = (req, res, config) => {
    const path = req.url.split("?")[0];
    const pathSplit = path.split("/");
    const method = req.method;
    
    if(method === 'GET'){
        const name = pathSplit[2];
        if (!name){
            Response(res, 200, JSON.stringify(config.databases));
            return;
        }
        const databasesFilter = config.databases.filter(x => x.name == name);
        if (databasesFilter.length > 0){
            Response(res, 200, JSON.stringify(databasesFilter[0]));
            return;
        }
        Response(res, 400, `{ "error": "The database ${name} not exist !" }`);
    }else if(method === 'POST'){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(data.trim() === '' || !data){
                Response(res, 400, `{ "error": "Empty json"`);
                return;
            }
            
            const { name } = JSON.parse(data);
            if(name === '' || !name){
                Response(res, 400, `{ "error": "Invalid json"`);
                return;
            }
            
            if (config.databases.filter(x => x.name == name).length > 0){
                Response(res, 400, `{ "error": "The database ${name} already exist !" }`);
                return;
            }

            const database = { name: name, tables: []}
            config.databases.push(database);

            Response(res, 201, JSON.stringify(database));
        });
    }else if(method === 'DELETE'){
        
        const name = pathSplit[2];
        if(name === '' || !name){
            Response(res, 400, `{ "error": "Invalid path" }"`);
            return;
        }
        
        const index = config.databases.findIndex(x => x.name == name);
        if (index === -1){
            Response(res, 400, `{ "error": "The database ${name} not exist !" }`);
            return;
        }

        config.databases.splice(index, 1);

        Response(res, 204, '');
    }else{
        Response(res, 405, `{ "error": "Method not allowed" }`);
    }
}