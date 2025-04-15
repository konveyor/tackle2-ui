import { type RestHandler, rest } from "msw";

import * as AppRest from "@app/api/rest";
import type { Archetype, Tag, TagCategory } from "@app/api/models";

/**
 * Simple stub handlers as place holders until hub API is ready.
 *
 * Handler structure modeled after hub api handler:
 *   https://github.com/konveyor/tackle2-hub/blob/main/api/tag.go
 */
const handlers: RestHandler[] = [
  rest.get(AppRest.ARCHETYPES, (req, res, ctx) => {
    console.log(
      "%c stub %c → %s",
      "font-weight: bold; color: blue; background-color: white;",
      "font-weight: normal; color: auto; background-color: auto;",
      `get the list of archetypes`
    );

    const dataAsList = Array.from(Object.values(data));
    return res(ctx.json(dataAsList));
  }),

  rest.get(`${AppRest.ARCHETYPES}/:id`, async (req, res, ctx) => {
    const { id } = req.params;

    console.log(
      "%c stub %c → %s",
      "font-weight: bold; color: blue; background-color: white;",
      "font-weight: normal; color: auto; background-color: auto;",
      `get archetype ${id}`
    );

    const id_ = Array.isArray(id) ? id[0] : id;
    if (id_ in data) {
      return res(ctx.json(data[id_]));
    }
    return res(ctx.status(404));
  }),

  rest.post(AppRest.ARCHETYPES, async (req, res, ctx) => {
    const create = await req.json();

    console.log(
      "%c stub %c → %s",
      "font-weight: bold; color: blue; background-color: white;",
      "font-weight: normal; color: auto; background-color: auto;",
      `create archetype →`,
      create
    );

    const lastId = Math.max(...Object.keys(data).map((k) => +k));
    create.id = lastId + 1;
    data[create.id] = create;
    return res(ctx.status(201), ctx.json(create));
  }),

  rest.put(`${AppRest.ARCHETYPES}/:id`, async (req, res, ctx) => {
    const { id } = req.params;
    const update = await req.json();

    console.log(
      "%c stub %c → %s",
      "font-weight: bold; color: blue; background-color: white;",
      "font-weight: normal; color: auto; background-color: auto;",
      `update archetype ${id} →`,
      update
    );

    const id_ = Array.isArray(id) ? id[0] : id;
    if (id_ in data) {
      data[id_] = update;
      return res(ctx.status(204));
    }
    return res(ctx.status(404));
  }),

  rest.delete(`${AppRest.ARCHETYPES}/:id`, (req, res, ctx) => {
    const { id } = req.params;
    console.log(
      "%c✏️ archetype stub%c 🤖 %s",
      "font-weight: bold; color: blue; background-color: white;",
      "font-weight: normal; color: auto; background-color: auto;",
      `delete archetype ${id}`
    );

    const id_ = Array.isArray(id) ? id[0] : id;
    if (id_ in data) {
      delete data[id_];
      return res(ctx.status(204));
    }
    return res(ctx.status(404));
  }),
];

const tagCategoryData: Record<string, Omit<TagCategory, "tags">> = {
  A: {
    id: 1,
    name: "Category Alpha",
    colour: "#112233",
  },
  2: {
    id: 2,
    name: "Category Bravo",
    colour: "#113322",
  },
  3: {
    id: 3,
    name: "Category Charlie",
    colour: "#331122",
  },
  4: {
    id: 4,
    name: "Category Delta",
    colour: "#332211",
  },
};

const tagData: Record<string, Tag> = {
  1: { id: 1, name: "Alpha 1", category: tagCategoryData["1"] },
  2: { id: 2, name: "Alpha 2", category: tagCategoryData["1"] },
  3: { id: 3, name: "Bravo 1", category: tagCategoryData["2"] },

  81: { id: 81, name: "Charlie 1", category: tagCategoryData["3"] },
  82: { id: 82, name: "Delta 1", category: tagCategoryData["4"] },
  83: { id: 83, name: "Delta 2", category: tagCategoryData["4"] },
};

/**
 * The archetype stub/mock data.
 */
const data: Record<number, Archetype> = {
  1: {
    id: 1,
    name: "Wayne",
    description: "Wayne does the bare minimum",
    comments: "This one needs coffee",
    criteria: [tagData["1"]],
    tags: [tagData["81"]],
    stakeholders: [],
    stakeholderGroups: [],
    assessed: false,
  },

  2: {
    id: 2,
    name: "Garth",
    description: "Garth has some extra tags",
    comments: "This one needs tea",
    criteria: [tagData["2"]],
    tags: [tagData["81"], tagData["82"]],
    stakeholders: [],
    stakeholderGroups: [],
    assessed: false,
  },

  3: {
    id: 3,
    name: "Cassandra",
    description: "Cassandra is the most complex",
    comments: "This one needs cakes",
    criteria: [tagData["3"]],
    tags: [tagData["81"], tagData["82"], tagData["83"]],
    stakeholders: [],
    stakeholderGroups: [],
    // assessments: [{ id: 1, name: "test" }],
    assessments: [],
    assessed: false,
  },
};

export default handlers;
