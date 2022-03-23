import { useState } from "react";
import { useMutation, useQuery } from "react-query";

import { Task } from "@app/api/models";
import { getTasks, uploadFileTask } from "@app/api/rest";

export interface IFetchState {
  tasks: Task[];
  isFetching: boolean;
  fetchError: any;
}

export const useFetchTasks = (
  defaultIsFetching: boolean = false
): IFetchState => {
  const [tasks, setTasks] = useState<Array<Task>>([]);
  const { isLoading, data, error } = useQuery("tasks", () =>
    getTasks()
      .then((res) => res)
      .then(({ data }) => {
        let uniqLatestTasks: Task[] = [];
        data.forEach((task) => {
          const aTask = uniqLatestTasks.find(
            (item) => task.application.id === item.application.id
          );
          if (aTask && aTask.createTime && task.createTime > aTask.createTime) {
            const others = uniqLatestTasks.filter((t) => t.id !== aTask.id);
            uniqLatestTasks = [...others, task];
          } else uniqLatestTasks.push(task);
        });
        setTasks(uniqLatestTasks);
      })
      .catch((error) => {
        console.log("error, ", error);
      })
  );
  return {
    tasks: tasks,
    isFetching: isLoading,
    fetchError: error,
  };
};

export interface IMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}

export const useUploadFileMutation = (
  successCallback: any,
  errorCallback: any
): IMutateState => {
  const { isLoading, mutate, error } = useMutation(uploadFileTask, {
    onSuccess: (res) => {
      successCallback && successCallback(res);
    },
    onError: (err) => {
      errorCallback && errorCallback(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
