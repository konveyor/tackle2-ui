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
import { BundleOrderSetting, RuleBundle, Setting } from "@app/api/models";
import { updateBundleOrderSetting } from "@app/api/rest";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import {
  BundleOrderSettingKey,
  useDeleteRuleBundleMutation,
  useFetchBundleOrder,
  useFetchRuleBundles,
} from "@app/queries/rulebundles";
import { useEntityModal } from "@app/shared/hooks/useEntityModal";
import { NotificationsContext } from "@app/shared/notifications-context";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { UpdateCustomTargetModal } from "./components/update-custom-target-modal/update-custom-target-modal";
import { NewCustomTargetModal } from "./components/new-custom-target-modal";

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

  const [activeId, setActiveId] = useState(null);

  const onDeleteRuleBundleSuccess = (response: any, ruleBundleID: number) => {
    pushNotification({
      title: "Custom target deleted",
      variant: "success",
    });

    // update bundle order

    const updatedBundleSetting: BundleOrderSetting = {
      key: BundleOrderSettingKey,
      value: bundleOrderSetting.value.filter(
        (bundleID: number) => bundleID !== ruleBundleID
      ),
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

    const updatedBundleSetting: BundleOrderSetting = {
      key: BundleOrderSettingKey,
      value: [...bundleOrderSetting.value, response.data.id],
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
    closeMigrationTargetModal();

    closeMigrationTargetModal();
    refetchRuleBundles();
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
          items={bundleOrderSetting.value}
          strategy={rectSortingStrategy}
        >
          <DndGrid columns={4}>
            {bundleOrderSetting?.value?.map((id) => (
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
