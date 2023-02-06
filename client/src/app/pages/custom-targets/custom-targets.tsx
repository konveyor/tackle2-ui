import * as React from "react";
import {
  Button,
  DragDrop,
  Draggable,
  Droppable,
  Grid,
  GridItem,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Gallery,
  GalleryItem,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useTranslation } from "react-i18next";

// import { CustomTargetForm } from "./custom-target-form";
import {
  ITransformationTargets,
  transformationTargets,
} from "@app/data/targets";
import { TargetCard } from "@app/components/target-card";
import "./custom-targets.css";

interface IDroppable {
  droppableId: string;
  index: number;
}

const CHUNKSIZE = 4;

const byChunks = (
  targets: ITransformationTargets[],
  length: number = CHUNKSIZE
): ITransformationTargets[][] => {
  let object: ITransformationTargets[][] = [];
  for (let i = 1; i < length; i++) {
    object.push(targets.splice(0, length));
  }
  return object;
};

export const CustomTargets: React.FC = () => {
  const { t } = useTranslation();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const dragRef = React.useRef(null);

  const [targets, setTargets] = React.useState<ITransformationTargets[]>(
    transformationTargets
  );

  const [areas, setAreas] = React.useState<ITransformationTargets[][]>(
    byChunks(transformationTargets)
  );

  const onDrop = (src: IDroppable, dest?: IDroppable) => {
    if (dest) {
      const newFlatzones = areas.flat();
      const removed = newFlatzones.splice(
        +src.droppableId * CHUNKSIZE + src.index,
        1
      );
      newFlatzones.splice(
        +dest.droppableId * CHUNKSIZE + dest.index,
        0,
        ...removed
      );
      setAreas(byChunks(newFlatzones));
      return true;
    }
    return false;
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
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create new
            </Button>
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Gallery hasGutter>
          <DragDrop onDrop={(source, dest) => onDrop(source, dest)}>
            {areas.map((targets, zoneId) => (
              <GalleryItem key={zoneId}>
                <Droppable droppableId={`${zoneId}`}>
                  {targets.map((target, id) => (
                    <Draggable key={target.label} style={{ padding: ".5em" }}>
                      <TargetCard item={target} />
                    </Draggable>
                  ))}
                </Droppable>
              </GalleryItem>
            ))}
          </DragDrop>
        </Gallery>
      </PageSection>
    </>
  );
};
