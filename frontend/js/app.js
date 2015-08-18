import SearchController from 'controllers/search';

var App = {
    search: new SearchController({
        searchEl: '#text-search',
        filterEl: '#filters',
        orgEl: '#organizations',
        projectEl: '#projects',
    }),

    start() {
        console.log('App started!');
        return this.search.init();
    }
};

window.app = App;

export default App;
