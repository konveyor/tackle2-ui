import React from "react";

import {
  Application,
  BusinessService,
  Identity,
  IdentityKind,
  IssueManagerKind,
  JobFunction,
  Stakeholder,
  StakeholderGroup,
  TagCategory,
  TagRef,
} from "@app/api/models";
import { Color, OptionWithValue } from "@app/shared/components";

interface IModel {
  id?: string | number;
}

export const isIModelEqual = (a: IModel, b: IModel) => a.id === b.id;

// Business service dropdown

export interface IBusinessServiceDropdown
  extends Pick<BusinessService, "id" | "name"> {}

export const toIBusinessServiceDropdown = (
  value: BusinessService
): IBusinessServiceDropdown => ({
  id: value.id,
  name: value.name,
});

export const toIBusinessServiceDropdownOptionWithValue = (
  value: IBusinessServiceDropdown
): OptionWithValue<IBusinessServiceDropdown> => ({
  value,
  toString: () => value.name,
});

// Identity dropdown
export interface IdentityDropdown extends Pick<Identity, "id" | "name"> {}

export const toIdentityDropdown = (value: Identity): IdentityDropdown => ({
  id: value.id,
  name: value.name,
});

export const toIdentityDropdownOptionWithValue = (
  value: IdentityDropdown
): OptionWithValue<IdentityDropdown> => ({
  value,
  toString: () => value?.name || "",
});

// Stakeholder dropdown

export interface IStakeholderDropdown
  extends Pick<Stakeholder, "id" | "name" | "email"> {}

export const toIStakeholderDropdown = (
  value: Stakeholder | undefined
): IStakeholderDropdown => ({
  id: value?.id || 0,
  name: value?.name || "",
  email: value?.email || "",
});

export const toIStakeholderDropdownOptionWithValue = (
  value: IStakeholderDropdown
): OptionWithValue<IStakeholderDropdown> => ({
  value,
  toString: () => value.name,
  props: {
    description: value.email,
  },
});

// Stakeholder group dropdown

export interface IStakeholderGroupDropdown
  extends Pick<StakeholderGroup, "id" | "name"> {}

export const toIStakeholderGroupDropdown = (
  value: StakeholderGroup
): IStakeholderGroupDropdown => ({
  id: value.id,
  name: value.name,
});

export const toIStakeholderGroupDropdownOptionWithValue = (
  value: IStakeholderGroupDropdown
): OptionWithValue<IStakeholderGroupDropdown> => ({
  value,
  toString: () => value.name,
});

// Job function dropdown

export interface IJobFunctionDropdown
  extends Pick<JobFunction, "id" | "name"> {}

export const toIJobFunctionDropdown = (
  value: JobFunction
): IJobFunctionDropdown => ({
  id: value.id,
  name: value.name,
});

export const toIJobFunctionDropdownOptionWithValue = (
  value: IJobFunctionDropdown
): OptionWithValue<IJobFunctionDropdown> => ({
  value,
  toString: () => value.name,
});

// TagCategory

export interface ITagCategoryDropdown
  extends Pick<TagCategory, "id" | "name"> {}

export const toITagCategoryDropdown = (
  value: TagCategory
): ITagCategoryDropdown => ({
  id: value.id,
  name: value.name,
});

export const toITagCategoryDropdownOptionWithValue = (
  value: ITagCategoryDropdown
): OptionWithValue<ITagCategoryDropdown> => ({
  value,
  toString: () => value.name,
});

// Tag

export interface ITagDropdown extends Pick<TagRef, "id" | "name" | "source"> {}

export const toITagDropdown = (value: TagRef): ITagDropdown => ({
  id: value.id,
  name: value.name,
  source: value?.source || "",
});

export const toITagDropdownOptionWithValue = (
  value: ITagDropdown
): OptionWithValue<ITagDropdown> => ({
  value,
  toString: () => value.name,
});

// Colors

export const colorHexToOptionWithValue = (
  hex: string
): OptionWithValue<string> => ({
  value: hex,
  toString: () => hex,
  props: {
    children: <Color hex={hex} />,
  },
});

// Simple dropdown

export interface ISimpleOptionDropdown<T> {
  key: T;
  name: string;
}

export function toISimpleOptionDropdownWithValue<T>(
  value: ISimpleOptionDropdown<T>
): OptionWithValue<ISimpleOptionDropdown<T>> {
  return {
    value,
    toString: () => value.name,
  };
}

export const getKindIDByRef = (
  identities: Identity[],
  application: Application,
  kind: IdentityKind
) => {
  const matchingIdentity = identities.find((i) => {
    let matchingID;
    application?.identities?.forEach((appIdentity) => {
      if (appIdentity.id === i.id && i.kind === kind) {
        matchingID = appIdentity;
      }
    });
    return matchingID;
  });
  return matchingIdentity;
};

export const toOptionLike = (value: string, options: OptionWithValue[]) => {
  return options.find((option) => option.value === value);
};

export const IssueManagerOptions: OptionWithValue<IssueManagerKind>[] = [
  {
    value: "jira-cloud",
    toString: () => "Jira Cloud",
  },
  {
    value: "jira-server",
    toString: () => "Jira Server",
  },
  {
    value: "jira-datacenter",
    toString: () => "Jira Datacenter",
  },
];
