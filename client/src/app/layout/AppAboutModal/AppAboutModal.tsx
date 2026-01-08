import * as React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  AboutModal,
  Text,
  TextContent,
  TextList,
  TextListItem,
  TextVariants,
} from "@patternfly/react-core";

import { ENV } from "@app/env";
import useBranding from "@app/hooks/useBranding";

export interface AppAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRANSPARENT_1x1_GIF =
  "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw== ";

const AboutLink: React.FC<{ href?: string; children?: React.ReactNode }> = ({
  href,
  children,
}) => (
  <Text href={href} component={TextVariants.a} target="_blank">
    {children}
  </Text>
);

export const AppAboutModal: React.FC<AppAboutModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { about } = useBranding();

  return (
    <AboutModal
      isOpen={isOpen}
      onClose={onClose}
      trademark="COPYRIGHT © 2022."
      brandImageSrc={about.imageSrc ?? TRANSPARENT_1x1_GIF}
      brandImageAlt="Logo"
      productName={about.displayName}
    >
      <TextContent>
        <Text component={TextVariants.h4}>{t("about.about")}</Text>

        <Text component={TextVariants.p}>
          {t("about.introduction", { brandType: about.displayName })}
        </Text>

        <Text component={TextVariants.p}>
          {t("about.description", { brandType: about.displayName })}
        </Text>

        <Text component={TextVariants.p}>
          <Trans
            i18nKey={"about.bottom1"}
            values={{ brandType: about.displayName }}
            components={{
              Link: <AboutLink href="https://www.konveyor.io/" />,
            }}
          />
        </Text>

        {about.documentationUrl ? (
          <Text component={TextVariants.p}>
            <Trans
              i18nKey={"about.bottom2"}
              values={{ brandType: about.displayName }}
              components={{
                Link: <AboutLink href={about.documentationUrl} />,
              }}
            />
          </Text>
        ) : null}

        <Text component={TextVariants.p}>
          <Trans
            i18nKey="about.iconLibrary"
            components={{
              Link: <AboutLink />,
            }}
          ></Trans>
        </Text>
      </TextContent>
      <TextContent className="pf-v5-u-py-xl">
        <TextContent>
          <TextList component="dl">
            <TextListItem component="dt">{t("terms.version")}</TextListItem>
            <TextListItem component="dd">{ENV.VERSION}</TextListItem>
          </TextList>
        </TextContent>
      </TextContent>
    </AboutModal>
  );
};
