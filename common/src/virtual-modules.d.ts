declare module "@konveyor-ui/branding/strings.js" {
  const strings: {
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
      leftBrand?: {
        src: string;
        alt: string;
        height: string;
      };
      leftTitle?: {
        text: string;
        heading?: string;
        size?: string;
      };
      rightBrand?: {
        src: string;
        alt: string;
        height: string;
      };
    };
  };
  export default strings;
}
