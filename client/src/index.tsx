import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import App from "@app/App";
import reportWebVitals from "@app/reportWebVitals";
import configureStore from "@app/store";
import { KeycloakProvider } from "@app/common/KeycloakProvider";

const queryClient = new QueryClient();

ReactDOM.render(
  <KeycloakProvider>
    <Provider store={configureStore()}>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  </KeycloakProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
