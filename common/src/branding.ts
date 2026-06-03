// eslint-disable-next-line import-x/no-unresolved
import stringsJson from "@konveyor-ui/branding/strings.js";

import type { BrandingStrings } from "./branding-types.js";

export type {
  BrandingStrings,
  MastheadBrand,
  MastheadTitle,
} from "./branding-types.js";

// Note: Typescript resolves this import with the module declaration in `virtual-modules.d.ts`
//       at type check time. In the rslib build step, the module is dynamically generated and
//       provided by a the virtual modules plugin.  The contents of the virtual module is pulled
//       from a defined branding JSON file with the actual branding content.
export const brandingStrings: BrandingStrings = stringsJson;
