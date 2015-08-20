class SearchResult {
    constructor(obj) {
        this.id = obj.id;
        this.org = obj.org;
        this.project = obj.project;
    }

    static create(obj) {
        return new this(obj);
    }
}

export default SearchResult;
