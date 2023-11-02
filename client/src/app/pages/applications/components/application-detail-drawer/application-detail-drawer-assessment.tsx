import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  TextContent,
  Text,
  Title,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { Ref, Task } from "@app/api/models";
import {
  ApplicationDetailDrawer,
  IApplicationDetailDrawerProps,
} from "./application-detail-drawer";
import { ReviewedArchetypeItem } from "./reviewed-archetype-item";
import { ReviewFields } from "./review-fields";
import { RiskLabel } from "@app/components/RiskLabel";
import { LabelsFromItems } from "@app/components/labels-from-items/labels-from-items";

export interface IApplicationDetailDrawerAssessmentProps
  extends Pick<
    IApplicationDetailDrawerProps,
    "application" | "onCloseClick" | "onEditClick"
  > {
  task: Task | undefined | null;
}

export const ApplicationDetailDrawerAssessment: React.FC<
  IApplicationDetailDrawerAssessmentProps
> = ({ application, onCloseClick, task, onEditClick }) => {
  const { t } = useTranslation();

  return (
    <ApplicationDetailDrawer
      application={application}
      task={task}
      onCloseClick={onCloseClick}
      onEditClick={onEditClick}
      detailTabContent={
        <>
          <Title headingLevel="h3" size="md">
            {t("terms.archetypes")}
          </Title>
          <DescriptionList
            isHorizontal
            isCompact
            columnModifier={{ default: "1Col" }}
            horizontalTermWidthModifier={{
              default: "14ch",
            }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t("terms.associatedArchetypes")}
              </DescriptionListTerm>
              <DescriptionListDescription>
                {application?.archetypes?.length ?? 0 > 0 ? (
                  <ArchetypeLabels archetypeRefs={application?.archetypes} />
                ) : (
                  <EmptyTextMessage message={t("terms.none")} />
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t("terms.archetypesReviewed")}
              </DescriptionListTerm>
              <DescriptionListDescription>
                {application?.archetypes?.length ?? 0 > 0 ? (
                  application?.archetypes?.map((archetypeRef) => (
                    <ReviewedArchetypeItem
                      key={archetypeRef.id}
                      id={archetypeRef.id}
                    />
                  ))
                ) : (
                  <EmptyTextMessage message={t("terms.none")} />
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
          <TextContent className={spacing.mtLg}>
            <Title headingLevel="h3" size="md">
              {t("terms.riskFromApplication")}
            </Title>
            <Text component="small" cy-data="comments">
              <RiskLabel risk={application?.risk || "unknown"} />
            </Text>
          </TextContent>
        </>
      }
      reviewsTabContent={<ReviewFields application={application} />}
    />
  );
};

const ArchetypeLabels: React.FC<{ archetypeRefs?: Ref[] }> = ({
  archetypeRefs,
}) => <LabelsFromItems items={archetypeRefs} />;
