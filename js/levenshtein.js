const MATCH  = 0;
const INSERT = 1;
const DELETE = 2;

class Levenshtein {
    constructor(options) {
        options = typeof options === 'object' ? options : {};

        if (!(this instanceof Levenshtein)) {
            return new Levenshtein(options);
        }

        this.caseSensitive = !!options.caseSensitive;
        this.m = [];
        this.set('type', options.type);
        return this;
    }

    _initFirstRowWhole() {
        var m = this.m;
        var len = m[0].length;
        var s2 = this.s2;
        var j;

        for (j = 0; j < len; ++j) {
            if (j > 0) {
                m[0][j].cost = m[0][j-1].cost + this.insertCost(s2[j]);
                m[0][j].parent = INSERT;
            } else {
                m[0][j].cost = 0;
                m[0][j].parent = -1;
            }
        }
   }

    _initFirstRowSubstring() {
        var m = this.m;
        var len = m[0].length;
        var j;

        for (j = 0; j < len; ++j) {
            m[0][j].cost = 0;
            m[0][j].parent = -1;
        }
    }

    _initFirstRow() {
        if (!this.m.length) {
            return;
        }

        if (this.type === 'whole') {
            this._initFirstRowWhole();
        } else if (this.type === 'substring') {
            this._initFirstRowSubstring();
        }
    }

    _initFirstColumn() {
        var m = this.m;
        var len = m.length;
        var s1 = this.s1;
        var i;

        for (i = 0; i < len; ++i) {
            if (i > 0) {
                m[i][0].cost = m[i-1][0].cost + this.deleteCost(s1[i]);
                m[i][0].parent = DELETE;
            } else {
                m[i][0].cost = 0;
                m[i][0].parent = -1;
            }
        }

    }

    _embiggenMatrixSize() {
        var m = this.m;
        var len1 = this.s1.length;
        var len2 = this.s2.length;
        var i, j;

        if (m.length < len1) {
            m.length = len1;
        }

        for (i = 0; i < len1; ++i) {
            if (!Array.isArray(m[i])) {
                m[i] = [];
                j = 0;
            } else {
                j = m[i].length;
            }

            if (m[i].length < len2) {
                m[i].length = len2;
            }

            for (; j < len2; ++j) {
                m[i][j] = {};
            }
        }

        this._initFirstRow();
        this._initFirstColumn();
    }

    _matchType(c1, c2) {
        if (c1 === c2) {
            return 'M';
        } else {
            return 'S';
        }
    }

    _reconstructPath(i, j) {
        var self = this;
        var m = this.m;
        var path = [];
        var s1 = this.s1;
        var s2 = this.s2;

        function reconstruct(i, j) {
            if (m[i][j].parent === -1) return;

            var node = {};
            var matchtype;

            if (m[i][j].parent === MATCH) {
                reconstruct(i-1, j-1);

                matchtype = self._matchType(s1[i], s2[j]);
                node.i = i-1;
                node.j = j-1;
                node.op = matchtype;

                if (matchtype === 'M') {
                    node.letter = s2[j];
                } else {
                    node.from = s1[i];
                    node.to = s2[j];
                }

                path.push(node);
                return;
            }
            if (m[i][j].parent === INSERT) {
                reconstruct(i, j-1);

                node.i = i;
                node.j = j-1;
                node.op = 'I';
                node.letter = s2[j];

                path.push(node);
                return;
            }
            if (m[i][j].parent === DELETE) {
                reconstruct(i-1, j);

                node.i = i-1;
                node.op = 'D';
                node.letter = s1[i];

                path.push(node);
                return;
            }
        }

        reconstruct(i, j);
        return path;
    }

    _goalCellWhole(s1, s2) {
        return {
            i: s1.length-1,
            j: s2.length-1,
        };
    }

