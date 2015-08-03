function fisherYates(array) {
    var i, j;
    for (i = array.length-1; i >= 0; --i) {
        j = Math.floor(Math.random() * (i+1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export default fisherYates;
