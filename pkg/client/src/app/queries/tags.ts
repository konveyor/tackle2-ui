import React from "react";
import { useQuery } from "react-query";

import { getTags } from "@app/api/rest";
import { Tag } from "@app/api/models";

export interface ITagFetchState {
  tags: Tag[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export const TagsQueryKey = "tags";

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
