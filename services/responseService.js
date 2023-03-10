exports.Response = (res, code, message) => {
    const path = res.req.url.split("?")[0];
    const pathSplit = path.split("/");
    
    if(path === '/' || path === '/status'){
        res.setHeader("Access-Control-Allow-Methods", "GET")
    }
    else if(pathSplit[1] === 'databases' 
    || (pathSplit[1] === 'databases' && pathSplit[3] === 'tables')){
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
    }
    else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables' 
    && (pathSplit[3] === 'columns' || pathSplit[3] === 'datas')){
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(code, {'Content-Type' : 'application/json'});
    res.end(message);
}