function binarySearch(array, val) {
    var beg = 0;
    var end = array.length-1;
    var mid;

    if (array.length === 0) {
        return -1;
    }

    while (beg <= end) {
        mid = beg + Math.floor((end - beg) / 2);

        if (array[mid] < val) {
            beg = mid + 1;
        } else if (val < array[mid]) {
            end = mid - 1;
        } else {
            return mid;
        }
    }

    return -1;
}

export default binarySearch;
