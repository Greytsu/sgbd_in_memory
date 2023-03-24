exports.Response = (res, code, message) => {
    const path = res.req.url.split("?")[0];
    const pathSplit = path.split("/");
    
    if(path === '/' || path === '/status'){
        res.setHeader("Access-Control-Allow-Methods", "GET")
    }
    else if(pathSplit[1] === 'databases' && pathSplit.length < 4){
        if (pathSplit.length === 2){
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        }else{
            res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS")
        }
    } 
    else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables' && pathSplit.length < 6){
        if (pathSplit.length === 4){
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        }else{
            res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS")
        }
    }
    else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables' && pathSplit[5] === 'columns'){
        ColumnController(req, res, config, datasFiles);
    }
    else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables' && pathSplit[5] === 'datas'){
        DataController(req, res, config, datasFiles);
    }









    else if(pathSplit[1] === 'databases' 
    || (pathSplit[1] === 'databases' && pathSplit[3] === 'tables')){
    }
    else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables' 
    && (pathSplit[3] === 'columns' || pathSplit[3] === 'datas')){
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.writeHead(code, {'Content-Type' : 'application/json'});
    res.end(message);
}