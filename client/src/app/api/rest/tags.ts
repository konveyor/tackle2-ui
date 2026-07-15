import axios from "axios";

import { New, Tag, TagCategory } from "../models";
import { hub } from "../rest";

const TAGS = hub`/tags`;
const TAG_CATEGORIES = hub`/tagcategories`;

export const getTags = (): Promise<Tag[]> =>
  axios.get(TAGS).then((response) => response.data);

export const getTagById = (id: number | string): Promise<Tag> =>
  axios.get(`${TAGS}/${id}`).then((response) => response.data);

export const createTag = (obj: New<Tag>): Promise<Tag> => axios.post(TAGS, obj);

export const deleteTag = (id: number): Promise<Tag> =>
  axios.delete(`${TAGS}/${id}`);

export const updateTag = (obj: Tag): Promise<Tag> =>
  axios.put(`${TAGS}/${obj.id}`, obj);

export const getTagCategories = (): Promise<Array<TagCategory>> =>
  axios.get(TAG_CATEGORIES).then((response) => response.data);

export const getTagCategoryById = (id: number): Promise<TagCategory> =>
  axios.get(`${TAG_CATEGORIES}/${id}`).then((response) => response.data);

export const deleteTagCategory = (id: number): Promise<TagCategory> =>
  axios.delete(`${TAG_CATEGORIES}/${id}`);

export const createTagCategory = (
  obj: New<TagCategory>
): Promise<TagCategory> => axios.post(TAG_CATEGORIES, obj);

export const updateTagCategory = (obj: TagCategory): Promise<TagCategory> =>
  axios.put(`${TAG_CATEGORIES}/${obj.id}`, obj);
