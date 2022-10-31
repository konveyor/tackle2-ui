import React from "react";
import ReactDOM from "react-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import App from "@app/App";
import reportWebVitals from "@app/reportWebVitals";
import i18n from "@app/i18n";
import { NinjaErrorBoundary } from "@app/ninja-error-boundary";
import { KeycloakProvider } from "@app/common/KeycloakProvider";

const queryClient = new QueryClient();

ReactDOM.render(
  <KeycloakProvider>
    <NinjaErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </NinjaErrorBoundary>
  </KeycloakProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
