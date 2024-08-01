import { Risk } from "@app/api/models";

export type KeyWithValueType<T, V> = {
  [Key in keyof T]-?: T[Key] extends V ? Key : never;
}[keyof T];

export type DisallowCharacters<
  T extends string,
  TInvalidCharacter extends string,
> = T extends `${string}${TInvalidCharacter}${string}` ? never : T;

export type DiscriminatedArgs<TBoolDiscriminatorKey extends string, TArgs> =
  | ({ [key in TBoolDiscriminatorKey]: true } & TArgs)
  | { [key in TBoolDiscriminatorKey]?: false };

/**
 * Normalize an optional `Risk` or `string` input and return either the matching
 * `Risk` or the `defaultValue` (which defaults to `undefined`).
 */
export function normalizeRisk(
  risk?: Risk | string,
  defaultValue?: Risk
): Risk | undefined {
  let normal: Risk | undefined = defaultValue;

  switch (risk) {
    case "green":
      normal = "green";
      break;

    case "yellow":
      normal = "yellow";
      break;

    case "red":
      normal = "red";
      break;

    case "unassessed":
      normal = "unassessed";
      break;

    case "unknown":
      normal = "unknown";
      break;
  }

  return normal;
}
