#!/usr/bin/gjs
// Sets up the environment, and runs a Gjs shell or your app.

const path = String(new Error().stack).replace(/^.*?@(.*):[\s\S]*/, "$1");
const dirname = imports.gi.Gio.File.new_for_path(path)
  .resolve_relative_path("../..")
  .get_path();
imports.searchPath.push(dirname);
new imports["gunit-src"].app.Require.Require.Require().require();

const your = imports.gi.GLib.get_current_dir();
imports.searchPath.splice(-1, 1, your);

if (ARGV.length) {
  require(ARGV[0]); // Must be absolute path.
} else {
  imports.console.interact();
}
