import Levenshtein from '../../js/levenshtein';

describe('Levenshtein', function() {
    describe('General', function () {
        it('enlarges the matrix as needed', function () {
            var l = new Levenshtein();
            var i, len;

            l.m.should.deep.equal([]);

            l.process('hi', 'there');
            len = l.m.length;
            len.should.equal(3);
            for (i = 0; i < len; ++i) {
                l.m[i].length.should.equal(6);
            }

            l.process('hello', 'there!!!');
            len = l.m.length;
            len.should.equal(6);
            for (i = 0; i < len; ++i) {
                l.m[i].length.should.equal(9);
            }

            l.process('x', 'y');
            len = l.m.length;
            len.should.equal(6);
            for (i = 0; i < len; ++i) {
                l.m[i].length.should.equal(9);
            }
        });

        describe('user-supplied cost function', function () {
            it('respects match function', function () {
                var l = new Levenshtein({
                });

                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return 10;
                });

                // make sure the matrix costs are set up with
                // the user costs in the first row and first column
                l.set('insertCost', function(c1) {
                    return 100;
                });
                l.set('deleteCost', function(c1) {
                    return 1000;
                });

                l.process('hello', 'allo');
                l.results.totalCost.should.equal(1010);

                l.process('hello', 'hallo');
                l.results.totalCost.should.equal(10);

                l.process('hello', 'hella');
                l.results.totalCost.should.equal(10);
            });

            it('respects insert function', function () {
                var l = new Levenshtein({
                });

                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return 10;
                });

                // make sure the matrix costs are set up with
                // the user costs in the first row and first column
                l.set('insertCost', function(c1) {
                    return 100;
                });
                l.set('deleteCost', function(c1) {
                    return 1000;
                });

                l.process('hallo', 'Shallow');
                l.results.totalCost.should.equal(200);

                l.process('hello', 'heallo');
                l.results.totalCost.should.equal(100);
            });

            it('respects delete function', function () {
                var l = new Levenshtein({
                });

                l.set('matchCost', function(c1, c2) {
                    if (c1 === c2) {
                        return 0;
                    }
                    return 100;
                });

                // make sure the matrix costs are set up with
                // the user costs in the first row and first column
                l.set('insertCost', function(c1) {
                    return 1000;
                });
                l.set('deleteCost', function(c1) {
                    return 10;
                });

                l.process('hellos', 'allo');
                l.results.totalCost.should.equal(120);

                l.process('hellos', 'halo');
                l.results.totalCost.should.equal(120);
            });
        });
    });

    describe('Type "Whole"', function() {
        describe('construction', function() {
            it('defaults to Whole Type', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                });

                l.type.should.equal('whole');
            });

            it('explicitly sets Whole Type', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                    type: 'whole',
                });

                l.type.should.equal('whole');
                l.process('shello', 'SHmello');
                l.results.totalCost.should.equal(3);
            });

            it('sets first matrix row properly', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                });

                var MATRIX_LEN = l.MAX_LEN+1;
                var m = l.m;
                var i;

                for (i = 0; i < MATRIX_LEN; ++i) {
                    m[0][i].cost.should.equal(i);
                    if (i > 0) {
                        m[0][i].parent.should.equal(1);
                    } else {
                        m[0][i].parent.should.equal(-1);
                    }
                }
            });
        });

        describe('gets correct edit distance', function() {
            it('when case sensitive', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                });

                l.process('shello', 'SHmello');
                l.results.totalCost.should.equal(3);
            });

            it('when case insensitive', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                });

                l.process('shello', 'SHmello');
                l.results.totalCost.should.equal(1);
            });

            it('when first string is empty', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                });

                l.process('', 'SHmello');
                l.results.totalCost.should.equal(7);
            });

            it('when second string is empty', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                });

                l.process('shello', '');
                l.results.totalCost.should.equal(6);
            });
        });

        describe('gets correct edit path', function() {
            it('when case sensitive', function() {
                var l = new Levenshtein({
                    caseSensitive: true,
                });

                l.process('Strode', 'sIdes');
                l.results.path.should.deep.equal([
                    {
                        i: 0,
                        letter: 'S', op: 'D',
                    },
                    {
                        i: 1,
                        letter: 't', op: 'D',
                    },
                    {
                        i: 2, j: 0,
                        op: 'S',
                        from: 'r', to: 's',
                    },
                    {
                        i: 3, j: 1,
                        op: 'S',
                        from: 'o', to: 'I',
                    },
                    {
                        i: 4, j: 2,
                        letter: 'd', op: 'M',
                    },
                    {
                        i: 5, j: 3,
                        letter: 'e', op: 'M',
                    },
                    {
                        i: 6, j: 4,
                        letter: 's', op: 'I',
                    },
                ]);
            });

            it('when case insensitive', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                });

                l.process('Strode', 'sIDEs');
                l.results.path.should.deep.equal([
                    {
                        i: 0, j: 0,
                        letter: 's', op: 'M',
                    },
                    {
                        i: 1,
                        letter: 't', op: 'D',
                    },
                    {
                        i: 2,
                        letter: 'r', op: 'D',
                    },
                    {
                        i: 3, j: 1,
                        op: 'S',
                        from: 'o', to: 'i',
                    },
                    {
                        i: 4, j: 2,
                        letter: 'd', op: 'M',
                    },
                    {
                        i: 5, j: 3,
                        letter: 'e', op: 'M',
                    },
                    {
                        i: 6, j: 4,
                        letter: 's', op: 'I',
                    },
                ]);

            });

            it('when first string is empty', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                });

                l.process('', 'sIDEs');
                l.results.path.should.deep.equal([
                    {
                        i: 0, j: 0,
                        letter: 's', op: 'I',
                    },
                    {
                        i: 0, j: 1,
                        letter: 'i', op: 'I',
                    },
                    {
                        i: 0, j: 2,
                        letter: 'd', op: 'I',
                    },
                    {
                        i: 0, j: 3,
                        letter: 'e', op: 'I',
                    },
                    {
                        i: 0, j: 4,
                        letter: 's', op: 'I',
                    },
                ]);

            });

            it('when second string is empty', function() {
                var l = new Levenshtein({
                    caseSensitive: false,
                });

                l.process('Strode', '');
                l.results.path.should.deep.equal([
                    {
                        i: 0,
                        letter: 's', op: 'D',
                    },
                    {
                        i: 1,
                        letter: 't', op: 'D',
                    },
                    {
                        i: 2,
                        letter: 'r', op: 'D',
                    },
                    {
                        i: 3,
                        letter: 'o', op: 'D',
                    },
                    {
                        i: 4,
                        letter: 'd', op: 'D',
                    },
                    {
                        i: 5,
                        letter: 'e', op: 'D',
                    },
                ]);

            });
        });
    });
});
