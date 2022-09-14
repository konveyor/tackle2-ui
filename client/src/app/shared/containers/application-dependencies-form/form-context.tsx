import React, { useState } from "react";
import { AxiosError } from "axios";

interface IFormContext {
  isNorthBeingSaved: boolean;
  setIsNorthBeingSaved: (value: boolean) => void;

  northSaveError?: AxiosError;
  setNorthSaveError: (value?: AxiosError) => void;

  isSouthBeingSaved: boolean;
  setIsSouthBeingSaved: (value: boolean) => void;

  southSaveError?: AxiosError;
  setSouthSaveError: (value?: AxiosError) => void;
}

const defaultState: IFormContext = {
  isNorthBeingSaved: false,
  setIsNorthBeingSaved: () => {},

  northSaveError: undefined,
  setNorthSaveError: () => {},

  isSouthBeingSaved: false,
  setIsSouthBeingSaved: () => {},

  southSaveError: undefined,
  setSouthSaveError: () => {},
};

export const FormContext = React.createContext<IFormContext>(defaultState);

export const FormContextProvider: React.FC = ({ children }) => {
  const [isNorthBeingSaved, setIsNorthBeingSaved] = useState(false);
  const [isSouthBeingSaved, setIsSouthBeingSaved] = useState(false);

  const [northSaveError, setNorthSaveError] = useState<AxiosError>();
  const [southSaveError, setSouthSaveError] = useState<AxiosError>();

  return (
    <FormContext.Provider
      value={{
        isNorthBeingSaved,
        setIsNorthBeingSaved,

        isSouthBeingSaved,
        setIsSouthBeingSaved,

        northSaveError,
        setNorthSaveError,

        southSaveError,
        setSouthSaveError,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
