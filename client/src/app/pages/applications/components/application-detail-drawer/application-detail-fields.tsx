import React from "react";
import { useTranslation } from "react-i18next";
import { Title, TextContent, Text, TextVariants } from "@patternfly/react-core";
import { Application } from "@app/api/models";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { ApplicationBusinessService } from "../application-business-service";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";

export const ApplicationDetailFields: React.FC<{
  application: Application | null;
}> = ({ application }) => {
  const { t } = useTranslation();

  return (
    <>
      <TextContent className={spacing.mtLg}>
        <Title headingLevel="h3" size="md">
          {t("terms.applicationInformation")}
        </Title>
      </TextContent>
      <Title headingLevel="h3" size="md">
        {t("terms.owner")}
      </Title>
      <Text
        component={TextVariants.small}
        className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
      >
        {application?.owner ?? t("terms.notAvailable")}
      </Text>
      <Title headingLevel="h3" size="md">
        {t("terms.contributors")}
      </Title>
      <Text
        component={TextVariants.small}
        className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
      >
        {application?.contributors?.length
          ? application.contributors
              .map((contributor) => contributor.name)
              .join(", ")
          : t("terms.notAvailable")}
      </Text>
      <Title headingLevel="h3" size="md">
        {t("terms.sourceCode")}
      </Title>
      <Text
        component={TextVariants.small}
        className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
      >
        {t("terms.repositoryType")}
        {": "}
      </Text>
      <Text
        component={TextVariants.small}
        className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
      >
        {application?.repository?.kind}
      </Text>
      <br />
      <Text
        component={TextVariants.small}
        className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
      >
        <a href={application?.repository?.url} target="_">
          {application?.repository?.url}
        </a>
      </Text>
      <br />
      <Text
        component={TextVariants.small}
        className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
      >
        {t("terms.branch")}
        {": "}
      </Text>
      <Text
        component={TextVariants.small}
        className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
      >
        {application?.repository?.branch}
      </Text>
      <br />
      <Text
        component={TextVariants.small}
        className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
      >
        {t("terms.rootPath")}
        {": "}
      </Text>
      <Text
        component={TextVariants.small}
        className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
      >
        {application?.repository?.path}
      </Text>
      <br />
      <Title headingLevel="h3" size="md">
        {t("terms.binary")}
      </Title>
      <Text
        component={TextVariants.small}
        className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
      >
        {application?.binary}
      </Text>
      <Title headingLevel="h3" size="md">
        {t("terms.businessService")}
      </Title>
      <Text component="small">
        {application?.businessService ? (
          <ApplicationBusinessService id={application.businessService.id} />
        ) : (
          t("terms.unassigned")
        )}
      </Text>
      <Title headingLevel="h3" size="md">
        {t("terms.migrationWave")}
      </Title>
      <Text component="small">
        {application?.migrationWave
          ? application.migrationWave.name
          : t("terms.unassigned")}
      </Text>
      <Title headingLevel="h3" size="md">
        {t("terms.commentsFromApplication")}
      </Title>
      <Text component="small" cy-data="comments">
        {application?.comments || (
          <EmptyTextMessage message={t("terms.notAvailable")} />
        )}
      </Text>
    </>
  );
};
