const { File, FileQueryInfoFlags, FileType } = imports.gi.Gio;
const GLib = imports.gi.GLib;

// Define with var, so Gjs native module exports it.
// tslint:disable:no-var-keyword
var Require = class {
  // tslint:enable:no-var-keyword
  constructor() {
    this.File = File;
    this.GLib = GLib;
    this.imports = imports;
    this.window = window;

    const keys = Object.getOwnPropertyNames(Require.prototype);

    /** @type {{ [key: string]: any }} */

    const self = this;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const val = self[key];

      if (key !== "constructor" && typeof val === "function") {
        self[key] = val.bind(self);
      }
    }

    /**
     * Regular expression to get current module path from error stack.
     */
    this.currentModulePath = /^[\s\S]*?\n.*?@(.*?):[\s\S]*/;

    /**
     * Arrays of required modules, indexed by parent filename.
     */
    this.dependencies = {};

    /**
     * Object where filenames of the modules that have ever been required are keys.
     */
    this.filenames = {};

    /**
     * Creates function from string. Breaks coverage for the module defining it,
     * so defined in `./RequireFun` that is loaded when `require` is available.
     *
     * @type {any}
     */
    this.Fun = undefined;

    /**
     * File system polling interval.
     */
    this.hmrInterval = 1000;

    /**
     * Delay to make sure file has finished being written.
     */
    this.hmrTimeout = 1000;

    /**
     * Cache of modules, indexed by filename.
     */
    this.modules = {};
  }

  /**
   * Invalidates cache and calls a function when a module file is changed.
   *
   * @param {string} dirname
   * @param {string} path
   * @param {() => void} callback
   */
  accept(dirname, path, callback) {
    const filename = this.resolve(dirname, path);
    let lastContents = {};
    let isVerifyingChange = false;

    const handleChanged = () => {
      if (isVerifyingChange) {
        return;
      }

      isVerifyingChange = true;

      this.GLib.timeout_add(this.GLib.PRIORITY_DEFAULT, this.hmrTimeout, () => {
        this.flatten(filename).forEach(filenameToRead => {
          if (!isVerifyingChange) {
            return;
          }

          const contents = String(
            this.GLib.file_get_contents(filenameToRead)[1]
          );

          if (lastContents[filenameToRead] !== contents) {
            lastContents[filenameToRead] = contents;

            this.flatten(filename).forEach(filenameToInvalidate => {
              delete this.modules[filenameToInvalidate];
            });

            isVerifyingChange = false;
            callback();
          }
        });

        isVerifyingChange = false;
        return false;
      });
    };

    this.flatten(filename).forEach(filenameToRead => {
      lastContents[filenameToRead] = String(
        this.GLib.file_get_contents(filenameToRead)[1]
      );
    });

    this.GLib.timeout_add(this.GLib.PRIORITY_DEFAULT, this.hmrInterval, () => {
      if (isVerifyingChange) {
        return true;
      }

      this.flatten(filename).forEach(filenameToRead => {
        if (isVerifyingChange) {
          return;
        }

        const contents = String(this.GLib.file_get_contents(filenameToRead)[1]);

        if (lastContents[filenameToRead] !== contents) {
          handleChanged();
        }
      });

      return true;
    });
  }

  /**
   * Gets pathnames of a cached module and all its dependencies.
   *
   * @param {string} filename
   */
  flatten(filename) {
    let result = [filename];
    let nextResult = null;
    let same = false;

    while (!same) {
      nextResult = result
        .reduce((prev, x) => prev.concat(this.dependencies[x]), result)
        .filter((x, i, a) => a.indexOf(x) === i);

      same = result.length === nextResult.length;
      result = nextResult;
    }

    return result;
  }

  /**
   * Returns environment variables.
   */
  getEnv() {
    /** @type {string[]} */
    const pairs = this.GLib.get_environ();

    /** @type {{ [name: string]: string }} */
    const env = {};

    for (const pair of pairs) {
      /** @type {any} */
      const match = pair.match(/^([^=]+)=(.*)$/);
      env[match[1]] = match[2];
    }

    return env;
  }

  /**
   * Returns a cached module or creates an empty one. Normalizes the path.
   *
   * @param {string} path
   */
  getOrCreate(path) {
    const gFile = this.File.new_for_path(path);
    const dirname = this.dirname(gFile);
    const filename = gFile.get_path();

    const module =
      this.modules[filename] ||
      (this.modules[filename] = {
        exports: {},
        filename: filename,
        hot: { accept: this.accept.bind(null, dirname) }
      });

    this.filenames[filename] = true;

    if (!this.dependencies[filename]) {
      this.dependencies[filename] = [];
    }

    return module;
  }

  /**
   * Shims __filename, __dirname, exports, module, require, process and
   * console. Just enough to use some CommonJS from npm.
   */
  require() {
    /** @type {any} */
    const window = this.window;

    window.process = { env: this.getEnv() };
    window.console = { error: print, log: print, warn: print };

    Object.defineProperty(window, "__filename", {
      /**
       * Returns the full path to the module that requested it.
       */
      get: () => {
        const path = String(new Error().stack).replace(
          this.currentModulePath,
          "$1"
        );
        return this.File.new_for_path(path).get_path();
      }
    });

    Object.defineProperty(window, "__dirname", {
      /**
       * Returns the full path to the parent dir of the module that requested it.
       */
      get: () => {
        const path = String(new Error().stack).replace(
          this.currentModulePath,
          "$1"
        );
        return this.File.new_for_path(path)
          .get_path()
          .replace(/.[^/]+$/, "");
      }
    });

    Object.defineProperty(window, "exports", {
      /**
       * Returns the exports property of the module that requested it. Note: if
       * you refer to exports after reassigning module.exports, this won't behave
       * like CommonJS would.
       */
      get: () => {
        const path = String(new Error().stack).replace(
          this.currentModulePath,
          "$1"
        );
        const module = this.getOrCreate(path);
        return module.exports;
      }
    });

    Object.defineProperty(window, "module", {
      /**
       * Returns the meta object of the module that requested it, so you can
       * replace the default exported object if you really need to.
       */
      get: () => {
        const path = String(new Error().stack).replace(
          this.currentModulePath,
          "$1"
        );
        const module = this.getOrCreate(path);
        return module;
      }
    });

    Object.defineProperty(window, "require", {
      /**
       * Returns the require function bound to filename of the module that
       * requested it.
       */
      get: () => {
        const dirname = String(new Error().stack).replace(
          this.currentModulePath,
          "$1"
        );
        const gFile = this.File.new_for_path(dirname);
        const parentFilename = gFile.get_path();
        const require = this.requireModule.bind(null, parentFilename);
        require.cache = this.modules;
        require.resolve = this.resolve.bind(null, this.dirname(gFile));
        return require;
      }
    });

    this.REQUIRE = memoize(this.REQUIRE);
    this.LOAD_AS_FILE = memoize(this.LOAD_AS_FILE);
    this.LOAD_INDEX = memoize(this.LOAD_INDEX);
    this.LOAD_AS_DIRECTORY = memoize(this.LOAD_AS_DIRECTORY);
    this.LOAD_NODE_MODULES = memoize(this.LOAD_NODE_MODULES);
    this.NODE_MODULES_PATHS = memoize(this.NODE_MODULES_PATHS);
    this.IS_FILE = memoize(this.IS_FILE);
    this.JOIN = memoize(this.JOIN);

    this.Fun = require("./RequireFun").RequireFun;
    // exports.Require = Require; // FIXME
  }

  /**
   * @private
   * @param {string} X
   */
  IS_FILE(X) {
    const gFile = this.File.new_for_path(X);

    if (!gFile.query_exists(null)) {
      return false;
    }

    const gFileInfo = gFile.query_info(
      "standard::type",
      FileQueryInfoFlags.NONE,
      null
    );

    return gFileInfo.get_file_type() === FileType.REGULAR;
  }

  /**
   * @private
   * @param {string} X
   */
  LOAD_AS_FILE(X) {
    if (this.IS_FILE(X)) {
      return X;
    }

    if (this.IS_FILE(`${X}.js`)) {
      return `${X}.js`;
    }

    if (this.IS_FILE(`${X}.json`)) {
      return `${X}.json`;
    }
  }

  /**
   * @private
   * @param {string} X
   */
  LOAD_AS_DIRECTORY(X) {
    if (this.IS_FILE(this.JOIN(X, "package.json"))) {
      const contents = String(
        this.GLib.file_get_contents(this.JOIN(X, "package.json"))[1]
      );
      const M = this.JOIN(X, JSON.parse(contents).main);
      const result = this.LOAD_AS_FILE(M) || this.LOAD_INDEX(M);

      if (result) {
        return result;
      }
    }

    return this.LOAD_INDEX(X);
  }

  /**
   * @private
   * @param {string} X
   */
  LOAD_INDEX(X) {
    if (this.IS_FILE(this.JOIN(X, "index.js"))) {
      return this.JOIN(X, "index.js");
    }

    if (this.IS_FILE(this.JOIN(X, "index.json"))) {
      return this.JOIN(X, "index.json");
    }
  }

  /**
   * @private
   * @param {string} X
   * @param {string} START
   */
  LOAD_NODE_MODULES(X, START) {
    const DIRS = this.NODE_MODULES_PATHS(START);

    for (const DIR of DIRS) {
      const result =
        this.LOAD_AS_FILE(this.JOIN(DIR, X)) ||
        this.LOAD_AS_DIRECTORY(this.JOIN(DIR, X));

      if (result) {
        return result;
      }
    }
  }

  /**
   * @private
   * @param {string} START
   */
  NODE_MODULES_PATHS(START) {
    const PARTS = START.split("/");
    let I = PARTS.length - 1;
    PARTS[0] = "/";

    /** @type {string[]} */
    const DIRS = [];

    while (I >= 0) {
      if (PARTS[I] !== "node_modules") {
        DIRS.push(
          PARTS.slice(0, I + 1)
            .concat("node_modules")
            .reduce(this.JOIN)
        );
      }

      I = I - 1;
    }

    return DIRS;
  }

  /**
   * @private
   * @param {string} X
   * @param {string} Y
   */
  JOIN(X, Y) {
    return this.File.new_for_path(X)
      .resolve_relative_path(Y)
      .get_path();
  }

  /**
   * Require(X) from module at path Y.
   *
   * @see https://nodejs.org/api/modules.html#modules_all_together
   *
   * @private
   * @param {string} X
   * @param {string} Y
   */
  REQUIRE(X, Y) {
    if (X[0] === "/") {
      Y = "/"; // filesystem root
    }

    /** @type {string | undefined} */
    let result = undefined;

    if (X.slice(0, 2) === "./" || X[0] === "/" || X.slice(0, 3) === "../") {
      result =
        this.LOAD_AS_FILE(this.JOIN(Y, X)) ||
        this.LOAD_AS_DIRECTORY(this.JOIN(Y, X));

      if (result) {
        return result;
      }
    }

    result = this.LOAD_NODE_MODULES(X, Y);

    if (result) {
      return result;
    }

    throw new Error("Module not found: " + X);
  }

  /**
   * @private
   * @param {File} gFile
   */
  dirname(gFile) {
    const parent = /** @type {File} */ (gFile.get_parent());
    return parent.get_path();
  }

  /**
   * Gets a normalized local pathname. Understands Dot and Dot Dot, or looks into
   * node_modules up to the root. Adds '.js' suffix if omitted.
   *
   * @private
   * @param {string} dirname
   * @param {string} path
   */
  resolve(dirname, path) {
    return this.REQUIRE(path, dirname);
  }

  /**
   * Loads a module by evaluating file contents in a closure. For example, this
   * can be used to require lodash/toString, which Gjs can't import natively. Or
   * to reload a module that has been deleted from cache.
   *
   * @private
   * @param {string} parentFilename
   * @param {string} path
   */
  requireClosure(parentFilename, path) {
    const dirname = this.dirname(this.File.new_for_path(parentFilename));
    const filename = this.resolve(dirname, path);

    if (this.modules[filename]) {
      return this.modules[filename].exports;
    }

    let contents = String(this.GLib.file_get_contents(filename)[1]);
    const module = this.getOrCreate(filename);

    const require = this.requireModule.bind(null, filename);
    require.cache = this.modules;
    require.resolve = this.resolve.bind(null, dirname);

    if (contents.indexOf("//# sourceURL=") === -1) {
      contents += `\n//# sourceURL=${filename}`;
    }

    this.Fun(
      "exports",
      "require",
      "module",
      "__filename",
      "__dirname",
      contents
    )(module.exports, require, module, filename, dirname);

    if (!this.dependencies[parentFilename]) {
      this.dependencies[parentFilename] = [filename];
    } else if (this.dependencies[parentFilename].indexOf(filename) === -1) {
      this.dependencies[parentFilename].push(filename);
    }

    return module.exports;
  }

  /**
   * Loads a module and returns its exports. Caches the module.
   *
   * @private
   * @param {string} parentFilename
   * @param {string} path
   */
  requireModule(parentFilename, path) {
    const dirname = this.dirname(this.File.new_for_path(parentFilename));
    const filename = this.resolve(dirname, path);

    if (this.modules[filename]) {
      return this.modules[filename].exports;
    }

    if (this.filenames[filename]) {
      // The module has been deleted from cache.

      if (this.dependencies[filename]) {
        this.dependencies[filename].splice(0);
      }

      return this.requireClosure(parentFilename, path);
    }

    if (this.GLib.getenv("NODE_ENV") === "production" && this.Fun) {
      // Faster than importing dirs.
      return this.requireClosure(parentFilename, path);
    }

    if (path.slice(-5) === ".json") {
      const contents = String(this.GLib.file_get_contents(path)[1]);

      return JSON.parse(contents);
    }

    const parts = filename
      .replace(
        this.imports.searchPath[this.imports.searchPath.length - 1] + "/",
        ""
      )
      .replace(/\.js$/, "")
      .split("/");

    if (parts[parts.length - 1] === "toString") {
      return this.requireClosure(parentFilename, path);
    }

    const module = this.getOrCreate(filename);
    let current = this.imports;
    parts.forEach(x => {
      current = current[x];
    });

    if (!this.dependencies[parentFilename]) {
      this.dependencies[parentFilename] = [filename];
    } else if (this.dependencies[parentFilename].indexOf(filename) === -1) {
      this.dependencies[parentFilename].push(filename);
    }

    return module.exports;
  }
};

/**
 * Caches results of unary or binary function.
 *
 * @param {(arg1: any, arg2?: any) => any} fun
 */
function memoize(fun) {
  // Making cache = {} an optional ES6 parameter breaks coverage. Why?

  /** @type {({ [key: string]: any })} */
  const cache = {};

  if (fun.length === 1) {
    return (/** @type {any} */ arg) => {
      if (arg in cache) {
        return cache[arg];
      }

      const result = fun(arg);
      cache[arg] = result;
      return result;
    };
  }

  return (/** @type {any} */ arg1, /** @type {any} */ arg2) => {
    if (cache[arg1] && arg2 in cache[arg1]) {
      return cache[arg1][arg2];
    }

    const result = fun(arg1, arg2);

    if (!cache[arg1]) {
      cache[arg1] = {};
    }

    cache[arg1][arg2] = result;

    return result;
  };
}
