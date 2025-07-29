import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
  TextContent,
  Text,
  Title,
  List,
  ListItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { LabelsFromItems } from "@app/components/labels/labels-from-items/labels-from-items";
import { RiskLabel } from "@app/components/RiskLabel";
import {
  getDependenciesUrlFilteredByAppName,
  getIssuesSingleAppSelectedLocation,
} from "@app/pages/issues/helpers";
import { DecoratedApplication } from "../useDecoratedApplications";
import { Archetype } from "@app/api/models";
import { ApplicationDetailFields } from "./application-detail-fields";

const ApplicationArchetypesLabels: React.FC<{
  application: DecoratedApplication;
  filter?: (archetype: Archetype) => boolean;
  color?: Parameters<typeof LabelsFromItems>[0]["color"];
}> = ({
  application: {
    direct: { archetypes },
  },
  filter = () => true,
  color = "grey",
}) => {
  const { t } = useTranslation();
  const filteredArchetypes = !archetypes ? [] : archetypes.filter(filter);
  return (filteredArchetypes?.length ?? 0) > 0 ? (
    <LabelsFromItems items={filteredArchetypes} color={color} />
  ) : (
    <EmptyTextMessage message={t("terms.none")} />
  );
};

export const TabDetailsContent: React.FC<{
  application: DecoratedApplication;
  onCloseClick: () => void;
  onEditClick: () => void;
}> = ({ application, onCloseClick, onEditClick }) => {
  const { t } = useTranslation();
  return (
    <>
      <TextContent className={`${spacing.mtMd} ${spacing.mbMd}`}>
        <Text component="small">{application?.description}</Text>
        <List isPlain>
          {application ? (
            <>
              <ListItem>
                <Link to={getIssuesSingleAppSelectedLocation(application.id)}>
                  Issues
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  to={getDependenciesUrlFilteredByAppName(application?.name)}
                >
                  Dependencies
                </Link>
              </ListItem>
            </>
          ) : null}
        </List>
      </TextContent>

      <Title headingLevel="h3" size="md">
        {t("terms.effort")}
      </Title>
      <Text component="small">
        <Text component="small">
          {application?.effort !== 0 && application?.effort !== undefined
            ? application?.effort
            : t("terms.unassigned")}
        </Text>
      </Text>

      <Title headingLevel="h3" size="md">
        {t("terms.archetypes")}
      </Title>
      <DescriptionList
        isHorizontal
        isCompact
        columnModifier={{ default: "1Col" }}
        horizontalTermWidthModifier={{
          default: "15ch",
        }}
      >
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("terms.associatedArchetypes")}
          </DescriptionListTerm>
          <DescriptionListDescription>
            <ApplicationArchetypesLabels application={application} />
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("terms.archetypesAssessed")}
          </DescriptionListTerm>
          <DescriptionListDescription>
            <ApplicationArchetypesLabels
              application={application}
              filter={
                // Filter matches the archetype table's assessment column
                (archetype) => !!archetype.assessed
              }
            />
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("terms.archetypesReviewed")}
          </DescriptionListTerm>
          <DescriptionListDescription>
            <ApplicationArchetypesLabels
              application={application}
              filter={
                // Filter matches the archetype table's review column
                (archetype) => !!archetype.review
              }
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>

      <Title headingLevel="h3" size="md">
        {t("terms.riskFromApplication")}
      </Title>
      <Text component="small" cy-data="comments">
        <RiskLabel risk={application?.risk} />
      </Text>

      <ApplicationDetailFields
        application={application}
        onEditClick={onEditClick}
        onCloseClick={onCloseClick}
      />
    </>
  );
};
