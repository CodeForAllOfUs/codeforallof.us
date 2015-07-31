import SearchController from 'controllers/search';

var App = {
    search: new SearchController({
        el: '#search',
        listEl: '#list-view',
    }),

    start() {
        console.log('App started!');
    }
};

window.app = App;

export default App;
