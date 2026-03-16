import { type RestHandler } from "msw";

import { config } from "../config";

import applications from "./applications";
import archetypes from "./archetypes";
import assessments from "./assessments";
import questionnaires from "./questionnaires";

const enableMe = (me: string) =>
  config.stub === "*" ||
  (Array.isArray(config.stub) ? (config.stub as string[]).includes(me) : false);

/**
 * Return the stub-new-work handlers that are enabled by config.
 */
const enabledStubs: RestHandler[] = [
  ...(enableMe("applications") ? applications : []),
  ...(enableMe("archetypes") ? archetypes : []),
  ...(enableMe("assessments") ? assessments : []),
  ...(enableMe("questionnaires") ? questionnaires : []),
  ...(enableMe("applications") ? applications : []),
].filter(Boolean);

export default enabledStubs;
