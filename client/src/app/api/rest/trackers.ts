import axios from "axios";

import {
  New,
  Tracker,
  TrackerProject,
  TrackerProjectIssuetype,
} from "../models";
import { hub } from "../rest";

const TRACKERS = hub`/trackers`;
const TRACKER_PROJECTS = "projects";
const TRACKER_PROJECT_ISSUETYPES = "issuetypes";

export const getTrackers = () =>
  axios.get<Tracker[]>(TRACKERS).then((response) => response.data);

export const createTracker = (obj: New<Tracker>) =>
  axios.post<Tracker>(TRACKERS, obj).then((response) => response.data);

export const updateTracker = (obj: Tracker) =>
  axios.put<void>(`${TRACKERS}/${obj.id}`, obj);

export const deleteTracker = (id: number) =>
  axios.delete<void>(`${TRACKERS}/${id}`);

export const getTrackerProjects = (id: number) =>
  axios
    .get<TrackerProject[]>(`${TRACKERS}/${id}/${TRACKER_PROJECTS}`)
    .then((response) => response.data);

export const getTrackerProjectIssuetypes = (
  trackerId: number,
  projectId: string
) =>
  axios
    .get<
      TrackerProjectIssuetype[]
    >(`${TRACKERS}/${trackerId}/${TRACKER_PROJECTS}/${projectId}/${TRACKER_PROJECT_ISSUETYPES}`)
    .then((response) => response.data);
