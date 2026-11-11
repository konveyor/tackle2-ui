# tackle2-ui

[![Operator Repository on Quay](https://quay.io/repository/konveyor/tackle2-ui/status "Operator Repository on Quay")](https://quay.io/repository/konveyor/tackle2-ui) [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0.html) [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/konveyor/tackle2-ui/pulls)

## Overview

tackle2-ui is the web-based user interface for [Konveyor](https://konveyor.io), an open-source application modernization platform. It provides tools for assessing, analyzing, and migrating applications to Kubernetes. The UI is built with React and PatternFly, communicates with the [Konveyor Hub](https://github.com/konveyor/tackle2-hub) REST API, and is served by Caddy within the Konveyor operator deployment.

Key capabilities include application inventory management, assessment questionnaires, static code analysis, migration wave planning, dependency tracking, and issue/insight visualization.

# Build and Test Status

| branch       | last merge CI                                                                                                                                                                                                                                      | last merge image build                                                                                                                                                                                                                                                         | nightly CI                                                                                                                                                                                                                                   |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| main         | [![CI (repo level)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml/badge.svg?branch=main&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml?query=branch%3Amain+event%3Apush)                 | [![Multiple Architecture Image Build](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml/badge.svg?branch=main&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml?query=branch%3Amain+event%3Apush)                 | [![Nightly CI (repo level @main)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-main-ci-repo.yaml/badge.svg)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-main-ci-repo.yaml)                         |
| release-0.11 | [![CI (repo level)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml/badge.svg?branch=release-0.11&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml?query=branch%3Arelease-0.11+event%3Apush) | [![Multiple Architecture Image Build](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml/badge.svg?branch=release-0.11&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml?query=branch%3Arelease-0.11+event%3Apush) | [![Nightly CI (repo level @release-0.11)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-release-0.11-ci-repo.yaml/badge.svg)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-release-0.11-ci-repo.yaml) |
| release-0.10 | [![CI (repo level)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml/badge.svg?branch=release-0.10&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml?query=branch%3Arelease-0.10+event%3Apush) | [![Multiple Architecture Image Build](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml/badge.svg?branch=release-0.10&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml?query=branch%3Arelease-0.10+event%3Apush) | [![Nightly CI (repo level @release-0.10)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-release-0.10-ci-repo.yaml/badge.svg)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-release-0.10-ci-repo.yaml) |

| branch       | last merge e2e CI                                                                                                                                                                                                                                           | nightly e2e CI                                                                                                                                                                                                             |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| main         | [![CI (e2e tests)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-e2e-tests.yml/badge.svg?branch=main&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-e2e-tests.yml?query=branch%3Amain+event%3Apush)                 | [![Nightly e2e (@main)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-main-e2e.yaml/badge.svg)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-main-e2e.yaml)                         |
| release-0.11 | [![CI (e2e tests)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-e2e-tests.yml/badge.svg?branch=release-0.11&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-e2e-tests.yml?query=branch%3Arelease-0.11+event%3Apush) | [![Nightly e2e (@release-0.11)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-release-0.11-e2e.yaml/badge.svg)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-release-0.11-e2e.yaml) |
| release-0.10 | [![CI (e2e tests)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-e2e-tests.yml/badge.svg?branch=release-0.10&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-e2e-tests.yml?query=branch%3Arelease-0.10+event%3Apush) | [![Nightly e2e (@release-0.10)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-release-0.10-e2e.yaml/badge.svg)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-release-0.10-e2e.yaml) |

# Development

## Prerequisites

- [Node.js](https://nodejs.org/en/) >= 22 (see the `engines` block of [package.json](./package.json) for specifics)
- [Podman](https://podman.io/) for the local Caddy proxy; on macOS, start a Podman machine first
- [minikube](https://minikube.sigs.k8s.io/docs/start) (optional): setup your local minikube instance with your container manager of choice

## Quick start

### Clone the repository

To get started, clone the repo to your development workstation and install the required dependencies locally with NPM.

```sh
git clone https://github.com/konveyor/tackle2-ui
cd tackle2-ui
npm install
```

### Connect to or setup a Konveyor instance

- **Existing instance?** Make sure `kubectl` is configured to connect to the cluster where
  the existing operator is deployed.

- **New instance?** The process for setting up a Konveyor operator to run on a local Kubernetes
  cluster via minikube is detailed in the [local setup document](docs/local-minikube-setup.md).

### Run the development server

With an existing Konveyor environment available, and `kubectl` configured to use it, a local development server served tackle2-ui instance can be started with:

```sh
npm run start:dev
```

Your development server should start up and serve the locally running UI from:

```
http://localhost:9000
```

The agentic console is opt-in in both development and production. Use
`AGENTIC_ENABLED=true AGENTIC_STEER_ENABLED=true npm run start:dev` against a Hub
that serves the agentic API (see [Understanding the local development environment](#understanding-the-local-development-environment)).

## Konveyor environment setup

Summary of tasks to setup a local environment:

1. Setup an kubernetes instance with OLM to support the Konveyor operator
2. Install the Konveyor operator
3. Create the Konveyor CR
4. Run your [local dev server](#run-the-development-server)

The most common and the recommended environment is to [setup minikube and deploy
the operator](docs/local-minikube-setup.md) there.

A general guide for installing minikube and Konveyor is also available in the project
documentation [Installing Konveyor](https://konveyor.io/docs/konveyor/installation/).

For information to help install on any Kubernetes platform see the
[Konveyor operator](https://github.com/konveyor/operator).

## Understanding the local development environment

Konveyor runs in a Kubernetes compatible environment (e.g. Openshift, Kubernetes or minikube) and
is typically deployed with the [Konveyor Operator](https://github.com/konveyor/operator) (OLM).
Although the UI pod has access to Konveyor APIs from within the cluster, the UI can also be run outside
the cluster and access Konveyor APIs endpoints by proxy.

The React and Patternfly based UI is composed of web pages served by an http server with proxy capabilities.

- [Caddy](container/caddy/proxy-routes.caddy) serves the application and proxies
  `/hub` to the Hub API (stripping the prefix), `/oidc` unchanged, `/kai` to
  `/services/kai`, and `/llm-proxy` to the LLM proxy. WebSocket upgrades are supported.
  Legacy `/auth` proxying is enabled in development, or when `KEYCLOAK_SERVER_URL` is set.

- In **production**, Caddy serves static UI assets on **:8080** and injects the
  public configuration from `/.env` into `index.html` at request time. Both responses
  are uncached. [ClientEnv and defaults](client/src/env/types.ts) are mirrored by
  [the JSON template](container/caddy/env.json.tmpl); keep them synchronized.
  Only allowlisted public variables are exposed; unset or empty values use defaults.

- In **development**, [scripts/run-proxy.sh](scripts/run-proxy.sh) starts Caddy
  in Podman on **:9000**. Non-API traffic, including HMR and `/.env`, goes to the
  rspack dev server on **:9001**. The HTML plugin and `/.env` use the same configuration.
  `PORT` overrides Caddy's listener. Linux uses host networking; macOS publishes
  the port and maps localhost upstreams to `host.containers.internal`.

- `TACKLE_HUB_URL` selects the Hub upstream (local default `http://localhost:9002`);
  `KAI_LLM_PROXY_URL` defaults to `http://localhost:9003`, and `KEYCLOAK_SERVER_URL`
  defaults to `http://localhost:9004` in development. Upstream URLs must be origins
  (`http://host:port` or `https://host:port`), without a path or query.

- The production container requires `TACKLE_HUB_URL`. Unless `AUTH_REQUIRED=false`,
  it also requires `OIDC_ISSUER` and `OIDC_CLIENT_ID`. The Go entrypoint performs
  startup checks, combines public roots with optional Kubernetes service-account
  and operator-mounted custom ingress CAs, then execs Caddy. Missing optional CA
  files are skipped; other I/O errors fail startup. `SSL_CERT_FILE` can add trust;
  the local proxy instead mounts that host file (or the host's system bundle).
  `DEBUG=1` enables configuration logging; avoid credential-bearing upstream URLs.

- To serve a production build locally, use `npm start` (**:8080** by default).
  This builds `common` and `client`, then mounts `client/dist` into Caddy. To build
  the complete shell-less production image, use `podman build -t tackle2-ui .`.

- The agentic console (agent runs, agents, skills, workflows) is feature-flagged and off by
  default. The server passes two variables to the browser with the rest of the environment:
  - `AGENTIC_ENABLED` &rarr; `true` shows the console. It needs a Hub that serves the
    `/agentic/*` API with an agentic-controller behind it; against any other Hub leave it off.
  - `AGENTIC_STEER_ENABLED` &rarr; `true` additionally lets you send free-text instructions to a
    live run and stop its turn from the chat panel. Off keeps the panel read-only (the agent's
    own questions can still be answered).

  Both default to `false` in development and production. See
  [ARCHITECTURE.md](ARCHITECTURE.md#agentic-console) for what each flag gates.
  See [Agentic run parameters and supervision](docs/agentic-run-parameters.md)
  for parameter YAML examples, runtime delivery, and Approval mode safety.

### Running the UI outside the cluster

To enable running the UI outside the cluster, port forwarding must be activated to route
Konveyor Hub requests to the services on the cluster. Use the script `npm run port-forward`
to easily start the forwards. The script `npm run start:dev` will also setup port forwarding
to all Konveyor services concurrently with starting the dev server.

To manually setup the kubectl port forwards, open a terminal and run the following command:

```sh
$ kubectl port-forward svc/tackle-hub -n konveyor-tackle 9002:8080
```

**Note**: The `npm run port-forward` or `kubectl port-forward` commands need to remain running
for the ports to be available.

## Accessing the Minikube Kubernetes dashboard

We may need to access the dashboard, either simply to see what's happening under
the hood, or to troubleshoot an issue.

There are two ways to setup access to the dashboard:

1. We can use the `minikube dashboard` command. Use to following to open on an explicit
   port and only show the URL instead of opening the default browser directly:

   ```sh
   $ minikube dashboard --port=18080 --url=true
   ```

2. We can use the `kubectl port-forward` command to enable access to the dashboard:

   ```sh
   $ kubectl port-forward svc/kubernetes-dashboard -n kubernetes-dashboard 30090:80
   ```

   We can now access the minikube dashboard on `http://localhost:30090`

## Troubleshooting

Note - The steps described are executed on a Fedora 38 workstation, but will likely work on any recent Linux distribution.

- For minikube setups that rely on virtualization, the only prerequisites are to enable virtualization extensions in the BIOS/EFI of the machine, to install libvirt and to add our user to the libvirt group.

- Ensure that your minikube installation directory is available in your `$PATH` environment variable. This is usually `/usr/local/bin/` or something similar depending on your OS of choice.

- The following command gives us the IP address assigned to the node created by Minikube.
  It's used when interacting with tackle UI image installed on the minikube cluster.

```sh
$ minikube ip
192.168.39.23
```

## Pull Request (PR) Process

Please read the [Pull Request (PR) Process](https://github.com/konveyor/release-tools/blob/main/VERSIONING.md#pull-request-pr-process)
section of the [Konveyor versioning and branching doc](https://github.com/konveyor/release-tools/blob/main/VERSIONING.md)
for more information.

# Testing

## Unit Tests

Run the unit test suites across the monorepo with:

```sh
npm run test
```

For more details on unit testing, see [docs/tests.md](docs/tests.md).

## End-to-End (E2E) Tests

The project includes Cypress-based end-to-end tests that validate the UI against a running Konveyor instance.

**Quick start for running e2e tests against your local dev server:**

```sh
# 1. Establish your own `.env` and prepare to run
npm clean-install
cp -i cypress/.env.example cypress/.env

# 2. Start your local dev server (in one terminal)
npm run start:dev

# 3. Run tests against localhost:9000 (in another terminal)
cd cypress
npm run e2e:run:local
```

**Run tests against a different URL (run the prepare steps as above then):**

```sh
# Against minikube
npm run e2e:run:minikube

# Against any URL
npm run e2e:run:local -- --config baseUrl=https://your-konveyor-instance.example.com
```

For comprehensive e2e testing documentation, including environment setup, test tags,
CI integration, and QE workflows, see [cypress/README.md](cypress/README.md).

# Contributing

We welcome contributions to this project! If you're interested in contributing,
please read the [konveyor/community CONTRIBUTING doc](https://github.com/konveyor/community/blob/main/CONTRIBUTING.md)
for more information on how to get started.

# Code of Conduct

Refer to Konveyor's [Code of Conduct page](https://github.com/konveyor/community/blob/main/CODE_OF_CONDUCT.md)
