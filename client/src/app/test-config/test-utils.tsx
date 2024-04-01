import React, { FC, ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Application, Archetype, Assessment } from "@app/api/models";
import { RenderHookOptions, renderHook } from "@testing-library/react-hooks";

import { createContext, useContext } from "react";

const QueryClientContext = createContext<QueryClient | undefined>(undefined);

const AllTheProviders: FC<{
  children: React.ReactNode;
  queryClient?: QueryClient;
}> = ({ children, queryClient }) => {
  const internalQueryClient =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 1000,
        },
      },
    });
  return (
    <QueryClientProvider client={internalQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

export const useQueryClientContext = () => {
  const context = useContext(QueryClientContext);
  if (context === undefined) {
    throw new Error(
      "useQueryClientContext must be used within a QueryClientContext.Provider"
    );
  }
  return context;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

const customRenderHook = <TProps, TResult>(
  callback: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, "wrapper"> & {
    queryClient?: QueryClient;
  }
) => {
  const { queryClient, ...rest } = options || {};
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
  );

  return renderHook(callback, { wrapper: Wrapper as React.FC, ...rest });
};

export * from "@testing-library/react";

export { customRender as render };
export { customRenderHook as renderHook };

export const createMockAssessment = (
  overrides: Partial<Assessment> = {}
): Assessment => {
  return {
    id: Math.random(),
    name: "Default name",
    description: "Default description",
    required: true,
    ...overrides,
  } as Assessment;
};

export const createMockApplication = (overrides: Partial<Application> = {}) => {
  return {
    id: Math.random(),
    name: "Default name",
    description: "Default description",
    ...overrides,
  } as Application;
};

export const createMockArchetype = (overrides: Partial<Archetype> = {}) => {
  return {
    id: Math.random(),
    name: "Default name",
    description: "Default description",
    ...overrides,
  } as Archetype;
};
