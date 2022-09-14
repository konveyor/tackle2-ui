import { combineReducers } from "redux";
import { StateType } from "typesafe-actions";

import { confirmDialogStateKey, confirmDialogReducer } from "./confirmDialog";
import { bulkCopyStateKey, bulkCopyReducer } from "./bulkCopy";

export type RootState = StateType<typeof rootReducer>;

export const rootReducer = combineReducers({
  [confirmDialogStateKey]: confirmDialogReducer,
  [bulkCopyStateKey]: bulkCopyReducer,
});
