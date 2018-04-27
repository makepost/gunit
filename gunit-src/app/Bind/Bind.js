let lastPerf = Date.now();
const perf = {};

const reportPerf = () => {
  const now = Date.now();

  if (now - lastPerf < 10000) {
    return;
  }

  lastPerf = now;

  const data = Object.keys(perf)
    .map(location => ({
      location,
      time: perf[location]
    }))
    .sort((a, b) => b.time - a.time)
    .slice(0, 10);

  print(JSON.stringify(data));
};

class Bind {
  /**
   * Binds prototype methods to your object instance, reporting in development
   * how much time on main loop each called synchronous method takes.
   *
   * @param {Object} self
   * @param {string} filename
   */
  static auto(self, filename) {
    const { prototype } = self.constructor;
    const keys = Object.getOwnPropertyNames(prototype);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const val = prototype[key];

      if (key !== "constructor" && typeof val === "function") {
        self[key] = val.bind(self);

        if (process.env.NODE_ENV === "development") {
          const bound = self[key];

          self[key] = function() {
            const args = Array.prototype.slice.call(arguments);
            const match = /([^/]*).js$/.exec(filename) || ["", filename];
            const perfKey = `${match[1]}.${key}`;

            const start = Date.now();
            const result = bound.apply(self, args);
            perf[perfKey] = (perf[perfKey] || 0) + Date.now() - start;

            reportPerf();

            return result;
          };
        }
      }
    }
  }
}

exports.Bind = Bind;
