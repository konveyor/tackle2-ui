import "@patternfly/react-core/dist/styles/base.css";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRoot } from "react-dom/client";

import App from "@app/App";
import { KeycloakProvider } from "@app/components/KeycloakProvider";
import ENV from "@app/env";

import "@app/dayjs";
import "@app/i18n";
import "@app/yup";
import "@app/code-editor";

const queryClient = new QueryClient();

const renderApp = () => {
  const container = document.getElementById("root");
  const root = createRoot(container!);
  root.render(
    <KeycloakProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </KeycloakProvider>
  );
};

if (ENV.NODE_ENV === "development") {
  import("./mocks/browser").then((browserMocks) => {
    if (browserMocks.config.enabled) {
      browserMocks.worker.start();
    }
    renderApp();
  });
} else {
  renderApp();
}
