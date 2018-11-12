#!/usr/bin/env gjs
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
 * `imports.src` keeps the value it has on first access, so renamed `src`
 * to `gunit-src` which is unlikely to conflict with your app.
 */
const { ErrorStack } = require("../gunit-src/app/Error/ErrorStack");
const { Flatten } = require("../gunit-src/app/Flatten/Flatten");
const { Test } = require("../gunit-src/app/Test/Test");

const your = imports.gi.GLib.get_current_dir();
imports.searchPath.splice(-1, 1, your);

const data = Flatten.flatten(imports.gi.Gio.File.new_for_path(your), {
  exclude: [".git", "bin", "coverage", "node_modules"]
});

for (let i = 0; i < ARGV.length; i++) {
  if (ARGV[i] === "-h" || ARGV[i] === "--help") {
    print("Usage: gunit [OPTION]... [LAST_DIRNAME_WHITELIST]...");
    print("Find **/*.test.js and run with GNOME JavaScript.");
    print("");
    print("  -s, --serial   disable concurrency");
    print("  -h, --help     display this help and exit");

    imports.system.exit(0);
  }

  if (ARGV[i] === "-s" || ARGV[i] === "--serial") {
    Test.props.serial = true;
    ARGV.splice(i, 1);
    i--;
  }
}

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

const loop = imports.mainloop;
let exit = 0;

(async () => {
  const tests = scripts.filter(x => /\.test\.js$/.test(x));
  await Test.all(tests, async x => {
    Test.path = x;
    require(x);
    await Test.run();
  });

  // Make sure the report shows uncovered modules.
  const modules = scripts.filter(x => !/\.test\.js$/.test(x));
  modules.forEach(x => {
    require(x);
  });

  loop.quit("gunit");
})().catch(error => {
  // tslint:disable:no-console
  console.error(error);
  console.error(
    new ErrorStack(error)
      .remove("gunit/bin")
      .remove("gunit-src/app/Test")
      .toString()
  );
  exit = 1;
  loop.quit("gunit");
});

loop.run("gunit");
imports.system.exit(exit);
