var argv = require('yargs').argv;
var django = !argv.static;
// determine if we're doing a build
// and if so, bypass the livereload
var build = argv._.length ? argv._[0] === 'build' : false;

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

// dir vars
var source = 'frontend';
var dest = django ? 'static/search' : source + '/public';
var destStylesDir = dest + '/styles';
var destScriptsDir = dest + '/scripts';
var destJsonDir = dest + '/data';
var destFontsDir = dest + '/fonts';
var destImagesDir = dest + '/images';

// js vars
var jsDir = source + '/js';
var jsGlob = jsDir + '/**/*.js';
var jsLibsFile = 'libs.js';
var jsAppFile = 'app.js';
var jsLibsGlob = [
    'bower_components/loader.js/loader.js',
    'node_modules/gulp-babel/node_modules/babel-core/browser-polyfill.js',
    'bower_components/html5shiv/dist/html5shiv.min.js',
    'bower_components/jquery/dist/jquery.min.js',
    'bower_components/bootstrap-sass/assets/javascripts/bootstrap.min.js',
    'bower_components/levenshtein-toolbox/dist/levenshtein-toolbox.amd.min.js',
    'bower_components/mochila/dist/mochila.amd.min.js',
];

// json vars
var jsonGlob = [
    'organizations.json',
    'projects.json',
];

// fonts vars
var fontsGlob = [
    source + '/bower_components/font-awesome/fonts/**/*.*',
];

// images vars
var imagesGlob = source + '/images/**/*.*';

// html template vars
var indexHtml = django ? 'templates/search/index.htmldjango' : source + '/index.html';

// css vars
var sassDir = source + '/sass';
var sassGlob = sassDir + '/**/*.scss';

// tasks
// copy files
gulp.task('copy', ['copy:json', 'copy:fonts', 'copy:images']);

gulp.task('copy:fonts', function() {
    return gulp.src(fontsGlob)
        .pipe(gulp.dest(destFontsDir));
});

gulp.task('copy:images', function() {
    return gulp.src(imagesGlob)
        .pipe(gulp.dest(destImagesDir));
});

gulp.task('copy:html', function() {
    return gulp.src(indexHtml)
        .pipe(gulp.dest(dest));
});

gulp.task('copy:json', ['clean:json'], function() {
    return gulp.src(jsonGlob)
        .pipe(gulp.dest(destJsonDir));
});

gulp.task('clean:json', function(cb) {
    del(destJsonDir, cb);
});

gulp.task('js:clean', function(cb) {
    del(destScriptsDir, cb);
});

gulp.task('js:clean:libs', function(cb) {
    del(destScriptsDir + '/' + jsLibsFile, cb);
});

gulp.task('js:clean:app', function(cb) {
    del(destScriptsDir + '/' + jsAppFile, cb);
});

// vendor libraries
gulp.task('js:libs', ['js:clean:libs'], function() {
    return gulp.src(jsLibsGlob)
        .pipe(concat(jsLibsFile))
        .pipe(gulp.dest(destScriptsDir));
});

// app source
gulp.task('js:app', ['js:clean:app'], function() {
    return gulp.src(jsGlob)
        .pipe(babel({
            modules: 'amd',
            moduleIds: true,
            sourceRoot: __dirname + '/js',
            moduleRoot: null,
            experimental: 2,
        }))
        .on('error', function (err) { console.error(err.toString()); this.emit('end'); })
        .pipe(concat(jsAppFile))
        .pipe(gulp.dest(destScriptsDir));
});

gulp.task('css:clean', function(cb) {
    del(destStylesDir, cb);
});

gulp.task('sass', ['css:clean'], function() {
    var processors = [
        autoprefixer({ browsers: ['last 3 versions'] })
    ];

    return gulp.src(sassGlob)
        // css preprocessing
        // bootstrap-sass requires a precision >= 8
        .pipe(sass({ precision: 10 }))
        .on('error', function (err) { console.error(err.toString()); this.emit('end'); })
        // css postprocessing
        .pipe(postcss(processors))
        .pipe(gulp.dest(destStylesDir))
        // filter css for livereload
        .pipe(filter('**/*.css'))
        .pipe(browserSync.stream());
});

gulp.task('build', ['js:libs', 'js:app', 'sass', 'copy']);
gulp.task('watch', ['build'], function() {
    var events =  {};
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

    if (django) {
        bsOpts.proxy = require('./config.secret.json').browserSyncProxy;
    } else {
        bsOpts.server = {
            baseDir: dest,
            index: '../index.html',
        };
    }

    browserSync.init(bsOpts);

    gulp.watch(jsLibsGlob, throttle(['js:libs']));
    gulp.watch(jsGlob, throttle(['js:app']));
    gulp.watch(sassGlob, throttle(['sass']));
    gulp.watch(jsonGlob, throttle(['copy:json']));
    gulp.watch(indexHtml).on('change', browserSync.reload);
});

gulp.task('default', ['watch']);
