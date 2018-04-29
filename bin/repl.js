#!/usr/bin/env gjs
// Sets up the environment, and runs an async Gjs shell or your app.

const path = String(new Error().stack).replace(/^.*?@(.*):[\s\S]*/, "$1");
const dirname = imports.gi.Gio.File.new_for_path(path)
  .resolve_relative_path("../..")
  .get_path();
imports.searchPath.push(dirname);
new imports["gunit-src"].app.Require.Require.Require().require();
const { Console } = require("../gunit-src/app/Console/Console");

const your = imports.gi.GLib.get_current_dir();
imports.searchPath.splice(-1, 1, your);

if (ARGV.length) {
  const entry = imports.gi.Gio.File.new_for_path(your)
    .resolve_relative_path(ARGV[0])
    .get_path();

  require(entry);
} else {
  new Console().run();
}
