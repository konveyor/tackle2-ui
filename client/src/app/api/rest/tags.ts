import axios from "axios";

import { New, Tag, TagCategory } from "../models";
import { hub } from "../rest";

const TAGS = hub`/tags`;
const TAG_CATEGORIES = hub`/tagcategories`;

export const getTags = () =>
  axios.get<Tag[]>(TAGS).then((response) => response.data);

export const getTagById = (id: number | string) =>
  axios.get<Tag>(`${TAGS}/${id}`).then((response) => response.data);

export const createTag = (obj: New<Tag>) =>
  axios.post<Tag>(TAGS, obj).then((response) => response.data);

export const updateTag = (obj: Tag) =>
  axios.put<void>(`${TAGS}/${obj.id}`, obj);

export const deleteTag = (id: number) => axios.delete<void>(`${TAGS}/${id}`);

export const getTagCategories = () =>
  axios.get<TagCategory[]>(TAG_CATEGORIES).then((response) => response.data);

export const getTagCategoryById = (id: number) =>
  axios
    .get<TagCategory>(`${TAG_CATEGORIES}/${id}`)
    .then((response) => response.data);

export const createTagCategory = (obj: New<TagCategory>) =>
  axios
    .post<TagCategory>(TAG_CATEGORIES, obj)
    .then((response) => response.data);

export const updateTagCategory = (obj: TagCategory) =>
  axios.put<void>(`${TAG_CATEGORIES}/${obj.id}`, obj);

export const deleteTagCategory = (id: number) =>
  axios.delete<void>(`${TAG_CATEGORIES}/${id}`);
