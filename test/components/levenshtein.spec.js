import Levenshtein from '../../js/levenshtein';

describe('test Levenshtein', function () {
    describe('gets correct edit distance', function () {
        it('when case sensitive', function () {
            var l = new Levenshtein({
                maxLength: 20,
                caseSensitive: true,
            });

            l.process('shello', 'SHmello');
            l.results.numSteps.should.equal(3);
        });

        it('when case insensitive', function () {
            var l = new Levenshtein({
                maxLength: 20,
                caseSensitive: false,
            });

            l.process('shello', 'SHmello');
            l.results.numSteps.should.equal(1);
        });
    });

    describe('gets correct edit path', function () {
        it('when case sensitive', function () {
            var l = new Levenshtein({
                maxLength: 20,
                caseSensitive: true,
            });

            l.process('Strode', 'sIdes');
            l.results.path.should.deep.equal([
                {
                    i: 1,
                    letter: 'S', op: 'D',
                },
                {
                    i: 2,
                    letter: 't', op: 'D',
                },
                {
                    i: 3, j: 1,
                    op: 'S',
                    from: 'r', to: 's',
                },
                {
                    i: 4, j: 2,
                    op: 'S',
                    from: 'o', to: 'I',
                },
                {
                    i: 5, j: 3,
                    letter: 'd', op: 'M',
                },
                {
                    i: 6, j: 4,
                    letter: 'e', op: 'M',
                },
                {
                    i: 6, j: 5,
                    letter: 's', op: 'I',
                },
            ]);
        });

        it('when case insensitive', function () {
            var l = new Levenshtein({
                maxLength: 20,
                caseSensitive: false,
            });

            l.process('Strode', 'sIDEs');
            l.results.path.should.deep.equal([
                {
                    i: 1, j: 1,
                    letter: 's', op: 'M',
                },
                {
                    i: 2,
                    letter: 't', op: 'D',
                },
                {
                    i: 3,
                    letter: 'r', op: 'D',
                },
                {
                    i: 4, j: 2,
                    op: 'S',
                    from: 'o', to: 'i',
                },
                {
                    i: 5, j: 3,
                    letter: 'd', op: 'M',
                },
                {
                    i: 6, j: 4,
                    letter: 'e', op: 'M',
                },
                {
                    i: 6, j: 5,
                    letter: 's', op: 'I',
                },
            ]);

        });
    });
});
