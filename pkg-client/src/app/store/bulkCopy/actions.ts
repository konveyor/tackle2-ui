import { createAction } from "typesafe-actions";

interface WatchBulk {
  assessmentBulk: number;
  reviewBulk?: number;
}

interface BulkCompleted {
  error?: string;
}

export const scheduleWatchBulk = createAction(
  "bulkCopy/watch/schedule"
)<WatchBulk>();
export const assessmentBulkCompleted = createAction(
  "bulkCopy/watch/assessmentCompleted"
)<BulkCompleted>();
export const reviewBulkCompleted = createAction(
  "bulkCopy/watch/reviewCompleted"
)<BulkCompleted>();
