exports.Response = (res, code, message) => {
    const path = res.req.url.split("?")[0];
    const pathSplit = path.split("/");
    
    if(path === '/' || path === '/status'){
        res.setHeader("Access-Control-Allow-Methods", "GET")
    }else if(pathSplit[1] === 'databases' && pathSplit.length < 4){
        if (pathSplit.length === 2){
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        }else{
            res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS")
        }
    }else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables' && pathSplit.length < 6){
        if (pathSplit.length === 4){
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        }else{
            res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS")
        }
    }else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables' && pathSplit.length >= 6){
        if (pathSplit.length === 6){
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        }else{
            res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS")
        }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.writeHead(code, {'Content-Type' : 'application/json'});
    res.end(message);
}