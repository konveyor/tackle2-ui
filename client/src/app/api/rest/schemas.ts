import axios from "axios";

import { Schema, TargetedSchema } from "../models";
import { hub, template } from "../rest";

const SCHEMAS = hub`/schemas`;
const TARGETED_SCHEMA = hub`/schemas/jsd/{{domain}}/{{variant}}/{{subject}}`;

export const getSchemas = () =>
  axios.get<Schema[]>(SCHEMAS).then(({ data }) => data);

export const getSchemaByName = (name: string) =>
  axios.get<Schema>(`${SCHEMAS}/${name}`).then(({ data }) => data);

export const getPlatformCoordinatesSchema = (platformKind: string) =>
  axios
    .get<TargetedSchema>(
      template(TARGETED_SCHEMA, {
        domain: "platform",
        variant: platformKind,
        subject: "coordinates",
      })
    )
    .then(({ data }) => data);

export const getPlatformDiscoveryFiltersSchema = (platformKind: string) =>
  axios
    .get<TargetedSchema>(
      template(TARGETED_SCHEMA, {
        domain: "platform",
        variant: platformKind,
        subject: "filters",
      })
    )
    .then(({ data }) => data);
