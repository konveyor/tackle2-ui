import "@patternfly/react-core/dist/styles/base.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRoot } from "react-dom/client";

import App from "@app/App";
import { AuthProvider } from "@app/auth";

import "@app/dayjs";
import "@app/i18n";
import "@app/yup";
import "@app/code-editor";
import "@app/axios-auth";

const queryClient = new QueryClient();

const renderApp = () => {
  const container = document.getElementById("root");
  const root = createRoot(container!);
  root.render(
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AuthProvider>
  );
};

if (process.env.NODE_ENV === "development") {
  import("./mocks/browser").then((browserMocks) => {
    if (browserMocks.config.enabled) {
      browserMocks.worker.start();
    }
    renderApp();
  });
} else {
  renderApp();
}
