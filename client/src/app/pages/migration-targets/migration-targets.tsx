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
  Modal,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosResponse } from "axios";

import { Item } from "./components/dnd/item";
import { DndGrid } from "./components/dnd/grid";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { CustomTargetForm } from "./components/custom-target-form";
import { useSetting, useSettingMutation } from "@app/queries/settings";
import { useDeleteTargetMutation, useFetchTargets } from "@app/queries/targets";
import { ProviderType, Target } from "@app/api/models";
import { SimpleSelect } from "@app/components/SimpleSelect";

export const MigrationTargets: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const [provider, setProvider] = useState<ProviderType>("Java");

  const { targets, refetch: refetchTargets } = useFetchTargets();

  const targetOrderSetting = useSetting("ui.target.order");
  const targetOrderSettingMutation = useSettingMutation("ui.target.order");

  // Create and update modal
  const [createUpdateModalState, setCreateUpdateModalState] = React.useState<
    "create" | Target | null
  >(null);
  const isCreateUpdateModalOpen = createUpdateModalState !== null;
  const targetToUpdate =
    createUpdateModalState !== "create" ? createUpdateModalState : null;

  const targetsEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    targetsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [activeId, setActiveId] = useState(null);

  const onDeleteTargetSuccess = (target: Target, id: number) => {
    pushNotification({
      title: "Custom target deleted",
      variant: "success",
    });
    if (targetOrderSetting.isSuccess)
      targetOrderSettingMutation.mutate(
        targetOrderSetting.data.filter((targetID: number) => targetID !== id)
      );
  };

  const onDeleteTargetError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteTarget } = useDeleteTargetMutation(
    onDeleteTargetSuccess,
    onDeleteTargetError
  );

  const onCustomTargetModalSaved = (response: AxiosResponse<Target>) => {
    if (targetToUpdate) {
      pushNotification({
        title: t("toastr.success.saveWhat", {
          what: response.data.name,
          type: t("terms.customTarget"),
        }),
        variant: "success",
      });
    } else {
      pushNotification({
        title: t("toastr.success.createWhat", {
          what: response.data.name,
          type: t("terms.customTarget"),
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
      // update target order
      if (
        targetOrderSetting.isSuccess &&
        response.data.id &&
        targetOrderSetting.data
      ) {
        targetOrderSettingMutation.mutate([
          ...targetOrderSetting.data,
          response.data.id,
        ]);
      }
    }

    setCreateUpdateModalState(null);
    refetchTargets();
  };

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  function handleDragOver(event: any) {
    if (targetOrderSetting.isSuccess) {
      const { active, over } = event;

      if (active.id !== over.id) {
        const reorderTarget = (items: number[]) => {
          const oldIndex = items.indexOf(active.id);
          const newIndex = items.indexOf(over.id);

          return arrayMove(items, oldIndex, newIndex);
        };

        targetOrderSettingMutation.mutate(
          reorderTarget(targetOrderSetting.data)
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
          <GridItem span={12}>
            <TextContent>
              <Text>{t("terms.customTargetsDetails")}</Text>
            </TextContent>
          </GridItem>
          <GridItem span={2} className={spacing.mtSm}>
            <SimpleSelect
              variant="typeahead"
              id="action-select"
              toggleId="action-select-toggle"
              toggleAriaLabel="Action select dropdown toggle"
              aria-label={"Select provider"}
              value={provider}
              options={["Java", "Go"]}
              onChange={(selection) => {
                setProvider(selection as ProviderType);
              }}
            />
          </GridItem>
          <GridItem span={2} className={spacing.mtSm}>
            <Button
              id="clear-repository"
              isInline
              className={spacing.mlMd}
              onClick={() => setCreateUpdateModalState("create")}
            >
              Create new
            </Button>
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Modal
          id="create-edit-custom-tarrget-modal"
          title={t(
            targetToUpdate ? "dialog.title.update" : "dialog.title.new",
            {
              what: `${t("terms.customTargetOfType", {
                type: provider,
              })}`,
            }
          )}
          variant="medium"
          isOpen={isCreateUpdateModalOpen}
          onClose={() => setCreateUpdateModalState(null)}
        >
          <CustomTargetForm
            providerType={provider}
            target={targetToUpdate}
            onSaved={onCustomTargetModalSaved}
            onCancel={() => setCreateUpdateModalState(null)}
          />
        </Modal>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
        >
          <SortableContext
            items={targetOrderSetting.isSuccess ? targetOrderSetting.data : []}
            strategy={rectSortingStrategy}
          >
            <DndGrid>
              {targetOrderSetting.isSuccess &&
                targetOrderSetting.data.map((id) => {
                  const matchingTarget = targets.find(
                    (target) => target.id === id
                  );
                  if (matchingTarget && matchingTarget.provider === provider) {
                    return (
                      <SortableItem
                        key={id}
                        id={id}
                        onEdit={() => {
                          if (matchingTarget) {
                            setCreateUpdateModalState(matchingTarget);
                          }
                        }}
                        onDelete={() => {
                          const matchingTarget = targets.find(
                            (target) => target.id === id
                          );
                          if (matchingTarget?.id) {
                            deleteTarget(matchingTarget.id);
                          }
                        }}
                      />
                    );
                  } else {
                    return null;
                  }
                })}
              <div ref={targetsEndRef} />
            </DndGrid>
            <DragOverlay>
              {activeId ? <Item id={activeId} /> : null}
            </DragOverlay>
          </SortableContext>
        </DndContext>
      </PageSection>
    </>
  );
};
