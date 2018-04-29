class ErrorStack {
  /**
   * @param {any} error
   */
  constructor(error) {
    /** @type {string} */
    this.stack = error.stack;
  }

  /**
   * @param {string} path
   */
  remove(path) {
    this.stack = this.stack
      .replace(/\n[^\w][^\n]+/g, "")
      .split("\n")
      .filter(
        (/** @type {string} */ x) =>
          x.length && /\w/.test(x[0]) && x.indexOf(path) === -1
      )
      .join("\n");

    return this;
  }

  toString() {
    return this.stack.toString();
  }
}

exports.ErrorStack = ErrorStack;
