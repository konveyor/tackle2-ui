import React from "react";
import { IUseUrlParamsArgs, useUrlParams } from "./useUrlParams";
import { useLocalStorage, useSessionStorage } from "@migtools/lib-ui";

type UsePersistedStateOptions<
  T,
  TURLParamKey extends string,
  TKeyPrefix extends string,
> = {
  defaultValue: T;
} & (
  | {
      mode: null;
    }
  | ({
      mode: "url";
    } & IUseUrlParamsArgs<TURLParamKey, TKeyPrefix, T>)
  | {
      mode: "localStorage" | "sessionStorage";
      key: string;
    }
);

// TODO FIXME - Original problem: can't call hooks conditionally with eslint rules
//              (but we could do so if we make sure the conditional never changes between renders)
//              That's hacky though, what's better?
//              Calling all 4 hooks and only returning the stuff from the active one
//              isn't the most performant in theory but is fine in practice
//              The problem there is TypeScript. can't narrow the type of `options`
//              without a conditional, so we'd hit the same issue.
//              The workaround for that may be TS assertions?
//              But it's not safe to just assert that options in there are defined
//              because all 4 hooks always get called with whatever you pass.
//              So they all need an `isEnabled` option and they need to never
//              try to access other options if it's false.

export const usePersistedState = <
  T,
  TURLParamKey extends string,
  TKeyPrefix extends string,
>(
  options: UsePersistedStateOptions<T, TURLParamKey, TKeyPrefix>
): [T, (value: T) => void] => {
  const storage = {
    state: React.useState(options.defaultValue),
    url: useUrlParams(
      options as IUseUrlParamsArgs<TURLParamKey, TKeyPrefix, T> // TODO is this a bad idea?
    ), // TODO - add a disabled flag for the url param behavior?
    localStorage: useLocalStorage(options.key, options.defaultValue), // TODO - disabled flag for these too?
    sessionStorage: useSessionStorage(options.key, options.defaultValue), // TODO
  };
  if (!options.mode) return storage.state;
  return storage[options.mode];

  // TODO based on options, return only one of the above?
  // TODO make sure none of the disabled ones have any effect on URL or storage
};

// TODO combine all the use[Feature]State and use[Feature]UrlParams hooks
// TODO combine/rename useTableControlUrlParams into single useTableControlState hook with persistence options
// TODO bring in useSelectionState as a persistable thing
// TODO add JSdoc comments for all inputs and outputs
// TODO explore the state contract needed for using useTableControlProps with custom state logic
// TODO rename args to options in all types and code
// TODO rename active-row to active-item
// TODO decouple SimplePagination
// TODO decouple FilterToolbar?  -- can we make a toolbar-batteries hook? useFilterToolbar? option to hook it up to table batteries or not?
// TODO decouple useUrlParams from react-router? can we do everything from the document.location.search?
