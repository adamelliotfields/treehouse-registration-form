const cssMqpacker = require('@hail2u/css-mqpacker');
const execa = require('execa');
const fs = require('fs-extra');
const gulpIf = require('gulp-if');
const gulpPostcss = require('gulp-postcss');
const gulpPrettier = require('gulp-prettier');
const gulpRename = require('gulp-rename');
const gulpSass = require('gulp-sass');
const path = require('path');
const { create } = require('browser-sync');
const { dest, parallel, series, src, watch } = require('gulp');

// Instantiate the Browser Sync instance.
const bs = create();

// Delete the `dist` folder and remove it from the worktree.
const clean = async () => {
  await fs.remove('./dist');

  // This always exits cleanly, even if there are no worktrees to prune.
  return execa('git', ['worktree', 'prune']);
};

// Clones the `master` branch into the `dist` folder.
const worktree = () => execa('git', ['worktree', 'add', '-B', 'master', 'dist', 'origin/master']);

// Copy static assets.
// prettier-ignore
const copy = () => src(['src/images/*', 'src/mockups/*', 'src/favicon.ico', 'src/gitignore', 'src/README.md'])
  .pipe(gulpIf('**/gitignore', gulpRename('.gitignore')))
  .pipe(dest((file) => {
    const includes = (dir) => file.dirname.split(path.sep).includes(dir);
    if (includes('mockups')) return 'dist/mockups';
    if (includes('images')) return 'dist/img';
    return 'dist';
  }));

// Compile SCSS to CSS.
// prettier-ignore
const sass = () => src('src/styles/index.scss')
  .pipe(gulpSass({ outputStyle: 'expanded' }).on('error', gulpSass.logError))
  .pipe(gulpPostcss([cssMqpacker({ sort: true })]))
  .pipe(gulpPrettier({ endOfLine: 'lf', printWidth: 100, singleQuote: true }))
  .pipe(gulpRename('styles.css'))
  .pipe(dest('dist/css'));

// Copy HTML files.
const html = () => src('src/*.html').pipe(dest('dist'));

// Stream the compiled CSS to Browser Sync.
const reloadSass = () => sass().pipe(bs.stream({ match: '**/*.css' }));

// Stream the copied HTML to Browser Sync.
const reloadHtml = () => html().pipe(bs.stream({ match: '**/*.html', once: true }));

// Watch all SCSS files for changes and let Browser Sync inject changes into the page.
const watchSass = () => watch('src/styles/**/*.scss', reloadSass);

// Watch all HTML files for changes and let Browser Sync reload the page.
const watchHtml = () => watch('src/*.html', reloadHtml);

// Start the Browser Sync server.
// prettier-ignore
const browserSync = (done) => bs.init({
  server: 'dist',
  callbacks: {
    ready: (err) => (err === null ? done() : done(err)),
  },
});

// prettier-ignore
exports.default = series(
  clean,
  worktree,
  copy,
  html,
  sass,
  browserSync,
  parallel(watchSass, watchHtml),
);

// prettier-ignore
exports.build = series(
  clean,
  worktree,
  copy,
  html,
  sass,
);
