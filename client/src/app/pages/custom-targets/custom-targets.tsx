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

const numberOfColumns = 5;

const chunksize = (length: number) => {
  if (length % numberOfColumns > 0)
    return Math.round(length / numberOfColumns + 1);
  return Math.round(length / numberOfColumns);
};

const byChunks = (
  targets: ITransformationTargets[],
  size: number
): ITransformationTargets[][] => {
  const copyTargets = [...targets];
  let chunks: ITransformationTargets[][] = [];

  for (let i = 1; copyTargets.length > 0; i++) {
    const chunk = copyTargets.splice(0, size);
    chunks.push(chunk);
  }
  return chunks;
};

export const CustomTargets: React.FC = () => {
  const { t } = useTranslation();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const [targets, setTargets] = React.useState<ITransformationTargets[]>(
    transformationTargets
  );

  const [areas, setAreas] = React.useState<ITransformationTargets[][]>(
    byChunks(transformationTargets, chunksize(transformationTargets.length))
  );

  const onDrop = (src: IDroppable, dest?: IDroppable) => {
    const size = chunksize(areas.flat().length);
    if (dest) {
      const newFlatzones = areas.flat();
      const removed = newFlatzones.splice(
        +src.droppableId * size + src.index,
        1
      );

      let dstIndex: number = -1;

      if (src.droppableId === dest.droppableId) {
        newFlatzones.splice(
          +dest.droppableId * size + dest.index,
          0,
          ...removed
        );
      } else {
        newFlatzones.splice(
          +dest.droppableId * size + dest.index - 1,
          0,
          ...removed
        );
      }

      setAreas(byChunks(newFlatzones, size));
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
        <Gallery
          hasGutter
          minWidths={{
            default: "100%",
            md: "100px",
            xl: "300px",
          }}
          maxWidths={{
            md: "200px",
            xl: "1fr",
          }}
        >
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
