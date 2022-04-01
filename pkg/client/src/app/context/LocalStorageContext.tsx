import * as React from "react";

// TODO this is a candidate for reuse in a common components repo!
// TODO we'd have to parameterize the LocalStorageKey types, not sure how that would carry down to the consumer

enum LocalStorageKey {
  currentUser = "currentUser",
  parsedToken = "parsedToken",
}

type LocalStorageValues = { [key in LocalStorageKey]?: string };
interface ILocalStorageContext {
  storageValues: LocalStorageValues;
  setStorageValues: (newValues: LocalStorageValues) => void;
}

const LocalStorageContext = React.createContext<ILocalStorageContext>({
  storageValues: {},
  setStorageValues: () => {
    console.error(
      "setStorageValues was called without a LocalStorageContextProvider in the tree"
    );
  },
});

interface ILocalStorageContextProviderProps {
  children: React.ReactNode;
}

const getLocalStorageValues = () =>
  Object.keys(LocalStorageKey).reduce((values, key) => {
    return { ...values, [key]: window.localStorage.getItem(key) };
  }, {});

const LocalStorageContextProvider: React.FunctionComponent<
  ILocalStorageContextProviderProps
> = ({ children }: ILocalStorageContextProviderProps) => {
  const [values, setValues] = React.useState<LocalStorageValues>(
    getLocalStorageValues()
  );

  const setStorageValues = (newValues: any) => {
    try {
      Object.keys(newValues).forEach((key) => {
        if (key) {
          window.localStorage.setItem(key, newValues[key]);
        }
      });
      setValues({ ...values, ...newValues });
    } catch (error) {
      console.error("Failed to update local storage", { newValues, error });
    }
  };

  const updateFromStorage = () => {
    setValues(getLocalStorageValues());
  };
  React.useEffect(() => {
    window.addEventListener("storage", updateFromStorage);
    return () => {
      window.removeEventListener("storage", updateFromStorage);
    };
  }, []);

  return (
    <LocalStorageContext.Provider
      value={{ storageValues: values, setStorageValues }}
    >
      {children}
    </LocalStorageContext.Provider>
  );
};

const useLocalStorageContext = (
  key: LocalStorageKey
): [string | undefined, (value: string) => void] => {
  const { storageValues, setStorageValues } =
    React.useContext(LocalStorageContext);
  const value = storageValues[key];
  const setValue = (value: string) => setStorageValues({ [key]: value });
  return [value, setValue];
};

export {
  LocalStorageKey,
  LocalStorageContext,
  LocalStorageContextProvider,
  useLocalStorageContext,
};
export type { LocalStorageValues };
