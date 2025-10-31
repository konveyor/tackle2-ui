import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosResponse } from "axios";
import { unique } from "radash";

import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTargetItem } from "./components/dnd/sortable-target-item";
import { TargetItem } from "./components/dnd/target-item";

import {
  PageSection,
  PageSectionVariants,
  TextContent,
  Button,
  Text,
  Modal,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Gallery,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { NotificationsContext } from "@app/components/NotificationsContext";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { CustomTargetForm } from "./components/custom-target-form";
import { useSetting, useSettingMutation } from "@app/queries/settings";
import { useDeleteTargetMutation, useFetchTargets } from "@app/queries/targets";
import { Target } from "@app/api/models";
import { DEFAULT_PROVIDER } from "./useMigrationProviderList";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";

export const MigrationTargets: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

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

  const [activeTarget, setActiveTarget] = useState<Target | null>(null);

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

      // Make sure the new target's provider is part of the providers filter so it can be seen
      if (filterState.filterValues["provider"]) {
        const targetProvider = response.data.provider;
        const fv = filterState.filterValues["provider"];
        const newFv = !targetProvider
          ? null
          : fv.includes(targetProvider)
            ? fv
            : [...fv, targetProvider];

        filterState.setFilterValues({
          ...filterState.filterValues,
          provider: newFv,
        });
      }
    }
    setCreateUpdateModalState(null);
    refetchTargets();
  };

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  function handleDragOver(event: DragOverEvent) {
    if (targetOrderSetting.isSuccess) {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const reorderTarget = (items: number[]) => {
          const oldIndex = items.indexOf(active.id as number);
          const newIndex = items.indexOf(over.id as number);

          return arrayMove(items, oldIndex, newIndex);
        };

        targetOrderSettingMutation.mutate(
          reorderTarget(targetOrderSetting.data)
        );
      }
    }
  }

  const handleDragEnd = () => {
    setActiveTarget(null);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    const activeId = active.id as number;
    const activeTarget = targets.find((target) => target.id === activeId);
    setActiveTarget(activeTarget ?? null);
  };

  const tableControls = useLocalTableControls({
    tableName: "target-cards",
    items: targets,
    idProperty: "name",
    initialFilterValues: { provider: [DEFAULT_PROVIDER] },
    columnNames: {
      name: "name",
      provider: "provider",
    },
    isFilterEnabled: true,
    isPaginationEnabled: false,
    isSortEnabled: false,
    // TODO: Add `persistTo` handling if needed.
    filterCategories: [
      {
        selectOptions: unique(
          targets.map((target) => target.provider).filter(Boolean)
        ).map((target) => ({ value: target })),
        placeholderText: "Filter by language...",
        categoryKey: "provider",
        title: "Languages",
        type: FilterType.multiselect,
        matcher: (filter, target) => !!target.provider?.includes(filter),
      },
      {
        placeholderText: "Filter by name...",
        categoryKey: "name",
        title: "Name",
        type: FilterType.search,
        matcher: (filter, target) =>
          !!target.name?.toLowerCase().includes(filter.toLowerCase()),
      },
    ],
  });

  const {
    filterState,
    currentPageItems: filteredTargets,
    propHelpers: { toolbarProps, filterToolbarProps },
  } = tableControls;

  const filteredTargetsInOrder = useMemo(() => {
    if (!targetOrderSetting.isSuccess) {
      return [];
    }

    return targetOrderSetting.data
      .map((id) => filteredTargets.find((target) => target.id === id))
      .filter(Boolean);
  }, [filteredTargets, targetOrderSetting.data, targetOrderSetting.isSuccess]);

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.customTargets")}</Text>
        </TextContent>
        <TextContent>
          <Text>{t("terms.customTargetsDetails")}</Text>
        </TextContent>
      </PageSection>

      <PageSection>
        <Toolbar
          {...toolbarProps}
          clearAllFilters={() => filterToolbarProps.setFilterValues({})}
        >
          <ToolbarContent>
            <FilterToolbar {...filterToolbarProps} breakpoint="md" />
            <ToolbarGroup variant="button-group">
              <ToolbarItem>
                <Button
                  id="create-target"
                  isInline
                  className={spacing.mlMd}
                  onClick={() => setCreateUpdateModalState("create")}
                >
                  Create new
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </PageSection>
      <PageSection style={{ paddingBlockStart: 0 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={targetOrderSetting.isSuccess ? targetOrderSetting.data : []}
            strategy={rectSortingStrategy}
          >
            <Gallery hasGutter minWidths={{ default: "20em" }}>
              {filteredTargetsInOrder.map((target) => (
                <SortableTargetItem
                  key={target.id}
                  target={target}
                  style={{ height: "410px" }}
                  onEdit={() => {
                    setCreateUpdateModalState(target);
                  }}
                  onDelete={() => {
                    // TODO: Add a delete confirmation modal.
                    deleteTarget(target.id);
                  }}
                />
              ))}
              <div ref={targetsEndRef} />
            </Gallery>
            <DragOverlay>
              {activeTarget ? <TargetItem target={activeTarget} /> : null}
            </DragOverlay>
          </SortableContext>
        </DndContext>
      </PageSection>

      <Modal
        id="create-edit-custom-target-modal"
        title={t(targetToUpdate ? "dialog.title.update" : "dialog.title.new", {
          what: `${t("terms.customTarget")}`,
        })}
        variant="medium"
        isOpen={isCreateUpdateModalOpen}
        onClose={() => setCreateUpdateModalState(null)}
      >
        <CustomTargetForm
          target={targetToUpdate}
          onSaved={onCustomTargetModalSaved}
          onCancel={() => setCreateUpdateModalState(null)}
        />
      </Modal>
    </>
  );
};
