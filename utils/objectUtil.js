exports.InitObject = (props) => {
    const propsObj = props.reduce((acc, prop) => {
        acc[prop] = null; 
        return acc;
    }, {});
    return propsObj;
}

exports.SortObject = (obj) => {
    const sortedObj = this.InitObject(Object.keys(obj).sort())
    Object.keys(sortedObj).forEach(key => {
        sortedObj[key] = obj[key]
    })
    return sortedObj
}

exports.CompareObjectStruct = (obj1, obj2) => {
    const keys1 = Object.keys(obj1).sort();
    const keys2 = Object.keys(obj2).sort();

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (let i = 0; i < keys1.length; i++){
        if(keys1[i] !== keys2[i]){
            return false;
        }
    }

    return true;
}