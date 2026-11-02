// src/index.ts
import { configure } from "./internal/config.js";
import { idLabels, DEFAULT_LABELS as enLabels } from "./internal/labels.js";
import { SerupaProvider, useLocale, useSerupa } from "./internal/provider.js";
import { announce } from "./internal/announce.js";
import { announcePage } from "./internal/announcePage.js";
import { useCollator } from "./internal/collator.js";
import { plural } from "./internal/plural.js";
import { withoutTransitions } from "./internal/withoutTransitions.js";
import { withViewTransition } from "./internal/viewTransition.js";
import { customIcons, getIcon, registerIcons } from "./icons.js";
export * from "./generated/components.js";
var version = "13.0.0";
export {
  SerupaProvider,
  announce,
  announcePage,
  configure,
  customIcons,
  enLabels,
  getIcon,
  idLabels,
  plural,
  registerIcons,
  useCollator,
  useLocale,
  useSerupa,
  version,
  withViewTransition,
  withoutTransitions
};
/*! Serupa · React components (needs React 19) · CHANGELOG.md */
//# sourceMappingURL=index.js.map
