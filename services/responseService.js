exports.Response = (res, code, message) => {
    const path = res.req.url.split("?")[0];
    const pathSplit = path.split("/");
    
    if(path === '/' || path === '/status'){
        res.setHeader("Access-Control-Allow-Methods", "GET")
    }
    else if(pathSplit[1] === 'databases' && pathSplit[3] === 'tables'){
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    }
    else if(pathSplit[1] === 'databases'){
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
    }

    res.writeHead(code, {'Content-Type' : 'application/json'});
    res.end(message);
}