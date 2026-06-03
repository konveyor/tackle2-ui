export interface MastheadBrand {
  src: string;
  alt: string;
  height: string;
}

export interface MastheadTitle {
  text: string;
  heading?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

export interface BrandingStrings {
  application: {
    title: string;
    name?: string;
    description?: string;
  };

  about: {
    displayName: string;
    imageSrc?: string;
    documentationUrl?: string;
  };

  masthead: {
    leftBrand?: MastheadBrand;
    leftTitle?: MastheadTitle;
    rightBrand?: MastheadBrand;
  };
}

// Note: Typescript resolves this import with the module declaration in `virtual-modules.d.ts`
//       at type check time. In the rslib build step, the module is dynamically generated and
//       provided by a the virtual modules plugin.  The contents of the virtual module is pulled
//       from a defined branding JSON file with the actual branding content.
// eslint-disable-next-line import-x/no-unresolved
import stringsJson from "@konveyor-ui/branding/strings.js";

export const brandingStrings = stringsJson as unknown as BrandingStrings;
