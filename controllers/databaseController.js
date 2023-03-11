const { Response } = require('../services/responseService')
const { IsEmptyOrNull } = require('../utils/stringUtils');

exports.DatabaseController = (req, res, config, datasFiles) => {
    const path = req.url.split("?")[0];
    const pathSplit = path.split("/");
    const method = req.method;
    
    if(method === 'GET'){
        const name = pathSplit[2];
        if (IsEmptyOrNull(name)){
            Response(res, 200, JSON.stringify(
                    Object.keys(config.databases).map(databaseName => {
                        return {
                            name: databaseName,
                            tables: Object.keys(config.databases[databaseName].tables).map(tableName =>{
                                return {
                                    name: tableName,
                                    columns: Object.keys(config.databases[databaseName].tables[tableName].columns).length,
                                    datas: datasFiles.filter(x => x.filePath === `config/${databaseName}_${tableName}.json`)[0].data.datas.length
                                }
                            })
                        }
                    })
                ));
            return;
        }
        
        if (config.databases[name]){
            Response(res, 200, JSON.stringify({
                tables: Object.keys(config.databases[name].tables).map(tableName =>{
                    return {
                        name: tableName,
                        columns: Object.keys(config.databases[name].tables[tableName].columns).length,
                        datas: datasFiles.filter(x => x.filePath === `config/${name}_${tableName}.json`)[0].data.datas.length
                    }
                })
            }));
            return;
        }

        Response(res, 400, `{ "error": "The database ${name} not exist !" }`);
    }else if(method === 'POST'){
        let data ='';
        req.on('data', (chunk) => {
            data = chunk.toString();
        }).on('end', () => {

            if(IsEmptyOrNull(data)){
                Response(res, 400, `{ "error": "Empty json"`);
                return;
            }
            
            const { name } = JSON.parse(data);
            if(IsEmptyOrNull(name)){
                Response(res, 400, `{ "error": "Invalid json"`);
                return;
            }
            
            if (config.databases[name]){
                Response(res, 400, `{ "error": "The database ${name} already exist !" }`);
                return;
            }

            config.databases[name] = { tables: {} }

            console.log("config", config)

            Response(res, 201, JSON.stringify(config.databases[name]));
        });
    }else if(method === 'DELETE'){
        
        const name = pathSplit[2];
        if(IsEmptyOrNull(name)){
            Response(res, 400, `{ "error": "Invalid path" }"`);
            return;
        }
        
        if (!config.databases[name]){
            Response(res, 400, `{ "error": "The database ${name} not exist !" }`);
            return;
        }

        delete config.databases[name]

        Response(res, 204, '');
    }else if(method === 'OPTIONS'){
        Response(res, 200, '{ "method": ["GET", "POST", "DELETE"] }')
    }
    else{
        Response(res, 405, `{ "error": "Method not allowed" }`);
    }
}