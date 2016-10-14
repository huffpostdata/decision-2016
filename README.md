# Developing

1. Install NodeJS >= 6.7.0 from https://nodejs.org/en/
2. `npm install`
3. `cp sample-data/* data/`
4. `generator/dev.js`

Then browse to http://localhost:3001

Also, run `npm test` before committing, and run `npm run test-watch` in the
background if you're editing server-side JavaScript.

# Directory layout and docs for dependencies

This framework goes from zero to website in milliseconds. On load, it does this:

1. Loads and computes, as specified in `app/Database.js`
2. Generates assets (CSS, Javascript, images, etc)
3. Generates pages
4. Serves it all

All of this happens in memory. `generator/dev.js` simply spawns a new web server
each time any code changes. `generator/upload.js` simply copies everything to
S3.

When developing, look to:

* `config/pages.yml`: it's kinda a router, except it explicitly lists all
  possible endpoints. Here's where we comment on what each endpoint does.
* `./views`: [MarkoJS](http://markojs.com/docs/) files. MarkoJS documentation is
  patchy, but it's oh-so-fast. Each template has a `data` variable:
  * `data.helpers.X` methods are in `app/Helper.js`
  * `data.model` is set in `app/Database.js`
  * `data.X` is usually defined in `generator/PageContext.js`
* `./app`: the views invoke code from `app/Helpers.js`. The generator invokes
  code from `app/Database.js`. All the other files are dependencies of one or
  the other. Write ES6 code: no semicolons, `'use strict'` throughout, *no*
  `var` anywhere.
* `./data`: Files the generator reads. These are not checked into git. Copy
  from `./sample-data` to get your generator running.
* `./scripts`: Files that write to `./data`. They may `require()` code from
  `./app` -- for instance, if they build an object model and dump it.
* `./raw-assets`: Whatever you want -- our site generator ignores this
  directory. It's useful for, say, uncompressed images.
* `./assets/images` et al: As specified in `config/assets.yml`, these get a
  digest appended to them. Refer to them like this:
  `data.path_to_asset('digest', 'images/X.jpg')`
* `./assets/javascripts/[entrypoint].js`: as specified in `config/assets.yml`,
  these are entrypoints. (Some other Javascript files are digested, just like
  images.) They may `require()` files in subdirectories. Browsers see this
  Javascript, bundled but not modified -- write browser-compatible code.
* `./assets/javascripts/[subdir]/[blah].js`: entrypoints may `require()`
  these -- write browser-compatible code. `app/` code may `require()` this,
  too, for any structures/methods that we share between client and server.
* `./assets/stylesheets/[entrypoint].scss`: as specified in
  `config/assets.yml`, these are SCSS entrypoints. Colors go in
  `_variables.scss`. Code mobile-first; use
  `@media (min-width: $min-desktop-width)`, _never_ `@media (max-width: ...)`.
* `./test`: [Mocha](https://mochajs.org/), [Chai](http://chaijs.com/) and
  [Sinon](http://sinonjs.org/) test suite, for stuff in `./app` and
  `./assets/javascripts/[subdir]/[blah].js`. We have no DOM tests.

## Updating our Google Docs

If you're adding/removing docs, look to `config/google-docs.yml`.

Then run `npm run update-google-docs` to download newer data from Google Docs.

You'll have to commit the newly-downloaded JSON to this repository to publish
it.

# Deploying

We'll automate this. But for now, here's how we deployed to production:

1. (Once per project) SSH into a server and:
  1. `git init --bare SLUG.git`
  2. Copy this file to `~/SLUG.git/hooks/post-receive`:
```
#!/bin/sh

read OLDREV NEWREV REFNAME

set -ex

[ "$REFNAME" = 'refs/heads/master' ] || exit 0

ROOT=/tmp/deploy-SLUG

rm -rf "$ROOT/code"
mkdir -p "$ROOT/code"
git archive --format=tar HEAD | (cd "$ROOT/code" && tar xf -)

mkdir -p "$ROOT/shared/node_modules" # if it doesn't already exist
ln -sf "$ROOT/shared/node_modules" "$ROOT/code/node_modules"

pushd "$ROOT/code"

npm install --production
S3_BUCKET=data.huffingtonpost.com \
  BASE_URL='http://data.huffingtonpost.com' \
  node generator/upload.js

popd
```
  3. `chmod +x ~/SLUG.git/hooks/post-receive`
2. (Once per dev machine per project) Run `git remote add production ssh://rails@production-elections-utility-01.use1.huffpo.net/home/rails/SLUG.git`
3. (Once per deploy) `git push production master`. You'll see the output in your console.

