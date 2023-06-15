import React, { useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./components/dnd/sortable-item";
import {
  PageSection,
  PageSectionVariants,
  Grid,
  GridItem,
  TextContent,
  Button,
  Text,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useTranslation } from "react-i18next";

import { Item } from "./components/dnd/item";
import { DndGrid } from "./components/dnd/grid";
import { Ruleset, Setting } from "@app/api/models";
import { AxiosError, AxiosResponse } from "axios";
import {
  useDeleteRulesetMutation,
  useFetchRulesets,
} from "@app/queries/rulesets";
import { useEntityModal } from "@app/shared/hooks/useEntityModal";
import { NotificationsContext } from "@app/shared/notifications-context";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { UpdateCustomTargetModal } from "./components/update-custom-target-modal/update-custom-target-modal";
import { NewCustomTargetModal } from "./components/new-custom-target-modal";
import { useSetting, useSettingMutation } from "@app/queries/settings";

export const MigrationTargets: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const {
    rulesets,
    isFetching: isFetchingrulesets,
    refetch: refetchrulesets,
  } = useFetchRulesets();

  const rulesetOrderSetting = useSetting("ui.ruleset.order");
  const rulesetOrderSettingMutation = useSettingMutation("ui.ruleset.order");

  const targetsEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    targetsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [activeId, setActiveId] = useState(null);

  const onDeleterulesetsuccess = (response: any, RulesetID: number) => {
    pushNotification({
      title: "Custom target deleted",
      variant: "success",
    });

    if (rulesetOrderSetting.isSuccess)
      rulesetOrderSettingMutation.mutate(
        rulesetOrderSetting.data.filter(
          (rulesetID: number) => rulesetID !== RulesetID
        )
      );
  };

  const onDeleteRulesetError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteRuleset } = useDeleteRulesetMutation(
    onDeleterulesetsuccess,
    onDeleteRulesetError
  );

  const onCustomTargetModalSaved = (response: AxiosResponse<Ruleset>) => {
    if (!rulesetToUpdate) {
      pushNotification({
        title: t("toastr.success.saveWhat", {
          what: response.data.name,
          type: "custom target",
        }),
        variant: "success",
        message: (
          <Button
            variant="link"
            onClick={scrollToBottom}
            className={spacing.pl_0}
          >
            Take me there
          </Button>
        ),
      });
    }
    // update ruleset order

    if (
      rulesetOrderSetting.isSuccess &&
      response.data.id &&
      rulesetOrderSetting.data
    ) {
      rulesetOrderSettingMutation.mutate([
        ...rulesetOrderSetting.data,
        response.data.id,
      ]);
      closeMigrationTargetModal();
      refetchrulesets();
    }
  };

  // Create and update modal
  const {
    isOpen: isMigrationTargetModalOpen,
    data: rulesetToUpdate,
    create: openCreateMigrationTargetModal,
    update: openUpdateMigrationTargetModal,
    close: closeMigrationTargetModal,
  } = useEntityModal<Ruleset>();

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  function handleDragOver(event: any) {
    if (rulesetOrderSetting.isSuccess) {
      const { active, over } = event;

      if (active.id !== over.id) {
        const reorderRuleset = (items: number[]) => {
          const oldIndex = items.indexOf(active.id);
          const newIndex = items.indexOf(over.id);

          return arrayMove(items, oldIndex, newIndex);
        };

        rulesetOrderSettingMutation.mutate(
          reorderRuleset(rulesetOrderSetting.data)
        );
      }
    }
  }

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Grid>
          <GridItem span={10}>
            <TextContent>
              <Text component="h1">{t("terms.customTargets")}</Text>
            </TextContent>
          </GridItem>
          <GridItem span={2}></GridItem>
          <GridItem span={10}>
            <TextContent>
              <Text>{t("terms.customTargetsDetails")}</Text>
            </TextContent>
          </GridItem>
          <GridItem span={2} className="button-align">
            <Button
              id="clear-repository"
              isInline
              className={spacing.mlMd}
              onClick={openCreateMigrationTargetModal}
            >
              Create new
            </Button>
          </GridItem>
        </Grid>
        <NewCustomTargetModal
          isOpen={isMigrationTargetModalOpen && !!!rulesetToUpdate}
          onSaved={onCustomTargetModalSaved}
          onCancel={closeMigrationTargetModal}
        />
        <UpdateCustomTargetModal
          ruleset={rulesetToUpdate}
          onSaved={closeMigrationTargetModal}
          onCancel={closeMigrationTargetModal}
        />
      </PageSection>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
      >
        <SortableContext
          items={rulesetOrderSetting.isSuccess ? rulesetOrderSetting.data : []}
          strategy={rectSortingStrategy}
        >
          <DndGrid>
            {rulesetOrderSetting.isSuccess &&
              rulesetOrderSetting.data.map((id) => (
                <SortableItem
                  key={id}
                  id={id}
                  onEdit={() => {
                    const matchingRuleset = rulesets.find(
                      (Ruleset) => Ruleset.id === id
                    );
                    if (matchingRuleset) {
                      openUpdateMigrationTargetModal(matchingRuleset);
                    }
                  }}
                  onDelete={() => {
                    const matchingRuleset = rulesets.find(
                      (Ruleset) => Ruleset.id === id
                    );
                    if (matchingRuleset?.id) {
                      deleteRuleset(matchingRuleset.id);
                    }
                  }}
                />
              ))}
            <div ref={targetsEndRef} />
          </DndGrid>
          <DragOverlay>{activeId ? <Item id={activeId} /> : null}</DragOverlay>
        </SortableContext>
      </DndContext>
    </>
  );
};
