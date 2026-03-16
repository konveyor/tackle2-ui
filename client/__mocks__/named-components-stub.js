/* global module, require */

/**
 * Generic mock for modules that export components via named imports.
 * Returns a stub component for any named or default import.
 * Renders as <test-file-stub /> in snapshots. Forwards props to match
 * usage in wrappers (e.g. aria-hidden for EmptyStateIcon).
 */

const { createElement } = require("react");
const ComponentStub = (props) => createElement("test-file-stub", props);

const handler = {
  get(_target, prop) {
    if (prop === "default") return ComponentStub;
    if (prop === "__esModule") return true;
    return ComponentStub;
  },
};

// module.exports required: makes the Proxy the module namespace so that
// `import { Foo } from "module"` resolves Foo via the Proxy's get trap
module.exports = new Proxy({}, handler);
