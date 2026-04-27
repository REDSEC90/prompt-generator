// Stub CJS de chalk para testes Jest (chalk v5 é ESM puro)
const passthrough = (s) => s;
const chalk = new Proxy(passthrough, {
  get: (_, prop) => {
    if (prop === 'level') return 0;
    const fn = new Proxy(passthrough, { get: (_, p) => chalk[p] ?? passthrough });
    return fn;
  },
});
module.exports = chalk;
module.exports.default = chalk;
