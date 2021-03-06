var gulp = require('gulp');
var filter = require('gulp-filter');
var kclean = require('gulp-kclean');
var modulex = require('gulp-modulex');
var path = require('path');
var rename = require('gulp-rename');
var packageInfo = require('./package.json');
var src = path.resolve(process.cwd(), 'lib');
var build = path.resolve(process.cwd(), 'build');
var clean = require('gulp-clean');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var jscs = require('gulp-jscs');
var replace = require('gulp-replace');
var wrapper = require('gulp-wrapper');
var date = new Date();
var header = ['//!',
        'Copyright ' + date.getFullYear() + ', ' + packageInfo.name + '@' + packageInfo.version,
        packageInfo.license + ' Licensed,',
        'build time: ' + (date.toGMTString()),
    '\n'].join(' ');

gulp.task('tag',function(done){
    var cp = require('child_process');
    var version = packageInfo.version;
    cp.exec('git tag '+version +' | git push origin '+version+':'+version+' | git push origin master:master',done);
});
    
gulp.task('lint', function () {
    return gulp.src('./lib/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'))
        .pipe(jscs());
});

gulp.task('clean', function () {
    return gulp.src(build, {
        read: false
    }).pipe(clean());
});

gulp.task('build', ['lint', 'clean'], function () {
    return gulp.src('./lib/html-parser.js')
        .pipe(modulex({
            modulex: {
                packages: {
                    'html-parser': {
                        base: path.resolve(src, 'html-parser')
                    }
                }
            }
        }))
        .pipe(kclean({
            files: [
                {
                    src: './lib/html-parser-debug.js',
                    outputModule: 'html-parser'
                }
            ]
        }))
        .pipe(replace(/@VERSION@/g, packageInfo.version))
        .pipe(wrapper({
                    header: header
                }))
		.pipe(replace(/modulex\.add\("html-parser(.)/, function(nul, match) {
			console.log(match);
			if ('"' === match) {
				return 'define("kg/html-parser/0.0.1/index"';		
			}
			return 'define("kg/html-parser/0.0.1' + match;		
		 }))
		.pipe(replace(/modulex.config\(([^)]+)\)/g, function(nul, match) {
			return 'KISSY.config({' + match.replace(/"requires"\s*,/, '"modules":') + '});';	  
		 }))
		 .pipe(rename(function(path) {
			path.basename = path.basename.replace('-debug', '').replace(/html-parser$/, 'index').replace(/overlay-deps$/, 'index-deps');	
		 }))
        .pipe(gulp.dest(build))
        .pipe(filter(['*.js', '!*-deps.js']))
        .pipe(replace(/@DEBUG@/g, ''))
		.pipe(uglify({
			preserveComments: 'some'
		 }))
        .pipe(rename(function(path) {
			path.extname = '-min.js';	
		 }))
        .pipe(gulp.dest(build));
});

gulp.task('default', ['build']);