    _goalCellSubstring(s1, s2) {
        var ret = {};
        var len2 = s2.length;
        var m = this.m;
        var i = s1.length-1;
        var j = 0;
        var k;

        ret.i = i;

        for (k = 1; k < len2; ++k) {
            if (m[i][k].cost < m[i][j].cost) {
                j = k;
            }
        }

        ret.j = j;

        return ret;
    }

    _goalCell(...args) {
        if (this.type === 'whole') {
            return this._goalCellWhole(...args);
        } else if (this.type === 'substring') {
            return this._goalCellSubstring(...args);
        }
    }

    _levenshtein() {
        var opt = [];
        var s1 = this.s1;
        var s2 = this.s2;
        var m = this.m;
        var i, j, k;

        for (i = 1; i < s1.length; ++i) {
            for (j = 1; j < s2.length; ++j) {
                opt[MATCH]  = m[i-1][j-1].cost + this.matchCost(s1[i], s2[j]);
                opt[INSERT] = m[i][j-1].cost + this.insertCost(s2[j]);
                opt[DELETE] = m[i-1][j].cost + this.deleteCost(s1[i]);

                m[i][j].cost = opt[MATCH];
                m[i][j].parent = MATCH;

                for (k = INSERT; k <= DELETE; ++k) {
                    if (opt[k] < m[i][j].cost) {
                        m[i][j].cost = opt[k];
                        m[i][j].parent = k;
                    }
                }
            }
        }
    }

    set(name, val) {
        var validTypes;

        this[name] = val;

        if (name === 'type') {
            validTypes = ['whole', 'substring'];

            if (validTypes.indexOf(val) === -1) {
                this[name] = 'whole';
            }
        }

        // reinitialize first row/column of matrix with user values
        if (name === 'insertCost') {
            if (typeof val === 'number') {
                this[name] = function () { return val; };
            }
            this._initFirstRow();
        }
        if (name === 'deleteCost') {
            if (typeof val === 'number') {
                this[name] = function () { return val; };
            }
            this._initFirstColumn();
        }
    }

    // override with .set('matchCost', fn) to provide a different cost for mis/matching
    // receives characters to be compared
    matchCost(c1, c2) {
        if (c1 === c2) {
            return 0;
        }

        return 1;
    }

    // override with .set('insertCost', fn) to provide a different cost for insertion
    // receives character to be inserted
    insertCost(c) {
        return 1;
    }

    // override with .set('deleteCost', fn) to provide a different cost for deletion
    // receives character to be deleted
    deleteCost(c) {
        return 1;
    }

    process(s1, s2) {
        var len1, len2, totalCost, path, goalCell;

        // strings are prepended with a space to make
        // the code for indexing the matrix easier to read
        s1 = ' ' + s1.slice(0, this.MAX_LEN);
        s2 = ' ' + s2.slice(0, this.MAX_LEN);

        if (!this.caseSensitive) {
            s1 = s1.toLowerCase();
            s2 = s2.toLowerCase();
        }

        this.s1 = s1;
        this.s2 = s2;

        // ensure the matrix is large enough and has
        // the right cost values in the first row/column
        this._embiggenMatrixSize();

        len1 = s1.length-1;
        len2 = s2.length-1;

        if (len1 === 0) {
            totalCost = s2
                    .slice(1)
                    .split('')
                    .reduce((p, c) => p + this.insertCost(c), 0);
        } else if (len2 === 0) {
            totalCost = s1
                    .slice(1)
                    .split('')
                    .reduce((p, c) => p + this.deleteCost(c), 0);
        } else {
            this._levenshtein();
        }

        goalCell = this._goalCell(s1, s2);
        totalCost = this.m[goalCell.i][goalCell.j].cost;
        path = this._reconstructPath(goalCell.i, goalCell.j);

        // aid user inspection of the processed strings
        // by removing the prepended space for each
        this.s1 = s1.slice(1);
        this.s2 = s2.slice(1);

        this.results = {
            path: path,
            totalCost: totalCost,
        };

        return this;
    }
}

export default Levenshtein;
