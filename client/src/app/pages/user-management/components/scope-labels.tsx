import { type FC } from "react";
import { Label, LabelGroup, LabelProps } from "@patternfly/react-core";

const verbToColor = (verb: string): LabelProps["color"] => {
  switch (verb.toUpperCase()) {
    case "GET":
      return "blue";
    case "POST":
      return "green";
    case "PUT":
      return "orange";
    case "DELETE":
      return "red";
    case "PATCH":
      return "purple";
    default:
      return "grey";
  }
};

const sortGetLast = (a: string, b: string) => {
  if (a.toUpperCase() === "GET") return 1;
  if (b.toUpperCase() === "GET") return -1;
  return a.toUpperCase().localeCompare(b.toUpperCase());
};

export const parseScopes = (scopes?: string) =>
  (scopes ?? "").split(" ").filter(Boolean);

export const groupScopes = (scopes: string[]) =>
  scopes
    .map((scope) => {
      const [resource, verb] = scope.split(":");
      return resource && verb ? [resource, verb] : [scope, ""];
    })
    .reduce(
      (acc, [resource, verb]) => {
        const group = acc.find((g) => g.resource === resource);
        if (group) {
          group.verbs.push(verb);
        } else {
          acc.push({ resource, verbs: [verb] });
        }
        return acc;
      },
      [] as { resource: string; verbs: string[] }[]
    );

export const ScopeLabels: FC<{
  group: { resource: string; verbs: string[] };
}> = ({ group }) => (
  <>
    <LabelGroup
      isVertical
      numLabels={group.verbs.length}
      categoryName={group.resource}
      isCompact
    >
      {group.verbs
        .filter(Boolean)
        .toSorted(sortGetLast)
        .map((verb) => (
          <Label key={verb} color={verbToColor(verb)} isCompact>
            {verb}
          </Label>
        ))}
    </LabelGroup>
  </>
);
