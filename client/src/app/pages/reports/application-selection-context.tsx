import React, { useEffect, useState } from "react";
import {
  useSelectionState,
  ISelectionState,
} from "@app/hooks/useSelectionState";
import { Application } from "@app/api/models";

interface IApplicationSelectionContext extends ISelectionState<Application> {
  allItems: Application[];
}

const defaultState: IApplicationSelectionContext = {
  allItems: [],

  areAllSelected: false,
  selectedItems: [],
  isItemSelected: () => false,
  selectAll: () => {},
  selectOnly: () => {},
  selectItems: () => {},
};

export const ApplicationSelectionContext =
  React.createContext<IApplicationSelectionContext>(defaultState);

// Component

export interface IApplicationSelectionContextProviderProps {
  applications: Application[];
}

export const ApplicationSelectionContextProvider: React.FC<
  IApplicationSelectionContextProviderProps
> = ({ applications, children }) => {
  const [allItems, setAllItems] = useState<Application[]>([]);
  useEffect(() => {
    setAllItems([...applications]);
  }, [applications]);

  const selectionState = useSelectionState<Application>({
    items: applications,
    initialSelected: applications,
    isEqual: (a, b) => a.id === b.id,
  });

  return (
    <ApplicationSelectionContext.Provider
      value={{ allItems, ...selectionState }}
    >
      {children}
    </ApplicationSelectionContext.Provider>
  );
};
