import { RootState } from "../rootReducer";
import { stateKey } from "./reducer";

export const unknownTagsState = (state: RootState) => state[stateKey];

export const unknownTagIds = (state: RootState) =>
  unknownTagsState(state).tagIds;
