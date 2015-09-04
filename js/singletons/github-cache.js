import Mochila from 'mochila';
import ajax from 'utils/ajax';

class GitHubCache {
    constructor() {
        this.store = new Mochila();
        this.store.addCollection('*');
        this.rateLimit = {
            resetDate: Date.now(),
            remaining: null,
        };
    }

    fetch(list) {
        if (this.rateLimit.remaining === 0 && this.rateLimit.resetDate > Date.now()) {
            return Promise.reject();
        }

        return ajax({
            url: `api/github-data`,
            data: list,
        }).then(data => {
            var array = [];
            var dict = {};

            data.github_data.forEach(datum => {
                datum = {
                    id: datum.github_path,
                    data: datum.data,
                };

                dict[datum.id] = datum.data;
                array.push(datum);
            });

            this.rateLimit.resetDate = new Date(data.rate_limit.reset_date);
            this.rateLimit.remaining = data.rate_limit.remaining;
            this.store.load(array);

            return dict;
        });
    }

    find(github_path) {
        return this.store.find('*', github_path);
    }
}

export default new GitHubCache();
