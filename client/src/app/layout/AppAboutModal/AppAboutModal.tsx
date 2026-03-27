import * as React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  AboutModal,
  Content,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListDescription,
} from "@patternfly/react-core";

import { ENV } from "@app/env";
import { useBranding } from "@app/hooks/useBranding";

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
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
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
      <Content>
        <Content component="h4">{t("about.about")}</Content>

        <Content component="p">
          {t("about.introduction", { brandType: about.displayName })}
        </Content>

        <Content component="p">
          {t("about.description", { brandType: about.displayName })}
        </Content>

        <Content component="p">
          <Trans
            i18nKey={"about.bottom1"}
            values={{ brandType: about.displayName }}
            components={{
              Link: <AboutLink href="https://www.konveyor.io/" />,
            }}
          />
        </Content>

        {about.documentationUrl ? (
          <Content component="p">
            <Trans
              i18nKey={"about.bottom2"}
              values={{ brandType: about.displayName }}
              components={{
                Link: <AboutLink href={about.documentationUrl} />,
              }}
            />
          </Content>
        ) : null}

        <Content component="p">
          <Trans
            i18nKey="about.iconLibrary"
            components={{
              Link: <AboutLink />,
            }}
          ></Trans>
        </Content>
      </Content>
      <Content className="pf-u-py-xl">
        <Content>
          <DescriptionList>
            <DescriptionListTerm>{t("terms.version")}</DescriptionListTerm>
            <DescriptionListDescription>{ENV.VERSION}</DescriptionListDescription>
          </DescriptionList>
        </Content>
      </Content>
    </AboutModal>
  );
};
