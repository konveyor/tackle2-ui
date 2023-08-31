import { type RestHandler } from "msw";

import questionnaires from "./questionnaires";
import assessments from "./assessments";
import applications from "./applications";

export default [
  ...questionnaires,
  ...assessments,
  ...applications,
] as RestHandler[];
