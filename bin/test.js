#!/usr/bin/gjs
// Sets up the environment and runs the tests.
// - `npm test`: All tests.
// - `npm test Action Panel`: Tests from src/app/{Action,Panel} only.

const path = String(new Error().stack).replace(/^.*?@(.*):[\s\S]*/, "$1");
const dirname = imports.gi.Gio.File.new_for_path(path)
  .resolve_relative_path("../..")
  .get_path();
imports.searchPath.push(dirname);
new imports["gunit-src"].app.Require.Require.Require().require();
//                           |       |       |         |
//                           dir     file    class     method    :))

/**
 * Loads one module from GUnit, the rest from your app. Can't reload modules
 * required through the imports object, so renamed `src` to `gunit-src`
 * which is unlikely to conflict with your app.
 */
const { Flatten } = require("../gunit-src/app/Flatten/Flatten");

const your = imports.gi.GLib.get_current_dir();
imports.searchPath.splice(-1, 1, your);

const data = Flatten.flatten(imports.gi.Gio.File.new_for_path(your), {
  exclude: [".git", "bin", "coverage", "node_modules"]
});

const scripts = data.files
  .map(x => x.relativePath)
  .filter(
    x =>
      !!x &&
      x.slice(-3) === ".js" &&
      x.slice(-9) !== "/index.js" &&
      (!ARGV.length || ARGV.indexOf(x.split("/").slice(-2)[0]) !== -1)
  )
  .map(x => your + "/" + x);

const tests = scripts.filter(x => /\.test\.js$/.test(x));
tests.forEach(x => {
  require(x);
});

// Make sure the report shows uncovered modules.
const modules = scripts.filter(x => !/\.test\.js$/.test(x));
modules.forEach(x => {
  require(x);
});
