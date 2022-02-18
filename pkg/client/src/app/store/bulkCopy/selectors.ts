import { RootState } from "../rootReducer";
import { stateKey } from "./reducer";

export const bulkCopyState = (state: RootState) => state[stateKey];

export const isWatching = (state: RootState) => bulkCopyState(state).watching;
export const assessmentBulk = (state: RootState) =>
  bulkCopyState(state).assessmentBulk;
export const reviewBulk = (state: RootState) => bulkCopyState(state).reviewBulk;
