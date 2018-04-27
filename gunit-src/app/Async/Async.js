const { AsyncResult } = imports.gi.Gio;

class Async {
  /**
   * Calls an async method on a Gio object, given a Node-style callback.
   *
   * @param {(readyCallback: (_: any, result: AsyncResult) => void) => void} start
   * @param {(asyncResult: AsyncResult) => any} finish
   * @param {(error?: any, result?: any) => void} callback
   */
  static fromGio(start, finish, callback) {
    start((_, asyncResult) => {
      let result;

      try {
        result = finish(asyncResult);
      } catch (error) {
        callback(error);
        return;
      }

      callback(undefined, result);
    });
  }
}

exports.Async = Async;
