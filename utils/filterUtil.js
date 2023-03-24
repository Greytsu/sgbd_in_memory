exports.DynamicFilter = (columns, datafile, filters) => {
    const idsResults = []
    filters.forEach(filter => {
        const ids = []
        if (columns[filter.key]?.isIndex){
            Object.keys(datafile.index[filter.key]).forEach(fieldValue => {
                if (Compare(fieldValue, filter.operator, filter.value)){
                    ids.push(...datafile.index[filter.key][fieldValue])
                }
            })
        }
        else{
            Object.keys(datafile.datas).forEach(id => {
                if(Compare(datafile.datas[id][filter.key], filter.operator, filter.value)){
                    ids.push(parseInt(id))
                }
            })
        }
        idsResults.push(ids)
    })
    
    return idsResults.length > 1 ? idsResults.reduce((acc, curr) => acc.concat(curr))
        .filter((value, index, array) => array.indexOf(value) === index && array.lastIndexOf(value) !== index)
        : idsResults[0]
}

const Compare = (value1, operator, value2) =>{
    switch (operator) {
        case '>=':
            return value1 >= value2;
        case '<=':
            return value1 <= value2;
        case '!=':
            return value1 != value2;
        case '>':
            return value1 > value2;
        case '<':
            return value1 < value2;
        case '=':
            return value1 === value2;
        default:
            return false;
    }
}

exports.GetFilter = (req) => {
    const params = new URLSearchParams(new URL(`localhost:3030${req.url}`).search);
    const filterString = params.get('filters');
    const filterparams = filterString ? filterString.split(',') : []

    const filters = []
    filterparams.forEach(filterparam => {
        let operator = null
        if (filterparam.includes('>=')){
            operator = '>='
        }else if (filterparam.includes('<=')){
            operator = '<='
        }else if (filterparam.includes('!=')){
            operator = '!='
        }else if (filterparam.includes('>')){
            operator = '>'
        }else if (filterparam.includes('<')){
            operator = '<'
        }else if (filterparam.includes('=')){
            operator = '='
        }
        
        if(operator){
            const [key, value] = filterparam.split(operator);
            filters.push({ key, value, operator });
        }
    });
    return filters;
}