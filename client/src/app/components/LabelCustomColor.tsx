import * as React from "react";
import tinycolor from "tinycolor2";
import { Label, LabelProps } from "@patternfly/react-core";

// Omit the variant prop, we won't support the outline variant
export interface ILabelCustomColorProps extends Omit<
  LabelProps,
  "variant" | "color"
> {
  color: string;
}

const globalColorCache: Record<
  string,
  { borderColor: string; backgroundColor: string; textColor: string }
> = {};

/**
 * LabelCustomColor
 * A wrapper for PatternFly's Label component that supports arbitrary custom CSS colors
 * (e.g. hexadecimal) and ensures text will always be readable.
 *
 * Applying an arbitrary color to a label presents the possibility of unreadable text due to insufficient color contrast.
 * This component solves the issue by applying the given color as a border color and using the tinycolor2 library to determine a
 * lightened background color and darkened text color (if necessary) in order to reach a color contrast ratio of at least 7:1.
 * This ratio meets the "level AAA" requirement of the Web Content Accessibility Guidelines (WCAG).
 * See https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced
 *
 * Note: This adjustment means that multiple labels with very similar colors (especially dark colors) may be adjusted to look almost identical.
 * All props of PatternFly's Label component are supported except the `variant` prop (only the default "filled" variant is supported).
 */
export const LabelCustomColor: React.FC<ILabelCustomColorProps> = ({
  color,
  ...props
}) => {
  const { borderColor, backgroundColor, textColor } = React.useMemo(() => {
    if (globalColorCache[color]) return globalColorCache[color];
    // Lighten the background 30%, and lighten it further if necessary until it can support readable text
    const bgColorObj = tinycolor(color).lighten(30);
    const blackTextReadability = () =>
      tinycolor.readability(bgColorObj, "#000000");
    const whiteTextReadability = () =>
      tinycolor.readability(bgColorObj, "#FFFFFF");
    while (blackTextReadability() < 9 && whiteTextReadability() < 9) {
      bgColorObj.lighten(5);
    }
    // Darken or lighten the text color until it is sufficiently readable
    const textColorObj = tinycolor(color);
    while (tinycolor.readability(bgColorObj, textColorObj) < 7) {
      if (blackTextReadability() > whiteTextReadability()) {
        textColorObj.darken(5);
      } else {
        textColorObj.lighten(5);
      }
    }
    globalColorCache[color] = {
      borderColor: color,
      backgroundColor: bgColorObj.toString(),
      textColor: textColorObj.toString(),
    };
    return globalColorCache[color];
  }, [color]);
  return (
    <Label
      style={
        {
          "--pf-v5-c-label__content--before--BorderColor": borderColor,
          "--pf-v5-c-label__content--link--hover--before--BorderColor":
            borderColor,
          "--pf-v5-c-label__content--link--focus--before--BorderColor":
            borderColor,
          "--pf-v5-c-label--BackgroundColor": backgroundColor,
          "--pf-v5-c-label__icon--Color": textColor,
          "--pf-v5-c-label__content--Color": textColor,
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

/*

Note: if we were to support the outline variant of Label,
we would need to account for the following additional CSS variables:

--pf-v5-c-label--m-outline__content--Color
--pf-v5-c-label--m-outline__content--before--BorderColor
--pf-v5-c-label--m-outline__content--link--hover--before--BorderColor
--pf-v5-c-label--m-outline__content--link--focus--before--BorderColor
--pf-v5-c-label--m-editable__content--before--BorderColor
--pf-v5-c-label--m-editable__content--hover--before--BorderColor
--pf-v5-c-label--m-editable__content--focus--before--BorderColor

*/
