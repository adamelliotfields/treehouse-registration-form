const execa = require('execa');
const fs = require('fs-extra');
const gulpBeautify = require('gulp-beautify');
const gulpIf = require('gulp-if');
const gulpPostcss = require('gulp-postcss');
const gulpPug = require('gulp-pug');
const gulpRename = require('gulp-rename');
const gulpSass = require('gulp-sass');
const mqpacker = require('@hail2u/css-mqpacker');
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
const copy = () => src('src/static/**/*')
  .pipe(gulpIf('**/gitignore', gulpRename('.gitignore')))
  .pipe(dest('dist'));

// Compile Pug to HTML.
// prettier-ignore
const pug = () => src('src/templates/**/*.pug', { ignore: '**/@(mixins|partials)/**/*.pug' })
  .pipe(gulpPug())
  .pipe(gulpBeautify.html({
    end_with_newline: true,
    // Comments will get an extra newline before them.
    extra_liners: ['!--'],
    indent_inner_html: true,
    indent_size: 2,
    // Don't inline any tags.
    inline: [],
    js: {
      // Prevents an extra newline before the closing </script> tag.
      end_with_newline: false,
    },
  }))
  .pipe(dest('dist'));

// Compile SCSS to CSS.
// prettier-ignore
const sass = () => src('src/styles/index.scss')
  .pipe(gulpSass({ outputStyle: 'expanded' }).on('error', gulpSass.logError))
  .pipe(gulpPostcss([mqpacker({ sort: true })]))
  .pipe(gulpBeautify.css({
    end_with_newline: true,
    indent_size: 2,
    newline_between_rules: true,
    selector_separator_newline: true,
  }))
  .pipe(gulpRename('styles.css'))
  .pipe(dest('dist/css'));

// Stream the compiled CSS to Browser Sync.
const reloadSass = () => sass().pipe(bs.stream({ match: '**/*.css' }));

// Stream the compiled HTML to Browser Sync.
const reloadPug = () => pug().pipe(bs.stream({ match: '**/*.html', once: true }));

// Watch all SCSS files for changes and let Browser Sync inject changes into the page.
const watchSass = () => watch('src/styles/**/*.scss', reloadSass);

// Watch all Pug files for changes and let Browser Sync reload the page.
const watchPug = () => watch('src/templates/**/*.pug', reloadPug);

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
  pug,
  sass,
  browserSync,
  parallel(watchPug, watchSass),
);

// prettier-ignore
exports.build = series(
  clean,
  worktree,
  copy,
  pug,
  sass,
);
