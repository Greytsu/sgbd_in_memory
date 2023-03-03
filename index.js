const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;



const server = http.createServer((req, res) => {
    const path = req.url.split("?")[0];
    const method = req.method;

    console.log("PATH => ", path);
    console.log("METHODE => ", method);

    if(path === '/status' && method === 'GET'){
        res.writeHead(400, {'Content-Type' : 'application/json'});
        res.end(`{"status": "OK"}`);
        return;
    }
    
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});