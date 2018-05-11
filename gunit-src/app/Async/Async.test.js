const { PRIORITY_DEFAULT } = imports.gi.GLib;
const { test } = require("../Test/Test");
const { Async } = require("./Async");

test("from gio _async and _finish, creates promise", async t => {
  const existingDir = new GioFile(true);

  let error;

  try {
    await Async.fromGio(
      readyCallback =>
        existingDir.make_directory_async(PRIORITY_DEFAULT, null, readyCallback),

      asyncResult => existingDir.make_directory_finish(asyncResult)
    );
  } catch (_) {
    error = _;
  }

  t.is(error.message, "Directory exists.");

  const dir = new GioFile(false);

  const result = await Async.fromGio(
    readyCallback =>
      dir.make_directory_async(PRIORITY_DEFAULT, null, readyCallback),

    asyncResult => dir.make_directory_finish(asyncResult)
  );

  t.is(result, true);
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
