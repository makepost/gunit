const { PRIORITY_DEFAULT } = imports.gi.GLib;
const { test } = require("../Test/Test");
const { Async } = require("./Async");

test("wraps _async and _finish into node-style callback", t => {
  const existingDir = new GioFile(true);

  Async.fromGio(
    readyCallback =>
      existingDir.make_directory_async(PRIORITY_DEFAULT, null, readyCallback),

    result => existingDir.make_directory_finish(result),

    (error, result) => {
      t.is(error.message, "Directory exists.");
      t.is(result, undefined);
    }
  );

  const dir = new GioFile(false);

  Async.fromGio(
    readyCallback =>
      dir.make_directory_async(PRIORITY_DEFAULT, null, readyCallback),

    result => dir.make_directory_finish(result),

    (error, result) => {
      t.is(error, undefined);
      t.is(result, true);
    }
  );
});

class GioFile {
  /**
   * @param {boolean} exists
   */
  constructor(exists) {
    this.exists = exists;

    /**
     * @param {any} _
     */
    this.make_directory_finish = _ => {
      if (this.exists) {
        throw new Error("Directory exists.");
      } else {
        return true;
      }
    };
  }

  make_directory_async() {
    arguments[arguments.length - 1](null, {});
  }
}
