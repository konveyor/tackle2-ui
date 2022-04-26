import React from 'react';

import {
  Application,
  BusinessService,
  Identity,
  JobFunction,
  Ref,
  Stakeholder,
  StakeholderGroup,
  Tag,
  TagType,
} from '@app/api/models';
import { Color, OptionWithValue } from '@app/shared/components';

interface IModel {
  id?: string | number;
}

export const isIModelEqual = (a: IModel, b: IModel) => a.id === b.id;

// Business service dropdown

export type IBusinessServiceDropdown = Pick<BusinessService, 'id' | 'name'>;

export const toIBusinessServiceDropdown = (value: BusinessService): IBusinessServiceDropdown => ({
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
export type IdentityDropdown = Pick<Identity, 'id' | 'name'>;

export const toIdentityDropdown = (value: Identity): IdentityDropdown => ({
  id: value.id,
  name: value.name,
});

export const toIdentityDropdownOptionWithValue = (
  value: IdentityDropdown
): OptionWithValue<IdentityDropdown> => ({
  value,
  toString: () => value?.name || '',
});

// Stakeholder dropdown

export type IStakeholderDropdown = Pick<Stakeholder, 'id' | 'name' | 'email'>;

export const toIStakeholderDropdown = (value: Stakeholder | undefined): IStakeholderDropdown => ({
  id: value?.id,
  name: value?.name || '',
  email: value?.email || '',
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

export type IStakeholderGroupDropdown = Pick<StakeholderGroup, 'id' | 'name'>;

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

export type IJobFunctionDropdown = Pick<JobFunction, 'id' | 'name'>;

export const toIJobFunctionDropdown = (value: JobFunction): IJobFunctionDropdown => ({
  id: value.id,
  name: value.name,
});

export const toIJobFunctionDropdownOptionWithValue = (
  value: IJobFunctionDropdown
): OptionWithValue<IJobFunctionDropdown> => ({
  value,
  toString: () => value.name,
});

// TagType

export type ITagTypeDropdown = Pick<TagType, 'id' | 'name'>;

export const toITagTypeDropdown = (value: TagType): ITagTypeDropdown => ({
  id: value.id,
  name: value.name,
});

export const toITagTypeDropdownOptionWithValue = (
  value: ITagTypeDropdown
): OptionWithValue<ITagTypeDropdown> => ({
  value,
  toString: () => value.name,
});

// Tag

export type ITagDropdown = Pick<Tag, 'id' | 'name' | 'tagType'>;

export const toITagDropdown = (value: Tag): ITagDropdown => ({
  id: value.id,
  name: value.name,
  tagType: value.tagType,
});

export const toITagDropdownOptionWithValue = (
  value: ITagDropdown
): OptionWithValue<ITagDropdown> => ({
  value,
  toString: () => value.name,
  props: {
    description: value.tagType ? value.tagType.name : '',
  },
});

// Colors

export const colorHexToOptionWithValue = (hex: string): OptionWithValue<string> => ({
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

export const getKindIDByRef = (identities: Identity[], application: Application, kind: string) => {
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
