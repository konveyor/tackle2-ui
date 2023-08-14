import { type RestHandler } from "msw";

import questionnaires from "./questionnaires";

export default [...questionnaires] as RestHandler[];
