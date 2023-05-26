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

import konveyorBrandImage from "@app/images/konveyor-logo-white-text.png";
import mtaBrandImage from "@app/images/logoRedHat.svg";
import { APP_BRAND, BrandType } from "@app/Constants";
import { ENV } from "@app/env";

export interface AppAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppAboutModal: React.FC<AppAboutModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const brandName =
    APP_BRAND === BrandType.Konveyor
      ? "Konveyor"
      : "Migration Toolkit for Applications";
  return (
    <AboutModal
      isOpen={isOpen}
      onClose={onClose}
      trademark="COPYRIGHT © 2022."
      brandImageSrc={
        APP_BRAND === BrandType.Konveyor ? konveyorBrandImage : mtaBrandImage
      }
      brandImageAlt="Logo"
      productName={brandName}
    >
      <TextContent>
        <Text component={TextVariants.h4}>{t("about.about")}</Text>
        <Text component={TextVariants.p}>
          {t("about.introduction", { brandType: brandName })}
        </Text>
        <Text component={TextVariants.p}>
          {t("about.description", { brandType: brandName })}
        </Text>
        <Text component={TextVariants.p}>
          {t("about.bottom1", { brandType: brandName })}{" "}
          <Text
            component={TextVariants.a}
            href="https://www.konveyor.io/"
            target="_blank"
          >
            Konveyor community
          </Text>
          .
        </Text>
        <Text component={TextVariants.p}>
          {t("about.bottom2")}{" "}
          <Text
            component={TextVariants.a}
            href={
              APP_BRAND === BrandType.Konveyor
                ? "https://konveyor.github.io/konveyor/"
                : "https://access.redhat.com/documentation/en-us/migration_toolkit_for_applications"
            }
            target="_blank"
          >
            {brandName} documentation
          </Text>
          .
        </Text>
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
      <TextContent className="pf-u-py-xl">
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
