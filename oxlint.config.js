import { defineConfig } from "oxlint";
import dividConfig from "./index.js";

// Dogfoods this package's own config to lint its own source. `dividConfig`'s `jsPlugins` entry is
// the bare specifier "oxlint-config-divid/functional-plugin.js", resolved via node_modules like any
// real consumer's would be - see the "oxlint-config-divid": "link:." devDependency in package.json.
export default defineConfig({ extends: [dividConfig] });
