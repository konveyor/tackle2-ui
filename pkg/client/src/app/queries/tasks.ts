import { useState } from "react";
import { useMutation, useQuery } from "react-query";

import { Task } from "@app/api/models";
import { deleteTask, getTasks, uploadFileTask } from "@app/api/rest";

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
      .then(({ data }) => {
        let uniqLatestTasks: Task[] = [];
        data.forEach((task) => {
          const aTask = uniqLatestTasks.find(
            (item) => task.application?.id === item.application?.id
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
  successCallback: (res: any) => void,
  errorCallback: (err: Error | null) => void
): IMutateState => {
  const { isLoading, mutate, error } = useMutation(uploadFileTask, {
    onSuccess: (res) => {
      successCallback && successCallback(res);
    },
    onError: (err: Error) => {
      errorCallback && errorCallback(error);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useDeleteTaskMutation = (
  onSuccess: () => void,
  onError: (err: Error | null) => void
): IMutateState => {
  const { mutate, isLoading, error } = useMutation(deleteTask, {
    onSuccess: () => {
      onSuccess && onSuccess();
    },
    onError: (err: Error) => {
      onError && onError(error);
    },
  });
  return { mutate, isLoading, error };
};
