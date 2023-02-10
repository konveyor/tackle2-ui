import React, { useState } from "react";
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
import { useFetchMigrationTargets } from "@app/queries/rulesets";
import { CustomTargetForm } from "./custom-target-form";

export const MigrationTargets: React.FC = () => {
  const { t } = useTranslation();

  const { migrationTargets } = useFetchMigrationTargets();

  const [activeId, setActiveId] = useState(null);

  const [targetIDs, setTargetIDs] = React.useState<string[]>(
    migrationTargets.map((target) => target.name)
  );

  const [isCustomTargetFormOpen, setIsCustomTargetFormOpen] =
    React.useState(false);

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTargetIDs((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
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
              onClick={() => setIsCustomTargetFormOpen(true)}
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
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={targetIDs} strategy={rectSortingStrategy}>
          <DndGrid columns={4}>
            {targetIDs.map((id) => (
              <SortableItem key={id} id={id} />
            ))}
          </DndGrid>
          <DragOverlay>{activeId ? <Item id={activeId} /> : null}</DragOverlay>
        </SortableContext>
      </DndContext>
      <CustomTargetForm
        isOpen={isCustomTargetFormOpen}
        onClose={() => setIsCustomTargetFormOpen(false)}
        onCancel={() => {
          setIsCustomTargetFormOpen(false);
        }}
        onSaved={() => {
          setIsCustomTargetFormOpen(false);
        }}
      />
    </>
  );
};
