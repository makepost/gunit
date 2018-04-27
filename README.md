# gunit

Extracts `require()` from [Acme Commander](https://github.com/makepost/acme-commander), to complement [the CommonJS runtime](https://github.com/cgjs/cgjs) in development and testing of GLib-heavy apps. Goal differs from Cgjs, not to replicate Node APIs, but to gather code coverage with Gjs built-in feature and, outside tests, give you the convenient `module.hot.accept`.

## Parallel tests

Inspired by [ava](https://github.com/avajs/ava):

- Runs tests concurrently

- No implicit globals

- Promise support

> Having tests run concurrently forces you to write atomic tests, meaning tests don't depend on global state or the state of other tests, which is a great thing!

## Test syntax

```js
const { test } = require("gunit");

test("passes after awaiting promise", async t => {
  await Promise.resolve();

  t.pass();
});

test("compares values", t => {
  t.is(1 + 1, 2);
});
```

## Usage

Make sure you have all dependencies, including GNOME JavaScript v1.52 or newer, and lcov:

```bash
# Ubuntu 17.10
sudo apt update && sudo apt install bash coreutils gir1.2-gtk-3.0 gjs lcov npm
```

Then install with [npm](https://nodejs.org/en/download/):

```bash
npm install --save-dev gunit
```

Add a script to your `package.json`:

```
{
  "name": "awesome-package",
  "scripts": {
    "test": "gunit"
  },
  "devDependencies": {
    "gunit": "^1.0.0"
  }
}
```

Run it:

```bash
npm test
```

Will find and load `*.test.js` in your app directory.

## License

MIT
