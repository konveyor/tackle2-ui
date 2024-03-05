import React from "react";
import { useTranslation, Trans } from "react-i18next";

import {
  AboutModal,
  TextContent,
  Text,
  TextVariants,
  TextList,
  TextListItem,
} from "@patternfly/react-core";
import { ENV } from "@app/env";
import useBranding from "@app/hooks/useBranding";

export interface AppAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRANSPARENT_1x1_GIF =
  "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw== ";

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
          <Trans i18nKey={"about.bottom1"}>
            {{ brandType: about.displayName }} is a project within the
            <Text
              component={TextVariants.a}
              href="https://www.konveyor.io/"
              target="_blank"
            >
              Konveyor community
            </Text>
            .
          </Trans>
        </Text>

        {about.documentationUrl ? (
          <Text component={TextVariants.p}>
            <Trans i18nKey={"about.bottom2"}>
              For more information, refer to
              <Text
                component={TextVariants.a}
                href={about.documentationUrl}
                target="_blank"
              >
                {{ brandType: about.displayName }} documentation
              </Text>
              .
            </Trans>
          </Text>
        ) : null}

        <Text component={TextVariants.p}>
          <Trans i18nKey="about.iconLibrary">
            The Icon Library used in this project is a derivative of the{" "}
            <Text
              component={TextVariants.a}
              href="https://www.redhat.com/en/about/brand/standards/icons/standard-icons"
              target="_blank"
            >
              Standard Icons library
            </Text>
            by{" "}
            <Text
              component={TextVariants.a}
              href="https://www.redhat.com"
              target="_blank"
            >
              Red Hat
            </Text>
            , used under{" "}
            <Text
              component={TextVariants.a}
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
            >
              CC BY 4.0
            </Text>
          </Trans>
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
