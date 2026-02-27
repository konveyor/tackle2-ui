import { extend } from "dayjs";
import { default as customParseFormat } from "dayjs/plugin/customParseFormat";
import { default as isSameOrBefore } from "dayjs/plugin/isSameOrBefore";
import { default as localizedFormat } from "dayjs/plugin/localizedFormat";
import { default as relativeTime } from "dayjs/plugin/relativeTime";
import { default as timezone } from "dayjs/plugin/timezone";
import { default as utc } from "dayjs/plugin/utc";

extend(utc);
extend(timezone);
extend(customParseFormat);
extend(isSameOrBefore);
extend(relativeTime);
extend(localizedFormat);
