// src/index.ts
import { configure } from "./internal/config.js";
import { idLabels, DEFAULT_LABELS as enLabels } from "./internal/labels.js";
import { SerupaProvider, useLocale, useSerupa } from "./internal/provider.js";
import { announce } from "./internal/announce.js";
import { useCollator } from "./internal/collator.js";
import { customIcons, getIcon, registerIcons } from "./icons.js";
export * from "./generated/components.js";
var version = "9.7.0";
export {
  SerupaProvider,
  announce,
  configure,
  customIcons,
  enLabels,
  getIcon,
  idLabels,
  registerIcons,
  useCollator,
  useLocale,
  useSerupa,
  version
};
/*! Serupa · React components (needs React 19) · CHANGELOG.md */
//# sourceMappingURL=index.js.map
