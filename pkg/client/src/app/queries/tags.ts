import React from "react";
import { useQuery } from "react-query";

import { getTags, getTagTypes } from "@app/api/rest";
import { Tag, TagType } from "@app/api/models";

export interface ITagFetchState {
  tags: Tag[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export interface ITagTypeFetchState {
  tagTypes: TagType[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export const TagsQueryKey = "tags";
export const TagTypesQueryKey = "tagtypes";

export const useFetchTags = (): ITagFetchState => {
  const [tags, setTags] = React.useState<Tag[]>([]);
  const { isLoading, error, refetch } = useQuery(TagsQueryKey, () =>
    getTags()
      .then(({ data }) => {
        setTags(data);
        return data;
      })
      .catch((error) => {
        console.log("error, ", error);
        return error;
      })
  );
  return {
    tags,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchTagTypes = (): ITagTypeFetchState => {
  const [tagTypes, setTagTypes] = React.useState<TagType[]>([]);
  const { isLoading, error, refetch } = useQuery(TagTypesQueryKey, () =>
    getTagTypes()
      .then(({ data }) => {
        setTagTypes(data);
        return data;
      })
      .catch((error) => {
        console.log("error, ", error);
        return error;
      })
  );
  return {
    tagTypes,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
