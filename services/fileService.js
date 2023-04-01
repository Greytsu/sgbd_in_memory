const fs = require('fs');

exports.SaveFile = (filePath, fileObject) => {
    const configDirectoryPath = 'config'
    return setInterval(() => {
        if (fileObject.isModified){
            console.log(`Save file ${filePath}`);
            if (!fs.existsSync(configDirectoryPath)){
                fs.mkdirSync(configDirectoryPath);
            }
            if(!fs.existsSync(filePath)){
                fs.writeFileSync(filePath, JSON.stringify(fileObject.file));
            }
            fs.writeFileSync(filePath, JSON.stringify(fileObject.file));
            fileObject.isModified = false;
        }
    }, 10000);
}