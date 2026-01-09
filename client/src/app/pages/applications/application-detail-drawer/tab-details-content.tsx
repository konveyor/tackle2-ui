import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  List,
  ListItem,
  Spinner,
  Text,
  TextContent,
  TextVariants,
  Title,
  Tooltip,
} from "@patternfly/react-core";
import { EditIcon, UnlinkIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Archetype } from "@app/api/models";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import ExternalLink from "@app/components/ExternalLink";
import { RiskLabel } from "@app/components/RiskLabel";
import {
  DrawerTabContent,
  DrawerTabContentSection,
} from "@app/components/detail-drawer";
import { LabelsFromItems } from "@app/components/labels/labels-from-items/labels-from-items";
import { getInsightsSingleAppSelectedLocation } from "@app/pages/insights/helpers";
import {
  getDependenciesUrlFilteredByAppName,
  getIssuesSingleAppSelectedLocation,
} from "@app/pages/issues/helpers";
import { useDeleteTicketMutation } from "@app/queries/migration-waves";
import { useFetchTickets } from "@app/queries/tickets";

import { DecoratedApplication } from "../useDecoratedApplications";

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
    <DrawerTabContent>
      <TextContent className={spacing.mtMd}>
        <Text component="small">{application.description}</Text>
        <List isPlain>
          <ListItem>
            <Link to={getIssuesSingleAppSelectedLocation(application.id)}>
              {t("terms.issues")}
            </Link>
          </ListItem>
          <ListItem>
            <Link to={getInsightsSingleAppSelectedLocation(application.id)}>
              {t("terms.insights")}
            </Link>
          </ListItem>
          <ListItem>
            <Link to={getDependenciesUrlFilteredByAppName(application?.name)}>
              {t("terms.dependencies")}
            </Link>
          </ListItem>
        </List>
      </TextContent>

      <DrawerTabContentSection label={t("terms.effort")}>
        <Text component="small">
          {application?.effort !== 0 && application?.effort !== undefined ? (
            application?.effort
          ) : (
            <EmptyTextMessage message={t("terms.unassigned")} />
          )}
        </Text>
      </DrawerTabContentSection>

      <DrawerTabContentSection label={t("terms.archetypes")}>
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
      </DrawerTabContentSection>

      <DrawerTabContentSection label={t("terms.riskFromApplication")}>
        <Text component="small" cy-data="risk">
          <RiskLabel risk={application?.risk} />
        </Text>
      </DrawerTabContentSection>

      <TextContent className={spacing.mtLg}>
        <Grid>
          <GridItem span={6}>
            <Title headingLevel="h3" size="md">
              {t("terms.applicationInformation")}
            </Title>
          </GridItem>
          <GridItem span={1}>
            <Button
              style={{ paddingTop: "0px", paddingBottom: "0px" }}
              variant="link"
              aria-label="Edit"
              onClick={() => {
                onEditClick();
                onCloseClick();
              }}
              icon={<EditIcon />}
            />
          </GridItem>
        </Grid>
      </TextContent>

      <DrawerTabContentSection>
        <DrawerTabContentSection label={t("terms.owner")}>
          <Text
            component={TextVariants.small}
            className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
          >
            {application?.owner?.name ?? <EmptyTextMessage />}
          </Text>
        </DrawerTabContentSection>

        <DrawerTabContentSection label={t("terms.contributors")}>
          <Text
            component={TextVariants.small}
            className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
          >
            {application?.contributors?.length ? (
              application.contributors
                .map((contributor) => contributor.name)
                .join(", ")
            ) : (
              <EmptyTextMessage />
            )}
          </Text>
        </DrawerTabContentSection>

        {/* TODO: Extract and add source code details render to common components and reuse where repositories are rendered */}
        <DrawerTabContentSection label={t("terms.sourceCode")}>
          {application.repository &&
          application.repository.kind &&
          application.repository.url ? (
            <>
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
                <ExternalLink
                  href={application?.repository?.url ?? ""}
                  isInline
                >
                  {application?.repository?.url}
                </ExternalLink>
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
            </>
          ) : (
            <Text
              component={TextVariants.small}
              className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
            >
              <EmptyTextMessage />
            </Text>
          )}
        </DrawerTabContentSection>

        <DrawerTabContentSection label={t("terms.binary")}>
          <Text
            component={TextVariants.small}
            className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
          >
            {application?.binary || <EmptyTextMessage />}
          </Text>
        </DrawerTabContentSection>

        <DrawerTabContentSection label={t("terms.businessService")}>
          <Text component="small">
            {application.direct.businessService?.name || (
              <EmptyTextMessage message={t("terms.unassigned")} />
            )}
          </Text>
        </DrawerTabContentSection>

        <DrawerTabContentSection label={t("terms.migrationWave")}>
          <MigrationWaveDetails application={application} />
        </DrawerTabContentSection>

        <DrawerTabContentSection label={t("terms.commentsFromApplication")}>
          <Text component="small" cy-data="comments">
            {application?.comments || <EmptyTextMessage />}
          </Text>
        </DrawerTabContentSection>
      </DrawerTabContentSection>
    </DrawerTabContent>
  );
};

const MigrationWaveDetails: React.FC<{
  application: DecoratedApplication;
}> = ({ application }) => {
  const { t } = useTranslation();
  const { mutate: deleteTicket, isPending } = useDeleteTicketMutation();
  const { tickets } = useFetchTickets();
  const matchingTicket = tickets?.find(
    (ticket) => ticket.application?.id === application?.id
  );

  return (
    <Text
      component={TextVariants.small}
      className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
    >
      {application?.migrationWave ? (
        `Wave name: ${application?.migrationWave.name}`
      ) : (
        <i>{`Wave name: ${t("terms.unassigned")}`}</i>
      )}
      <br />
      {matchingTicket ? (
        <>
          Ticket:{" "}
          <ExternalLink href={matchingTicket.link ?? ""} isInline>
            {matchingTicket?.link}
          </ExternalLink>
        </>
      ) : (
        <i>{`Ticket: ${t("terms.unassigned")}`}</i>
      )}
      {matchingTicket?.id ? (
        isPending ? (
          <Spinner role="status" size="sm" />
        ) : (
          <Tooltip
            content={t("message.unlinkTicket")}
            position="top"
            entryDelay={1000}
          >
            <Button
              variant="link"
              icon={<UnlinkIcon />}
              onClick={() => deleteTicket(matchingTicket.id)}
            />
          </Tooltip>
        )
      ) : null}
    </Text>
  );
};
