import { type RestHandler } from "msw";

import archetypes from "./archetypes";

export default [
  // ...questionnaires,
  // ...assessments,
  // ...applications,
  ...archetypes,
] as RestHandler[];
