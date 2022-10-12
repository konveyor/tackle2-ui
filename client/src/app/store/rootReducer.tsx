import { combineReducers } from "redux";
import { StateType } from "typesafe-actions";

import { bulkCopyStateKey, bulkCopyReducer } from "./bulkCopy";

export type RootState = StateType<typeof rootReducer>;

export const rootReducer = combineReducers({
  [bulkCopyStateKey]: bulkCopyReducer,
});
