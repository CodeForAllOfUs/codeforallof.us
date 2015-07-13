import Levenshtein from '../../js/levenshtein';

describe('test Levenshtein', function () {
    it('gets correct distance', function () {
        var l = new Levenshtein({
            maxLength: 20,
            caseSensitive: false,
        });

        l.process('shello', 'SHmello');
        l.results.numSteps.should.equal(1);
    });
});
