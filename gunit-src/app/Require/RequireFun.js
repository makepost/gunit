/**
 * @param {any[]} args
 */
exports.RequireFun = (...args) => Function.apply(null, args);
