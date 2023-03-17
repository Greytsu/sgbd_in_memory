const fs = require('fs');

exports.SaveFile = (filePath, datas) => {
    const configDirectoryPath = 'config'
    return setInterval(() => {
        console.log(`Save file ${filePath}`);
        if (!fs.existsSync(configDirectoryPath)){
            fs.mkdirSync(configDirectoryPath);
        }
        if(!fs.existsSync(filePath)){
            fs.writeFileSync(filePath, JSON.stringify(datas));
        }
        fs.writeFileSync(filePath, JSON.stringify(datas));
    }, 10000);
}