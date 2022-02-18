import { ActionType, getType } from "typesafe-actions";
import { addUnknownTagIdsToRegistry } from "./actions";

export const stateKey = "unknownTags";

export type UnknownTagsState = Readonly<{
  tagIds: Set<number>;
}>;

export const defaultState: UnknownTagsState = {
  tagIds: new Set(),
};

export type UnknownTagsAction = ActionType<typeof addUnknownTagIdsToRegistry>;

export const reducer = (
  state: UnknownTagsState = defaultState,
  action: UnknownTagsAction
): UnknownTagsState => {
  switch (action.type) {
    case getType(addUnknownTagIdsToRegistry):
      const newTagIds = new Set(state.tagIds);
      action.payload.forEach((e) => newTagIds.add(e));
      return {
        ...state,
        tagIds: newTagIds,
      };
    default:
      return state;
  }
};
