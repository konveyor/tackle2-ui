/* eslint-disable import-x/export */
import { FC, ReactElement, ReactNode, createContext, useContext } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RenderHookOptions,
  RenderOptions,
  render,
  renderHook,
} from "@testing-library/react";

import { Application, Archetype, Assessment } from "@app/api/models";
import {
  INotification,
  NotificationsContext,
} from "@app/components/NotificationsContext";

const QueryClientContext = createContext<QueryClient | undefined>(undefined);

/** Default mock notification functions for testing */
export const createMockNotifications = () => ({
  pushNotification: jest.fn(),
  dismissNotification: jest.fn(),
  notifications: [] as INotification[],
});

const AllTheProviders: FC<{
  children: ReactNode;
  queryClient?: QueryClient;
  notifications?: ReturnType<typeof createMockNotifications>;
}> = ({ children, queryClient, notifications }) => {
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

  const notificationValue = notifications || createMockNotifications();

  return (
    <QueryClientProvider client={internalQueryClient}>
      <NotificationsContext.Provider value={notificationValue}>
        {children}
      </NotificationsContext.Provider>
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
    notifications?: ReturnType<typeof createMockNotifications>;
  }
) => {
  const { queryClient, notifications, ...rest } = options || {};
  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <AllTheProviders queryClient={queryClient} notifications={notifications}>
      {children}
    </AllTheProviders>
  );

  return renderHook(callback, { wrapper: Wrapper as FC, ...rest });
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
