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
var reload = browserSync.reload;

// dir vars
var source = '.';
var dest = 'public';
var destStylesDir = dest + '/styles';
var destScriptsDir = dest + '/scripts';
var destFontsDir = dest + '/fonts';
var destImagesDir = dest + '/images';

// js vars
var jsDir = source + '/js';
var jsGlob = jsDir + '/**/*.js';
var jsLibsFile = 'libs.js';
var jsAppFile = 'app.js';
var jsLibsGlob = [
    source + '/bower_components/loader.js/loader.js',
    'node_modules/gulp-babel/node_modules/babel-core/browser-polyfill.js',
    source + '/bower_components/html5shiv/dist/html5shiv.min.js',
    source + '/bower_components/jquery/dist/jquery.min.js',
    source + '/bower_components/bootstrap-sass/assets/javascripts/bootstrap.min.js',
];

// fonts vars
var fontsGlob = [
    source + '/bower_components/bootstrap-sass/assets/fonts/**/*.*',
];

// images vars
var imagesGlob = source + '/images/**/*.*';

// css vars
var sassDir = source + '/sass';
var sassGlob = sassDir + '/**/*.scss';

// tasks
// copy files
gulp.task('copy', ['copy:fonts', 'copy:images', 'copy:html']);

gulp.task('copy:fonts', function() {
    return gulp.src(fontsGlob)
        .pipe(gulp.dest(destFontsDir));
});

gulp.task('copy:images', function() {
    return gulp.src(imagesGlob)
        .pipe(gulp.dest(destImagesDir));
});

gulp.task('copy:html', function() {
    return gulp.src('index.html')
        .pipe(gulp.dest(dest));
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
            moduleRoot: '',
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

gulp.task('default', ['js:libs', 'js:app', 'sass', 'copy'], function() {
    browserSync.init({
        logLevel: 'debug',
        online: false,
        server: {
            baseDir: 'public',
            index: 'index.html',
        },
        port: 9000,
        ui: {
            port: 8080,
            weinre: {
                port: 8000,
            },
        },
    });

    gulp.watch(jsLibsGlob, ['js:libs']);
    gulp.watch(jsGlob, ['js:app']);
    gulp.watch(sassGlob, ['sass']);
    gulp.watch('index.html', ['copy:html']);
    gulp.watch(dest + '/index.html').on('change', browserSync.reload);
});
