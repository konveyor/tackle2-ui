import * as React from "react";

import {
  Application,
  BusinessService,
  IdRef,
  Identity,
  IdentityKind,
  IssueManagerKind,
  JobFunction,
  Ref,
  Stakeholder,
  StakeholderGroup,
  TagCategory,
  TagRef,
} from "@app/api/models";
import { Color } from "@app/components/Color";
import { OptionWithValue } from "@app/components/SimpleSelect";

interface IModel {
  id?: string | number;
}

export const isIModelEqual = (a: IModel, b: IModel) => a.id === b.id;

// Business service dropdown

export interface IBusinessServiceDropdown extends Pick<
  BusinessService,
  "id" | "name"
> {}

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

export interface IStakeholderDropdown extends Pick<
  Stakeholder,
  "id" | "name" | "email"
> {}

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

export interface IStakeholderGroupDropdown extends Pick<
  StakeholderGroup,
  "id" | "name"
> {}

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

export interface IJobFunctionDropdown extends Pick<
  JobFunction,
  "id" | "name"
> {}

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

export interface ITagCategoryDropdown extends Pick<
  TagCategory,
  "id" | "name"
> {}

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

export const getKindIdByRef = (
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

export const toOptionLike = <T,>(
  value: T | undefined | null,
  options: OptionWithValue<T>[]
) => {
  return value === null || value === undefined
    ? undefined
    : options.find((option) => option.value === value);
};

export const IssueManagerOptions: OptionWithValue<IssueManagerKind>[] = [
  {
    value: "jira-cloud",
    toString: () => "Jira Cloud",
  },
  {
    value: "jira-onprem",
    toString: () => "Jira Server/Datacenter",
  },
];

export const toIdRef = <RefLike extends IdRef>(
  source: RefLike | undefined
): IdRef | undefined => {
  if (!source || !source.id) return undefined;

  return { id: source.id };
};

/**
 * Convert any object that looks like a `Ref` into a `Ref`.  If the source object
 * is `undefined`, or doesn't look like a `Ref`, return `undefined`.
 */
export function toRef<RefLike extends Ref>(source: RefLike): Ref;
export function toRef<RefLike extends Ref>(
  source: RefLike | undefined
): Ref | undefined;
export function toRef<RefLike extends Ref>(
  source: RefLike | undefined
): Ref | undefined {
  return source?.id && source?.name
    ? { id: source.id, name: source.name }
    : undefined;
}

/**
 * Convert an iterable collection of `Ref`-like objects to a `Ref[]`.  Any items in the
 * collection that cannot be converted to a `Ref` will be filtered out.
 */
export function toRefs<RefLike extends Ref>(
  source: Iterable<RefLike>
): Array<Ref>;
export function toRefs<RefLike extends Ref>(
  source: Iterable<RefLike> | undefined
): Array<Ref> | undefined;
export function toRefs<RefLike extends Ref>(
  source: Iterable<RefLike> | undefined
): Array<Ref> | undefined {
  return !source ? undefined : [...source].map(toRef).filter(Boolean);
}

/**
 * Take an array of source items that look like a `Ref`, find the first one that matches
 * a given value, and return it as a `Ref`.  If no items match the value, or if the value
 * is `undefined` or `null`, then return `undefined`.
 *
 * @param items Array of source items whose first matching item will be returned as a `Ref`
 * @param itemMatchFn Function to extract data from each `item` that will be sent to `matchOperator`
 * @param matchValue The single value to match every item against
 * @param matchOperator Function to determine if `itemMatchFn` and `matchValue` match
 */
export const matchItemsToRef = <RefLike extends Ref, V>(
  items: Array<RefLike>,
  itemMatchFn: (item: RefLike) => V,
  matchValue: V | undefined | null,
  matchOperator?: (a: V, b: V) => boolean
): Ref | undefined =>
  !matchValue
    ? undefined
    : (matchItemsToRefs(items, itemMatchFn, [matchValue], matchOperator)?.[0] ??
      undefined);

/**
 * Take an array of source items that look like a `Ref`, find the item that matches one
 * of a given array of values, and return them all as a `Ref[]`.  Any values without a
 * match will be filtered out of the resulting `Ref[]`.  If the array of values is
 * `undefined` or `null`, then return `undefined`.
 *
 * @param items Array of source items whose first matching item will be returned as a `Ref`
 * @param itemMatchFn Function to extract data from each `item` that will be sent to `matchOperator`
 * @param matchValues The array of values to match every item against
 * @param matchOperator Function to determine if `itemMatchFn` and `matchValue` match
 */
export const matchItemsToRefs = <RefLike extends Ref, V>(
  items: Array<RefLike>,
  itemMatchFn: (item: RefLike) => V,
  matchValues: Array<V | undefined | null> | undefined | null,
  matchOperator: (a: V, b: V) => boolean = (a, b) => a === b
): Array<Ref> | undefined =>
  !matchValues
    ? undefined
    : matchValues
        .map((toMatch) =>
          !toMatch
            ? undefined
            : items.find((item) => matchOperator(itemMatchFn(item), toMatch))
        )
        .map<Ref | undefined>(toRef)
        .filter(Boolean);

/**
 * Convert an array of `Ref`-like objects to an array of items.  Any items in the
 * collection that cannot be converted to an item will be filtered out.  By default,
 * the items are matched by their `id` property.
 */
export const refsToItems = <I extends { id: number }, RefLike extends Ref>(
  items: Array<I>,
  refs: Array<RefLike> | undefined,
  matcher: (item: I, ref: RefLike) => boolean = (item, ref) =>
    item.id === ref.id
): Array<I> => {
  if (!refs) return [];
  return refs
    .map((ref) => items.find((item) => matcher(item, ref)))
    .filter(Boolean);
};
