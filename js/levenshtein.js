#!/usr/bin/env node

function Levenshtein(maxLen, caseSensitive) {
    if (!(this instanceof Levenshtein)) {
        return new Levenshtein(maxLen, caseSensitive);
    }

    this.MAX_LEN = maxLen;
    this.caseInsensitive = !!caseSensitive;
    this.m = [];
    this.init();
    return this;
}

var proto = Levenshtein.prototype;

proto.MATCH  = 0;
proto.INSERT = 1;
proto.DELETE = 2;

proto.init = function() {
    var i, j;
    var m = this.m;
    m.length = this.MAX_LEN+1;

    for (i = 0; i < m.length; ++i) {
        if (!Array.isArray(m[i])) {
            m[i] = [];
            for (j = 0; j < m.length; ++j) {
                m[i][j] = {cost: 0, parent: 0, t:'.'};
            }
        }
        this.initFirstRow(i);
        this.initFirstColumn(i);
    }
};

proto.initFirstRow = function(i) {
    var m = this.m;
    m[0][i].cost = i;
    if (i > 0) m[0][i].parent = this.INSERT;
    else m[0][i].parent = -1;
};

proto.initFirstColumn = function(i) {
    var m = this.m;
    m[i][0].cost = i;
    if (i > 0) m[i][0].parent = this.DELETE;
    else m[i][0].parent = -1;
};

proto.match = function(c1, c2) {
    if (c1 === c2) return 0;
    return 1;
};

proto.printMatrix = function(type) {
    var i, j;
    var m = this.m;
    var out = '';
    for (i = 0; i < m.length; ++i) {
        for (j = 0; j < m.length; ++j) {
            if (type === 0) out += m[i][j].cost + ' ';
            else if (type === 1) out += m[i][j].parent + ' ';
            else out += m[i][j].t + ' ';
        }
        out += '\n';
    }
    return out;
};

proto.matchType = function(i, j) {
    if (this.s1[i] === this.s2[j]) return 'M';
    else return 'S';
};

proto.reconstructPath = function(i, j) {
    var self = this;
    var m = this.m;
    var path = [];
    var s1 = this.s1;
    var s2 = this.s2;
    var MATCH = this.MATCH;
    var INSERT = this.INSERT;
    var DELETE = this.DELETE;

    function reconstruct(i, j) {
        if (m[i][j].parent === -1) return;

        var match = self.matchType(i, j);

        if (m[i][j].parent === MATCH) {
            reconstruct(i-1, j-1);
            path.push({
                i: i,
                j: j,
                op: match,
                letter: match === 'M' ? s2[j] : s1[i] + ' => ' + s2[j],
            });
            return;
        }
        if (m[i][j].parent === INSERT) {
            reconstruct(i, j-1);
            path.push({
                i: i,
                j: j,
                op: 'I',
                letter: s2[j],
            });
            return;
        }
        if (m[i][j].parent === DELETE) {
            reconstruct(i-1, j);
            path.push({
                i: i,
                j: j,
                op: 'D',
                letter: s1[i],
            });
            return;
        }
    }

    reconstruct(i, j);
    return path;
};

proto.levenshtein = function() {
    var opt = [];
    var s1 = this.s1;
    var s2 = this.s2;
    var MATCH = this.MATCH;
    var INSERT = this.INSERT;
    var DELETE = this.DELETE;
    var m = this.m;
    var i, j, k, isNotMatch;

    if (s1.length <= 1) return s2.length-1;
    if (s2.length <= 1) return s1.length-1;

    for (i = 1; i < s1.length; ++i) {
        for (j = 1; j < s2.length; ++j) {
            isNotMatch = this.match(s1[i], s2[j]);

            opt[MATCH]  = m[i-1][j-1].cost + isNotMatch;
            opt[INSERT] = m[i][j-1].cost + 1;
            opt[DELETE] = m[i-1][j].cost + 1;

            m[i][j].cost = opt[MATCH];
            m[i][j].parent = MATCH;
            m[i][j].t = isNotMatch ? 's' : 'm';

            for (k = INSERT; k <= DELETE; ++k) {
                if (opt[k] < m[i][j].cost) {
                    m[i][j].cost = opt[k];
                    m[i][j].parent = k;
                    m[i][j].t = k === INSERT ? 'i' : 'd';
                }
            }
        }
    }

    // goal_cell(s, t, i, j);
    return m[i-1][j-1].cost;
};

proto.process = function(s1, s2) {
    var self = this;
    var len1, len2, numSteps, path, reconstructed;

    s1 = ' ' + s1.slice(0, this.MAX_LEN);
    s2 = ' ' + s2.slice(0, this.MAX_LEN);

    if (!this.caseSensitive) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
    }

    len1 = s1.length-1;
    len2 = s2.length-1;

    this.s1 = s1;
    this.s2 = s2;

    numSteps = this.levenshtein();
    path = this.reconstructPath(len1, len2);

    reconstructed = path.map(function (step) {
        switch (step.op) {
            case 'D':
                return '';
            case 'M':
                case 'S':
                case 'I':
                return self.s2[step.j];
        }
    }).join('');

    this.results = {
        path: path,
        numSteps: numSteps,
        reconstructed: reconstructed,
    };

    return this;
};

proto.getPrintout = function(results) {
    var out = [];
    out.push(this.printMatrix(0));
    out.push(this.printMatrix(1));
    out.push(this.printMatrix(2));
    return out.join('\n');
};

proto.print = function(includeMatrices) {
    if (includeMatrices) {
        console.log(this.getPrintout(this.results));
    }
    console.log('first word ( ' + this.s1.slice(1) + ' ) becomes');
    console.log('second word: ' + this.results.reconstructed);
    console.log('operations total: ' + this.results.numSteps);
    console.log(this.results.path);
    console.log();
};

function getArgs() {
    if (process.argv.length < 4) {
        console.log('not enough args. need two strings');
        process.exit(1);
    }

    var s1 = process.argv[2];
    var s2 = process.argv[3];

    return [s1, s2];
}

var l = new Levenshtein(50);

if (process.argv.length > 3) {
    var args = getArgs();
    var arg1 = args[0];
    var arg2 = args[1];
    l.process(arg1, arg2).print();
}

l.process('hello', 'there').print();
l.process('hello', 'you').print();
