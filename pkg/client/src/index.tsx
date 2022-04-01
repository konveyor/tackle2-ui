import React from "react";
import ReactDOM from "react-dom";
import App from "@app/App";
import reportWebVitals from "@app/reportWebVitals";
import { Provider } from "react-redux";
import configureStore from "@app/store";
import i18n from "@app/i18n";
import { NinjaErrorBoundary } from "@app/ninja-error-boundary";

import { QueryClient, QueryClientProvider } from "react-query";
import { LocalStorageContextProvider } from "@app/context/LocalStorageContext";
import { KeycloakProvider } from "@app/common/KeycloakProvider";

import "./index.css";

i18n.init();
const queryClient = new QueryClient();

ReactDOM.render(
  <LocalStorageContextProvider>
    <KeycloakProvider>
      <Provider store={configureStore()}>
        <NinjaErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </NinjaErrorBoundary>
      </Provider>
    </KeycloakProvider>
  </LocalStorageContextProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
