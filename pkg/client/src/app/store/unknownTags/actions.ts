import { createAction } from "typesafe-actions";

export const addUnknownTagIdsToRegistry = createAction(
  "unknownTags/registry/add"
)<number[]>();
