exports.GetSortFields = (req) => {
    const params = new URLSearchParams(new URL(`localhost:3030${req.url}`).search);
    const filterString = params.get('sort');

    return filterString ? filterString.split(',') : [];
}

exports.SortDatas = (datas, fields) => {
    let sortedDatas = datas
    for (let i = fields.length-1; i >= 0; i--){
        sortedDatas = fields[i].startsWith('!')
            ? datas.sort((a, b) => String(b[fields[i].substring(1)]).localeCompare(String(a[fields[i].substring(1)])))
            : sortedDatas = datas.sort((a, b) => String(a[fields[i]]).localeCompare(String(b[fields[i]])))
    }
    return sortedDatas;
}