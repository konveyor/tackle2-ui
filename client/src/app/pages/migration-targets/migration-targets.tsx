import React, { useEffect, useState } from "react";
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
import { CustomTargetForm } from "./custom-target-form";
import { BundleOrderSetting, RuleBundle, Setting } from "@app/api/models";
import { updateBundleOrderSetting } from "@app/api/rest";
import { AxiosPromise, AxiosResponse } from "axios";
import {
  BundleOrderSettingKey,
  useFetchBundleOrder,
  useFetchRuleBundles,
} from "@app/queries/rulebundles";
import { useEntityModal } from "@app/shared/hooks/useEntityModal";
import { NotificationsContext } from "@app/shared/notifications-context";

export const MigrationTargets: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const {
    ruleBundles,
    isFetching: isFetchingRuleBundles,
    refetch: refetchRuleBundles,
  } = useFetchRuleBundles();

  const {
    bundleOrderSetting,
    isFetching,
    refetch: refreshBundleOrderSetting,
  } = useFetchBundleOrder(ruleBundles);

  useEffect(() => {
    refetchRuleBundles();
    refreshBundleOrderSetting();
  }, [isFetching]);

  const [activeId, setActiveId] = useState(null);

  // const [isCustomTargetFormOpen, setIsCustomTargetFormOpen] =
  //   React.useState(false);

  const onCustomTargetModalSaved = (response: AxiosResponse<RuleBundle>) => {
    if (!ruleBundleToUpdate) {
      pushNotification({
        title: t("toastr.success.added", {
          what: response.data.name,
          type: t("terms.application").toLowerCase(),
        }),
        variant: "success",
      });
    }

    closeMigrationTargetModal();
    refetchRuleBundles();
  };

  // Create and update modal
  const {
    isOpen: isCustomTargetFormOpen,
    data: ruleBundleToUpdate,
    create: openCreateMigrationTargetModal,
    update: openUpdateMigrationTargetModal,
    close: closeMigrationTargetModal,
  } = useEntityModal<RuleBundle>();

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  function handleDragOver(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const reorderBundle = (items: number[]) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      };

      const updatedBundleSetting: BundleOrderSetting = {
        key: BundleOrderSettingKey,
        value: reorderBundle(bundleOrderSetting.value),
      };
      let promise: AxiosPromise<Setting>;
      if (updatedBundleSetting !== undefined) {
        promise = updateBundleOrderSetting(updatedBundleSetting);
      } else {
        promise = updateBundleOrderSetting(updatedBundleSetting);
      }
      promise
        .then((response) => {
          refreshBundleOrderSetting();
        })
        .catch((error) => {});
    }
  }
  useEffect(() => {
    refreshBundleOrderSetting();
  }, [refreshBundleOrderSetting]);

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
              onClick={() => openCreateMigrationTargetModal}
            >
              Create new
            </Button>
          </GridItem>
        </Grid>
      </PageSection>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
      >
        <SortableContext
          items={bundleOrderSetting.value}
          strategy={rectSortingStrategy}
        >
          <DndGrid columns={4}>
            {bundleOrderSetting.value.map((id) => (
              <SortableItem
                key={id}
                id={id}
                onEdit={() => {
                  const matchingRuleBundle = ruleBundles.find(
                    (ruleBundle) => ruleBundle.id === id
                  );
                  if (matchingRuleBundle) {
                    openUpdateMigrationTargetModal(matchingRuleBundle);
                  }
                }}
              />
            ))}
          </DndGrid>
          <DragOverlay>{activeId ? <Item id={activeId} /> : null}</DragOverlay>
        </SortableContext>
      </DndContext>
      <CustomTargetForm
        ruleBundle={ruleBundleToUpdate}
        isOpen={isCustomTargetFormOpen}
        onClose={() => closeMigrationTargetModal()}
        onCancel={() => {
          closeMigrationTargetModal();
        }}
        onSaved={() => {
          closeMigrationTargetModal();
        }}
      />
    </>
  );
};
