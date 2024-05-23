import React from "react";
import { Tooltip } from "@patternfly/react-core";
import { getString } from "@app/utils/utils";
import { AutocompleteOptionProps } from "./Autocomplete/Autocomplete";

export const LabelToolip: React.FC<{
  content?: AutocompleteOptionProps["tooltip"];
  children: React.ReactElement;
}> = ({ content, children }) =>
  content ? (
    <Tooltip content={<div>{getString(content)}</div>}>{children}</Tooltip>
  ) : (
    children
  );
