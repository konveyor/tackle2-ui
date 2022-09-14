import { useCallback, useReducer } from "react";
import { ActionType, createAction, getType } from "typesafe-actions";

const startCreate = createAction("useEntityModal/action/startCreate")();
const startUpdate = createAction("useEntityModal/action/startUpdate")<any>();
const startClose = createAction("useEntityModal/action/startClose")();

// State
type State = Readonly<{
  data: any;
  isOpen: boolean;
}>;

const defaultState: State = {
  data: undefined,
  isOpen: false,
};

// Reducer

type Action = ActionType<
  typeof startCreate | typeof startUpdate | typeof startClose
>;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case getType(startCreate):
      return {
        ...state,
        data: undefined,
        isOpen: true,
      };
    case getType(startUpdate):
      return {
        ...state,
        data: action.payload,
        isOpen: true,
      };
    case getType(startClose):
      return {
        ...state,
        data: undefined,
        isOpen: false,
      };
    default:
      return state;
  }
};

// Hook

interface HookState<T> {
  data?: T;
  isOpen: boolean;
  create: () => void;
  update: (data: T) => void;
  close: () => void;
}

export const useEntityModal = <T>(): HookState<T> => {
  const [state, dispatch] = useReducer(reducer, {
    ...defaultState,
  });

  const createHandler = useCallback(() => {
    dispatch(startCreate());
  }, []);

  const updateHandler = useCallback((entity: T) => {
    dispatch(startUpdate(entity));
  }, []);

  const closeHandler = useCallback(() => {
    dispatch(startClose());
  }, []);

  return {
    data: state.data,
    isOpen: state.isOpen,
    create: createHandler,
    update: updateHandler,
    close: closeHandler,
  };
};

export default useEntityModal;
