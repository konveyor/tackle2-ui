# tackle2-ui

[![Operator Repository on Quay](https://quay.io/repository/konveyor/tackle2-ui/status "Operator Repository on Quay")](https://quay.io/repository/konveyor/tackle2-ui) [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0.html) [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/konveyor/tackle2-ui/pulls)

Konveyor UI component

# Build and Test Status

| branch      | last merge CI                                                                                                                                                                                                                                    | last merge image build                                                                                                                                                                                                                                                       | nightly CI                                                                                                                                                                                                                                                                 |
| :---------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| main        | [![CI (repo level)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml/badge.svg?branch=main&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml?query=branch%3Amain+event%3Apush)               | [![Multiple Architecture Image Build](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml/badge.svg?branch=main&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml?query=branch%3Amain+event%3Apush)               | [![Nightly CI (repo level @main)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-ci-repo.yaml/badge.svg?branch=main&event=schedule)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-ci-repo.yaml?query=branch%3Amain+event%3Aschedule) |
| release-0.8 | [![CI (repo level)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml/badge.svg?branch=release-0.8&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml?query=branch%3Arelease-0.8+event%3Apush) | [![Multiple Architecture Image Build](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml/badge.svg?branch=release-0.8&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml?query=branch%3Arelease-0.8)              |
| release-0.7 | [![CI (repo level)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml/badge.svg?branch=release-0.7&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml?query=branch%3Arelease-0.7+event%3Apush) | [![Multiple Architecture Image Build](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml/badge.svg?branch=release-0.7&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml?query=branch%3Arelease-0.7+event%3Apush) |                                                                                                                                                                                                                                                                            |
| release-0.6 | [![CI (repo level)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml/badge.svg?branch=release-0.6&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-repo.yml?query=branch%3Arelease-0.6+event%3Apush) | [![Multiple Architecture Image Build](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml/badge.svg?branch=release-0.6&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/image-build.yaml?query=branch%3Arelease-0.6+event%3Apush) |                                                                                                                                                                                                                                                                            |

| branch      | last merge e2e CI                                                                                                                                                                                                                                            | nightly e2e CI                                                                                                                                                                                                                                                                         |
| :---------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| main        | [![CI (global konveyor CI)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-global.yml/badge.svg?branch=main&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-global.yml?query=branch%3Amain+event%3Apush)               | [![Nightly CI (global konveyor CI @main)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-ci-global.yaml/badge.svg?branch=main&event=schedule)](https://github.com/konveyor/tackle2-ui/actions/workflows/nightly-ci-global.yaml?query=branch%3Amain+event%3Aschedule) |
| release-0.8 | [![CI (global konveyor CI)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-global.yml/badge.svg?branch=release-0.8&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-global.yml?query=branch%3Arelease-0.8+event%3Apush) |                                                                                                                                                                                                                                                                                        |
| release-0.7 | [![CI (global konveyor CI)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-global.yml/badge.svg?branch=release-0.7&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-global.yml?query=branch%3Arelease-0.7+event%3Apush) |                                                                                                                                                                                                                                                                                        |
| release-0.6 | [![CI (global konveyor CI)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-global.yml/badge.svg?branch=release-0.6&event=push)](https://github.com/konveyor/tackle2-ui/actions/workflows/ci-global.yml?query=branch%3Arelease-0.6+event%3Apush) |                                                                                                                                                                                                                                                                                        |

# Development

## Prerequisites

- [Node.js](https://nodejs.org/en/) >= 20 (see the `engines` block of [package.json](./package.json) for specifics)
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

- The server component, an express based nodejs server, handles the application code, a proxy to
  the HUB backend via the `/hub` path, and a proxy to the Keycloak auth backend via the `/auth` path.

- In **production** mode, the application code is served as statically built UI assets. A small
  handler inserts relevant environment information on the root page. This configures how the UI
  runs in the browser. The server's listener port is configurable via environment variables and
  defaults to **:8080**.

- In **development** mode, the application code is proxied to the client's webpack-dev-server
  running on port **:9003**. The server's listener port is configurable via environment variables
  and defaults to **:9000**.

- The server proxies [server/src/proxies.js](server/src/proxies.js) use the environment
  variables `TACKLE_HUB_URL` and `SSO_SERVER_URL` to define the proxy endpoints:
  - `/hub` &rarr; `TACKLE_HUB_URL` defines the location of the HUB REST endpoint. If it
    is not defined, the URL `http://localhost:9002` is used by default.

  - `/auth` &rarr; `SSO_SERVER_URL` defines the location of the Keycloak (SSO) instance.
    If it is not defined, the URL `http://localhost:9001` is used by default.

### Running the UI outside the cluster

To enable running the UI outside the cluster, ports forwardings must be activated to route
the Konveyor Keycloak (SSO) and Konveyor Hub requests to the services on the cluster. Use
the script `npm run port-forward` to easily start the forwards. The script `npm run start:dev`
will also setup port forwarding to all Konveyor services concurrently with starting the dev server.

To manually setup the kubectl port forwards, open a terminal and run each following command separately:

```sh
$ kubectl port-forward svc/tackle-keycloak-sso -n konveyor-tackle 9001:8080
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
