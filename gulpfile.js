const gulp = require('gulp');
const rename = require('gulp-rename');
const del = require('del');

// 通知関係
const plumber = require("gulp-plumber");
const notifier = require('node-notifier');

// ブラウザ関係
const browser = require("browser-sync");

// HTML 系
const ejs = require('gulp-ejs');

// CSS 系
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');

// JS 系
const typescript = require('gulp-typescript');
const babel = require('gulp-babel');

// 画像系
const imagemin = require('gulp-imagemin');
const imageminJpg = require('imagemin-jpeg-recompress');
const imageminPng = require('imagemin-pngquant');
const imageminGif = require('imagemin-gifsicle');
const svgmin = require('gulp-svgmin');
const webp = require('gulp-webp');

// Build 系
const uglify = require('gulp-uglify');


// コンパイルエラーの時のメッセージ
function onError (error) {
  notifier.notify(
    {
      message: "しっぱいしたワン",
      title: "パグ"
    },
    function() {
      console.log(error.message);
    }
  );
}

// ローカルサーバを起動
function taskServer (done) {
  browser({
    server: {
      baseDir: './public'
    }
  });

  done();
}

// ブラウザのリロードを行う
function taskReload (done) {
  browser.reload();

  done();
}

// ejs のビルドを行う
function taskEjs (done) {
  gulp.src(['./src/ejs/**/*.ejs', '!./src/ejs/**/_*.ejs'])
    .pipe(
      plumber({
        errorHandler: onError
      })
    )
    .pipe(ejs())
    .pipe(rename({ extname: '.html' }))
    .pipe(gulp.dest('./public/'));

  done();
}

// scss のビルドを行う
function taskSass (done) {
  const plugins = [
    autoprefixer({ cascade: false }),
  ];

  gulp.src(['./src/scss/**/*.scss', '!./src/scss/**/_*.scss'])
    .pipe(
      plumber({
        errorHandler: onError
      })
    )
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(postcss(plugins))
    .pipe(gulp.dest('./public/css'));

  done();
}

// ts のビルドを行う
function taskTs (done) {
  gulp.src(['./src/ts/**/*.ts', '!./src/ts/**/_*.ts'])
    .pipe(
      plumber({
        errorHandler: onError
      })
    )
    .pipe(typescript({
      noImplicitAny: true,
      removeComments: true,
    }))
    .pipe(babel())
    .pipe(gulp.dest('./public/js'));

  done();
}

// ファイルの変更を監視する
function taskSurvey (done) {
  gulp.watch('./src/ejs/**/*.ejs', gulp.series(taskEjs, taskReload));
  gulp.watch('./src/scss/**/*.scss', gulp.parallel(taskSass, taskReload));
  gulp.watch('./src/ts/**/*.ts', gulp.series(taskTs, taskReload));

  done();
}

// 不要なファイルの削除
function taskClean (done) {
  del(['./dist', './public/css', './public/js', './public/**/*.html']);

  done();
}

// 以前の公開用のフォルダの削除
function taskBuildDel (done) {
  del('./dist');

  done();
}

// 公開用のフォルダの生成
function taskBuildFile (done) {
  gulp.src(['./public/**/*', '!./public/**/*.js', '!./public/**/*.{svg,jpg,jpeg,png,gif,webp}'], {
      base: './public/'
    })
    .pipe(gulp.dest('./dist/'));

  gulp.src('./public/js/**/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('./dist/js/'));

  done();
}

// 公開用の画像の圧縮
function taskBuildImgMin (done) {
  gulp.src('./public/img/**/*.{jpg,jpeg,png,gif}')
    .pipe(imagemin([
        imageminPng(),
        imageminJpg(),
        imageminGif({
          interlaced: false,
          optimizationLevel: 3,
          colors:180
        })
      ]))
    .pipe(gulp.dest('./dist/img/'));

  gulp.src('./public/img/**/*.svg')
    .pipe(svgmin())
    .pipe(gulp.dest('./dist/img/'));

  done();
}

// 公開用の Webp の生成
function taskBuildWebp (done) {
  gulp.src('./dist/img/**/*.{jpg,jpeg,png,gif}')
    .pipe(webp())
    .pipe(gulp.dest('./dist/img'));

  done();
}

// Webp の生成
function taskWebp (done) {
  gulp.src('./public/img/**/*.{jpg,jpeg,png,gif}')
    .pipe(webp())
    .pipe(gulp.dest('./public/img'));

  done();
}

exports.default = gulp.series(gulp.parallel(taskEjs, taskSass, taskTs), taskServer, taskSurvey);
exports.clean = gulp.series(taskClean);
exports.build = gulp.series(taskBuildFile, taskBuildImgMin);
exports.webp = gulp.series(taskWebp);
exports.webpBuild = gulp.series(taskBuildWebp);
