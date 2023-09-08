import { type RestHandler } from "msw";

import questionnaires from "./questionnaires";
import assessments from "./assessments";
import applications from "./applications";
import archetypes from "./archetypes";

export default [
  // ...questionnaires,
  // ...assessments,
  // ...applications,
  // ...archetypes,
] as RestHandler[];
