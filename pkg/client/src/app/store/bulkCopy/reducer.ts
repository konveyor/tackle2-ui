import { ActionType, getType } from "typesafe-actions";
import {
  scheduleWatchBulk,
  assessmentBulkCompleted,
  reviewBulkCompleted,
} from "./actions";

export const stateKey = "bulkCopy";

export type BulkCopyState = Readonly<{
  assessmentBulk?: number;
  reviewBulk?: number;

  assessmentBulkCompleted?: boolean;
  reviewBulkCompleted?: boolean;

  assessmentBulkError?: string;
  reviewBulkError?: string;

  watching: boolean;
}>;

export const defaultState: BulkCopyState = {
  watching: false,
};

export type BulkCopyAction = ActionType<
  | typeof scheduleWatchBulk
  | typeof assessmentBulkCompleted
  | typeof reviewBulkCompleted
>;

export const reducer = (
  state: BulkCopyState = defaultState,
  action: BulkCopyAction
): BulkCopyState => {
  switch (action.type) {
    case getType(scheduleWatchBulk):
      return {
        ...state,
        assessmentBulk: action.payload.assessmentBulk,
        assessmentBulkCompleted: false,
        assessmentBulkError: undefined,

        reviewBulk: action.payload.reviewBulk,
        reviewBulkCompleted: action.payload.reviewBulk ? false : undefined,
        reviewBulkError: undefined,

        watching: true,
      };
    case getType(assessmentBulkCompleted):
      return {
        ...state,
        assessmentBulkCompleted: true,
        assessmentBulkError: action.payload.error,

        watching: state.reviewBulk ? !state.reviewBulkCompleted : false,
      };
    case getType(reviewBulkCompleted):
      return {
        ...state,
        reviewBulkCompleted: true,
        reviewBulkError: action.payload.error,

        watching: !state.assessmentBulkCompleted,
      };
    default:
      return state;
  }
};
