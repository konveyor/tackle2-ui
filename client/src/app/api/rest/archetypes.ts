import axios from "axios";

import { Archetype, New } from "../models";
import { hub } from "../rest";

const ARCHETYPES = hub`/archetypes`;

export const getArchetypes = (): Promise<Archetype[]> =>
  axios.get(ARCHETYPES).then(({ data }) => data);

export const getArchetypeById = (id: number | string): Promise<Archetype> =>
  axios.get(`${ARCHETYPES}/${id}`).then(({ data }) => data);

// success with code 201 and created entity as response data
export const createArchetype = (archetype: New<Archetype>) =>
  axios.post<Archetype>(ARCHETYPES, archetype).then((res) => res.data);

// success with code 204 and therefore no response content
export const updateArchetype = (archetype: Archetype): Promise<void> =>
  axios.put(`${ARCHETYPES}/${archetype.id}`, archetype);

// success with code 204 and therefore no response content
export const deleteArchetype = (id: number): Promise<void> =>
  axios.delete(`${ARCHETYPES}/${id}`);
