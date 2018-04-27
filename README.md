# gunit

Extracts `require()` from [Acme Commander](https://github.com/makepost/acme-commander), to complement [the CommonJS runtime](https://github.com/cgjs/cgjs) in development and testing of GLib-heavy apps. Goal differs from Cgjs, not to replicate Node APIs, but to gather code coverage with Gjs built-in feature and, outside tests, give you the convenient `module.hot.accept`.

## Usage

Make sure you have all dependencies, including GNOME JavaScript v1.52 or newer:

```bash
# Ubuntu 17.10
sudo apt update && sudo apt install bash coreutils gir1.2-gtk-3.0 gjs lcov npm
```

Then install with [npm](https://nodejs.org/en/download/):

```bash
npm install --global gunit
```

Find and run `*.test.js` in your app directory:

```bash
gunit
```

## License

MIT
