exports.Response = (res, code, message) => {
    res.writeHead(code, {'Content-Type' : 'application/json'});
    res.end(message);
}