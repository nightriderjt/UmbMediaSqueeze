import { manifests as entrypoints } from "./entrypoints/manifest.js";
import { manifests as localization } from "./localization/manifest.js";
import { manifests as entityActions } from "./entity-actions/manifest.js";
import { manifests as collectionActions } from "./collection-actions/manifest.js";
import { manifests as components } from "./components/manifest.js";

// Job of the bundle is to collate all the manifests from different parts of the extension and load other manifests
// We load this bundle from umbraco-package.json
export const manifests = [
  ...entrypoints,
  ...localization,
  ...entityActions,
  ...collectionActions,
  ...components,
];
