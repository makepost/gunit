class Test {
  /**
   * @param {string} title
   * @param {(t: Test) => void} callback
   */
  static test(title, callback) {
    print(title + " STARTED");

    try {
      callback(new Test());
    } catch (error) {
      print(title + " ERROR");
      throw error;
    }

    print(title + " SUCCESS");
  }

  /**
   * @template T
   * @param {T} x
   * @param {T} y
   */
  is(x, y) {
    if (x !== y) {
      throw new Error(`${x} !== ${y}`);
    }
  }
}

exports.test = Test.test;
