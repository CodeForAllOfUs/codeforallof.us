class SearchResult {
    constructor(obj) {
        this.orgs = obj.orgs;
        this.projects = obj.projects;
    }

    static create(obj) {
        return this(obj);
    }
}

export default SearchResult;
