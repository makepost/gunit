const { AsyncResult } = imports.gi.Gio;

class Async {
  /**
   * Calls an async method on a Gio object, given a Node-style callback.
   *
   * @template T
   * @param {(readyCallback: (_: any, result: AsyncResult) => void) => void} start
   * @param {(asyncResult: AsyncResult) => T} finish
   * @returns {Promise<T>}
   */
  static fromGio(start, finish) {
    return new Promise((resolve, reject) => {
      start((_, asyncResult) => {
        let result;

        try {
          result = finish(asyncResult);
        } catch (error) {
          reject(error);
          return;
        }

        resolve(result);
      });
    });
  }
}

exports.Async = Async;
