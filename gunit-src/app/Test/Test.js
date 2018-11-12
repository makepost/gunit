class Test {
  /**
   * @template T, TReturn
   * @param {T[]} xs
   * @param {(x: T) => Promise<TReturn>} createPromise
   */
  static async all(xs, createPromise) {
    if (this.props.serial) {
      for (const x of xs) {
        await createPromise(x);
      }
      return;
    }
    return Promise.all(xs.map(createPromise));
  }

  /** @param {string} title @param {(t: Test) => void} callback */
  static push(title, callback) {
    Test.tests.push(new Test(title, callback));
  }

  static async run() {
    const component = (/\/([^/]+)\.test\.js$/.exec(this.path) || [
      "",
      this.path
    ])[1];
    await this.all(this.tests.splice(0), async test => {
      print(`${component}: ${test.title} STARTED`);
      try {
        await test.callback(test);
      } catch (error) {
        print(`${component}: ${test.title} ERROR`);
        throw error;
      }
      print(`${component}: ${test.title} SUCCESS`);
    });
  }

  /** @param {string} title @param {(t: Test) => void} callback */
  constructor(title, callback) {
    this.callback = callback;
    this.title = title;
  }

  /** @template T @param {T} x @param {T} y */
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
Test.path = "";
Test.props = { serial: false };
/** @type {Test[]} */ Test.tests = [];
exports.Test = Test;
exports.test = Test.push;
