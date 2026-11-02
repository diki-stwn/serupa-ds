// src/internal/config.ts
var config = { link: "a" };
function configure(opts) {
  opts = opts || {};
  if (opts.link) config.link = opts.link;
  return Object.assign({}, config);
}
export {
  config,
  configure
};
//# sourceMappingURL=config.js.map
