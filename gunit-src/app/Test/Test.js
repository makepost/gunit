class Test {
  /**
   * @param {string} title
   * @param {(t: Test) => void} callback
   */
  static push(title, callback) {
    Test.tests.push(new Test(title, callback));
  }

  static async run() {
    const component = (/\/([^/]+)\.test\.js$/.exec(this.path) || [
      "",
      this.path
    ])[1];

    const tests = this.tests.splice(0);

    await Promise.all(
      tests.map(async test => {
        print(`${component}: ${test.title} STARTED`);

        try {
          await test.callback(test);
        } catch (error) {
          print(`${component}: ${test.title} ERROR`);
          throw error;
        }

        print(`${component}: ${test.title} SUCCESS`);
      })
    ).catch(error => {
      this.debug(error);

      this.debug(
        error.stack
          .replace(/\n[^\w][^\n]+/g, "")
          .split("\n")
          .filter(
            (/** @type {string} */ x) =>
              x.length &&
              /\w/.test(x[0]) &&
              x.indexOf("gunit-src/app/Test") === -1
          )
          .join("\n")
      );

      imports.system.exit(1);
    });
  }

  /**
   * @param {string} title
   * @param {(t: Test) => void} callback
   */
  constructor(title, callback) {
    this.callback = callback;

    this.title = title;
  }

  /**
   * @template T
   * @param {T} x
   * @param {T} y
   */
  is(x, y) {
    if (x !== y) {
      const error = new Error(`${x} == ${y}`);
      error.name = "AssertionError";
      throw error;
    }
  }

  pass() {
    return;
  }
}

Test.debug = console.error;

Test.path = "";

/** @type{Test[]} */
Test.tests = [];

exports.Test = Test;
exports.test = Test.push;
