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

Here's how we set up our "staging" server:

1. Create a server
2. On the server, `sudo mkdir /opt/decision-2016 && sudo chown USER:USER /opt/decision-2016 && cd /opt/decision-2016 && git init && git config receive.denyCurrentBranch updateInstead` ([updateInstead documentation](https://github.com/blog/1957-git-2-3-has-been-released))
3. On the server, write to `/opt/decision-2016/.git/hooks/post-receive`:
    ```
    #!/bin/sh

    pushd /opt/decision-2016 >/dev/null

    npm install --production

    BASE_URL=... \
    S3_BUCKET=... \
    generator/upload.js
    ```
4. On the server, `chmod +x /opt/decision-2016/.git/hooks/post-receive`
5. On each dev machine, `git remote add staging USER@[server]:/opt/decision-2016`
6. (Once per deploy, on a dev machine) `git push staging master`. You'll see the output in your console.
