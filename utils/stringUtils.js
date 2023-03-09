exports.IsEmptyOrNull = (string) => {
    return string.trim() === '' || !string;
}