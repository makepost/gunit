const { AsyncResult } = imports.gi.Gio;

class Async {
  /**
   * Calls an async method on a Gio object, given a Node-style callback.
   *
   * @param {(readyCallback: (_: any, result: AsyncResult) => void) => void} start
   * @param {(asyncResult: AsyncResult) => any} finish
   * @param {((error?: any, result?: any) => void)?} [callback]
   */
  static fromGio(start, finish, callback) {
    if (!callback) {
      return new Promise((resolve, reject) => {
        Async.fromGio(start, finish, (error, result) => {
          if (!result) {
            reject(error);
            return;
          }

          resolve(result);
        });
      });
    }

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
