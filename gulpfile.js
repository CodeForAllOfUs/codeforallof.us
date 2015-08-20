var gulp = require('gulp');
var concat = require('gulp-concat');
var del = require('del');

// js
var babel = require('gulp-babel');

// css
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer-core');
var filter = require('gulp-filter');

// livereload and sync
var browserSync = require('browser-sync').create();

function runTasks(opts, done) {
    var source = opts.source;
    var dest = opts.dest;

    var files = {
        js: {
            app: 'app.js',
            libs: 'libs.js',
        },
    };

    var dir = opts.dir || {
        // input
        js        : source + '/js',
        sass      : source + '/sass',

        // output
        styles    : dest + '/styles',
        scripts   : dest + '/scripts',
        json      : dest + '/data',
        fonts     : dest + '/fonts',
        images    : dest + '/images',
        html      : dest,
    };

    var glob = {
        sass   : dir.sass + '/**/*.scss',
        html   : opts.glob && opts.glob.html ? opts.glob.html : 'index.html',
        images : source + '/images/**/*.*',
        fonts  : [
            source + '/bower_components/font-awesome/fonts/**/*.*',
        ],
        json   : [
            source + '/organizations.json',
            source + '/projects.json',
        ],
        js     : {
            src  : dir.js + '/**/*.js',
            app  : dir.scripts + '/' + files.js.app,
            lib  : dir.scripts + '/' + files.js.libs,
            libs : [
                source + '/bower_components/loader.js/loader.js',
                source + '/node_modules/gulp-babel/node_modules/babel-core/browser-polyfill.js',
                source + '/bower_components/html5shiv/dist/html5shiv.min.js',
                source + '/bower_components/jquery/dist/jquery.min.js',
                source + '/bower_components/bootstrap-sass/assets/javascripts/bootstrap.min.js',
                source + '/bower_components/levenshtein-toolbox/dist/levenshtein-toolbox.amd.min.js',
                source + '/bower_components/mochila/dist/mochila.amd.min.js',
            ],
        },
    };

    // tasks
    gulp.task('copy', ['copy:json', 'copy:fonts', 'copy:images']);

    gulp.task('copy:fonts', function() {
        return gulp.src(glob.fonts)
        .pipe(gulp.dest(dir.fonts));
    });

    gulp.task('copy:images', function() {
        return gulp.src(glob.images)
        .pipe(gulp.dest(dir.images));
    });

    gulp.task('copy:html', function() {
        return gulp.src(glob.html)
        .pipe(gulp.dest(dir.html));
    });

    gulp.task('copy:json', ['clean:json'], function() {
        return gulp.src(glob.json)
        .pipe(gulp.dest(dir.json));
    });

    gulp.task('clean:json', function(cb) {
        del(dir.json, cb);
    });

    gulp.task('js:clean', function(cb) {
        del(dir.scripts, cb);
    });

    gulp.task('js:clean:libs', function(cb) {
        del(glob.js.lib, cb);
    });

    // vendor libraries
    gulp.task('js:libs', ['js:clean:libs'], function() {
        return gulp.src(glob.js.libs)
            .pipe(concat(files.js.libs))
            .pipe(gulp.dest(dir.scripts));
    });

    gulp.task('js:clean:app', function(cb) {
        del(glob.js.app, cb);
    });

    // app source
    gulp.task('js:app', ['js:clean:app'], function() {
        return gulp.src(glob.js.src)
        .pipe(babel({
            modules: 'amd',
            moduleIds: true,
            sourceRoot: dir.js,
            moduleRoot: null,
            experimental: 2,
        }))
        .on('error', function (err) { console.error(err.toString()); this.emit('end'); })
        .pipe(concat(files.js.app))
        .pipe(gulp.dest(dir.scripts));
    });

    gulp.task('css:clean', function(cb) {
        del(dir.styles, cb);
    });

    gulp.task('sass', ['css:clean'], function() {
        var processors = [
            autoprefixer({ browsers: ['last 3 versions'] })
        ];

        return gulp.src(glob.sass)
        // css preprocessing
        // bootstrap-sass requires a precision >= 8
        .pipe(sass({ precision: 10 }))
        .on('error', function (err) { console.error(err.toString()); this.emit('end'); })
        // css postprocessing
        .pipe(postcss(processors))
        .pipe(gulp.dest(dir.styles))
        // filter css for livereload
        .pipe(filter('**/*.css'))
        .pipe(browserSync.stream());
    });

    gulp.task('build', ['js:libs', 'js:app', 'sass', 'copy']);
    gulp.task('watch', ['build'], function() {
        function throttle(task) {
            return function(event, file) {
                var ev, timer;

                if (!events[event]) {
                    events[event] = {};
                }

                ev = events[event];
                timer = ev[file];

                if (timer) {
                    clearTimeout(timer);
                }

                ev[file] = setTimeout(function () {
                    gulp.start(task, function() {
                        delete ev[file];
                    });
                }, 500);
            };
        }

        var events =  {};
        var bsOpts = {
            online: false,
            port: 9000,
            ui: {
                port: 8080,
                weinre: {
                    port: 8000,
                },
            },
        };

        if (source !== __dirname) {
            bsOpts.proxy = opts.config.browserSyncProxy;
        } else {
            bsOpts.server = {
                baseDir: dest,
                // index.html is one level above `dest`
                index: '../' + glob.html,
            };
        }

        browserSync.init(bsOpts);

        gulp.watch(glob.js.src, throttle(['js:app']));
        gulp.watch(glob.sass, throttle(['sass']));
        gulp.watch(glob.json, throttle(['copy:json']));
        gulp.watch(glob.html).on('change', browserSync.reload);
    });

    gulp.start('watch');
}

if (process.cwd() === __dirname) {
    gulp.task('default', function(done) {
        runTasks({
            source: __dirname,
            dest: './public',
        }, done);
    });
}

module.exports = runTasks;
