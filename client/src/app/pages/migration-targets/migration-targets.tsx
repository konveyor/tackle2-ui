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
import { RuleBundle, Setting, SettingNumber } from "@app/api/models";
import { AxiosError, AxiosResponse } from "axios";
import {
  useDeleteRuleBundleMutation,
  useFetchRuleBundles,
} from "@app/queries/rulebundles";
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
    ruleBundles,
    isFetching: isFetchingRuleBundles,
    refetch: refetchRuleBundles,
  } = useFetchRuleBundles();

  const bundleOrderSetting = useSetting("ui.bundle.order");
  const settingMutationQuery = useSettingMutation();

  const [activeId, setActiveId] = useState(null);

  const onDeleteRuleBundleSuccess = (response: any, ruleBundleID: number) => {
    pushNotification({
      title: "Custom target deleted",
      variant: "success",
    });

    // update bundle order
    if (bundleOrderSetting.isSuccess) {
      const updatedBundleSetting: SettingNumber = {
        key: "ui.bundle.order",
        value: (bundleOrderSetting.data as number[]).filter(
          (bundleID: number) => bundleID !== ruleBundleID
        ),
      };
      settingMutationQuery.mutate(updatedBundleSetting);
    }
  };

  const onDeleteRuleBundleError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteRuleBundle } = useDeleteRuleBundleMutation(
    onDeleteRuleBundleSuccess,
    onDeleteRuleBundleError
  );

  const onCustomTargetModalSaved = (response: AxiosResponse<RuleBundle>) => {
    if (!ruleBundleToUpdate) {
      pushNotification({
        title: t("toastr.success.added", {
          what: response.data.name,
          type: "custom target",
        }),
        variant: "success",
      });
    }
    // update bundle order

    if (bundleOrderSetting.isSuccess) {
      const updatedBundleSetting: SettingNumber = {
        key: "ui.bundle.order",
        value: [...(bundleOrderSetting.data as number[]), response.data.id],
      };
      settingMutationQuery.mutate(updatedBundleSetting);
      closeMigrationTargetModal();
      refetchRuleBundles();
    }
  };

  // Create and update modal
  const {
    isOpen: isMigrationTargetModalOpen,
    data: ruleBundleToUpdate,
    create: openCreateMigrationTargetModal,
    update: openUpdateMigrationTargetModal,
    close: closeMigrationTargetModal,
  } = useEntityModal<RuleBundle>();

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  function handleDragOver(event: any) {
    if (bundleOrderSetting.isSuccess) {
      const { active, over } = event;

      if (active.id !== over.id) {
        const reorderBundle = (items: number[]) => {
          const oldIndex = items.indexOf(active.id);
          const newIndex = items.indexOf(over.id);

          return arrayMove(items, oldIndex, newIndex);
        };

        const updatedBundleSetting: Setting = {
          key: "ui.bundle.order",
          value: reorderBundle(bundleOrderSetting.data as number[]),
        };
        settingMutationQuery.mutate(updatedBundleSetting);
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
      </PageSection>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
      >
        <SortableContext
          items={
            bundleOrderSetting.isSuccess
              ? (bundleOrderSetting.data as number[])
              : []
          }
          strategy={rectSortingStrategy}
        >
          <DndGrid columns={4}>
            {bundleOrderSetting.isSuccess &&
              (bundleOrderSetting.data as number[]).map((id) => (
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
                  onDelete={() => {
                    const matchingRuleBundle = ruleBundles.find(
                      (ruleBundle) => ruleBundle.id === id
                    );
                    if (matchingRuleBundle) {
                      deleteRuleBundle(matchingRuleBundle.id);
                    }
                  }}
                />
              ))}
          </DndGrid>
          <DragOverlay>{activeId ? <Item id={activeId} /> : null}</DragOverlay>
        </SortableContext>
      </DndContext>
      <NewCustomTargetModal
        isOpen={isMigrationTargetModalOpen}
        onSaved={onCustomTargetModalSaved}
        onCancel={closeMigrationTargetModal}
      />
      <UpdateCustomTargetModal
        ruleBundle={ruleBundleToUpdate}
        onSaved={(ruleBundleResponseID) => {
          closeMigrationTargetModal();
        }}
        onCancel={closeMigrationTargetModal}
      />
    </>
  );
};
