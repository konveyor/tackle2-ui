import { useState } from "react";
import { AxiosError, AxiosPromise } from "axios";

export interface IArgs<T> {
  onDelete: (t: T) => AxiosPromise;
}

export interface IState<T> {
  isDeleting: boolean;
  requestDelete: (
    t: T,
    onSuccess: () => void,
    onError: (error: AxiosError) => void
  ) => void;
}

export const useDelete = <T>({ onDelete }: IArgs<T>): IState<T> => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteHandler = (
    t: T,
    onSuccess: () => void,
    onError: (error: AxiosError) => void
  ) => {
    setIsDeleting(true);
    onDelete(t)
      .then(() => {
        setIsDeleting(false);
        onSuccess();
      })
      .catch((error: AxiosError) => {
        setIsDeleting(false);
        onError(error);
      });
  };

  return {
    isDeleting,
    requestDelete: deleteHandler,
  };
};

export default useDelete;
