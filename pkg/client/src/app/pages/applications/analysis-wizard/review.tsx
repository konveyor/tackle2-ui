import * as React from "react";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  List,
  ListItem,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";
import { UseFormGetValues } from "react-hook-form";

import { IFormValues } from "./analysis-wizard";
import { Application } from "@app/api/models";

interface IReview {
  applications: Application[];
  getValues: UseFormGetValues<IFormValues>;
}

export const Review: React.FunctionComponent<IReview> = ({
  applications,
  getValues,
}) => {
  const {
    mode,
    targets,
    withKnown,
    includedPackages,
    excludedPackages,
    customRulesFiles,
  } = getValues();
  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          Review analysis details
        </Title>
        <Text>Review the information below, then run the analysis.</Text>
      </TextContent>
      <DescriptionList isHorizontal>
        <DescriptionListGroup>
          <DescriptionListTerm>Applications</DescriptionListTerm>
          <DescriptionListDescription id="applications">
            <List isPlain>
              {applications.map((app) => (
                <ListItem key={app.id}>{app.name}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Mode</DescriptionListTerm>
          <DescriptionListDescription id="mode">
            {mode}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {targets.length > 1 ? "Targets" : "Target"}
          </DescriptionListTerm>
          <DescriptionListDescription id="targets">
            <List isPlain>
              {targets.map((target, index) => (
                <ListItem key={index}>{target}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Scope</DescriptionListTerm>
          <DescriptionListDescription id="scope">
            {withKnown}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Included packages</DescriptionListTerm>
          <DescriptionListDescription id="included-packages">
            <List isPlain>
              {includedPackages.map((pkg, index) => (
                <ListItem key={index}>{pkg}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Excluded packages</DescriptionListTerm>
          <DescriptionListDescription id="excluded-packages">
            <List isPlain>
              {excludedPackages.map((pkg, index) => (
                <ListItem key={index}>{pkg}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Custom rules</DescriptionListTerm>
          <DescriptionListDescription id="rules">
            <List isPlain>
              {customRulesFiles.map((rule, index) => (
                <ListItem key={index}>{rule.fileName}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Advanced options</DescriptionListTerm>
          <DescriptionListDescription id="options">
            {"Todo"}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </>
  );
};
