# tackle2-ui

[![Operator Repository on Quay](https://quay.io/repository/konveyor/tackle2-ui/status "Operator Repository on Quay")](https://quay.io/repository/konveyor/tackle2-ui) [![License](http://img.shields.io/:license-apache-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0.html) [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/konveyor/tackle2-ui/pulls)

Tackle (2nd generation) UI component.

To install a Tackle2 cluster environment, refer to [Tackle documentation](https://github.com/konveyor/tackle).

# Development

## Prerequisites

- [NodeJS](https://nodejs.org/en/) >= 16.x
- [minikube](https://minikube.sigs.k8s.io/docs/start) (optional): setup your local minikube instance with your container manager of choice. (Docker, Hyperkit, Hyper-V, KVM, Parallels, Podman, VirtualBox, or VMware Fusion/Workstation.)

## Installation

To get started, clone the repo to your development workstation and install the required dependencies locally with NPM.

```sh
git clone https://github.com/konveyor/tackle2-ui
cd tackle2-ui
npm install
```

## Quick start

With an existing Tackle2 environment available, one can start a locally served tackle2-ui instance with:

```sh
npm run start:dev
```

## Tackle2 environment setup

With the UI project setup out of the way, you can now begin setting up you local Tackle2 dev environment. The preferred local development option is to setup a minikube instance.
Alternatively, for information on general Kubernetes installation refer to [Tackle2 operator readme](https://github.com/konveyor/tackle2-operator#readme) file.

### Minikube setup

[Minikube](https://github.com/kubernetes/minikube) implements a local Kubernetes cluster on macOS, Linux, and Windows. See the minikube getting started guide [here.](https://minikube.sigs.k8s.io/docs/start/)

All you need to run minikube is [Docker](https://docs.docker.com/engine/install/) (or similarly compatible) container or a Virtual Machine environment.

By default, Minikube uses a [driver](https://minikube.sigs.k8s.io/docs/drivers/) with 6,000 MB of memory and 2 CPUs. This is not enough to run all the services, so we need to increase the allocated memory. In our experience, 10 GB of memory and 4 CPUs is fine:

```sh
$ minikube config set memory 10240
$ minikube config set cpus 4
```

Note: Depending on your driver, administrator access may be required. Common choices include Docker for container-based virtualization and KVM for hardware-assisted virtualization on Linux systems. If you're not sure which driver is best for you or if you're encountering compatibility issues, Minikube also supports auto-selecting a driver based on your system's capabilities and installed software.

From a terminal run:

```sh
$ minikube start --addons=dashboard --addons=ingress
```

Note: We need to enable the dashboard and ingress addons. The dashboard addon installs the dashboard service that exposes the Kubernetes objects in a user interface. The ingress addon allows us to create Ingress CRs to expose the Tackle UI and Tackle Hub API.

Since the olm addon is disabled until OLM issue [2534](https://github.com/operator-framework/operator-lifecycle-manager/issues/2534) is resolved we need to install the [OLM manually](https://github.com/operator-framework/operator-lifecycle-manager/releases) i.e. for version `v0.27.0` we can use:

```sh
curl -L https://github.com/operator-framework/operator-lifecycle-manager/releases/download/v0.27.0/install.sh -o install.sh
chmod +x install.sh
./install.sh v0.27.0
```

See also official Konveyor instructions for [Provisioning Minikube](https://konveyor.github.io/konveyor/installation/#provisioning-minikube).

### Configuring kubectl for minikube

You will need `kubectl` on your PATH and configured to control minikube in order to proceed. There are two ways to set this up:

1. **Install kubectl yourself**

   If you already [have the `kubectl` CLI tool installed](https://kubernetes.io/docs/tasks/tools/#kubectl) and available on your PATH, the `minikube start` command should configure it to control the minikube cluster. You should see the following message when minikube starts if this worked correctly:

   ```
   🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
   ```

2. **Use a shell alias for minikube's built-in kubectl**

   Minikube provides its own internal `kubectl` which you can use by running `minikube kubectl --` followed by your CLI arguments. If you want to use the built-in `minikube kubectl` as the `kubectl` on your PATH, you can set a shell alias. The following example shows how to do it for Bash on Fedora 35.

   ```sh
   $ mkdir -p ~/.bashrc.d
   $ cat << EOF > ~/.bashrc.d/minikube
   alias kubectl="minikube kubectl --"
   EOF
   $ source ~/.bashrc
   ```

### Installing the Konveyor operator

Follow the official instructions for [Installing Konveyor Operator](https://konveyor.github.io/konveyor/installation/#installing-konveyor-operator)

Alternatively, the [konveyor/operator git repository](https://github.com/konveyor/operator) provides a script to install Tackle locally using `kubectl`. You can [inspect its source here](https://github.com/konveyor/operator/blob/main/hack/install-tackle.sh). This script creates the `konveyor-tackle` namespace, CatalogSource, OperatorGroup, Subscription and Tackle CR, then waits for deployments to be ready.

#### Customizing the install script (optional)

The install script provides optional environment variables you can use to customize the images and features used. See [the source of the script](https://github.com/konveyor/operator/blob/main/hack/install-tackle.sh) for all available variables.

For example, if you wish to run tackle with keycloak authentication enabled, export the following variable before running the install script:

```sh
$ export TACKLE_FEATURE_AUTH_REQUIRED=true
```

#### Running the install script

Before proceeding, if you are on macOS you will need to use [Homebrew](https://brew.sh/) to install the `coreutils` package:

```sh
$ brew install coreutils
```

To run the install script (requires `kubectl` on your PATH configured for minikube):

```sh
$ curl https://raw.githubusercontent.com/konveyor/operator/main/hack/install-tackle.sh | bash
```

Alternatively, you can clone the [konveyor/operator git repository](https://github.com/konveyor/operator) and run `./hack/install-tackle.sh` from your clone, or you can execute its commands manually.

⚠️ Note: While CRDs are being established, you may see the script output `NotFound` errors. You can safely ignore these. The script will wait 30 seconds to check for the CRD again before proceeding.

The installation is complete when the script outputs "condition met" messages and terminates.

### Start your local development server

Now that your environment is ready, navigate to your installed tackle-ui directory and run your development server:

```sh
$ cd tackle2-ui
$ npm run start:dev
```

## Understanding the local development environment

Tackle2 runs in a Kubernetes compatible environment (i.e. Openshift, Kubernetes or minikube) and is usually deployed with Tackle2 Operator (OLM).
Although the UI pod has access to tackle2 APIs from within the cluster, the UI can also be executed outside the cluster and access Tackle APIs endpoints by proxy.

The React and Patternfly based UI is composed of web pages served by an http server with proxy capabilities.

- In **production** mode, Express (Node.js) plays the role of both UI server and proxy server
  (using http-proxy-middleware). Everything is served on port **8080**. The `/auth` and `/hub`
  routes are proxied to their services. All other routes serve the UI bundle where they are
  handled by react-router.

- In **development** mode, webpack-dev-server plays the role of UI server and Express plays
  the role of proxy server only. This allows webpack-dev-server to provide development features
  such as hot reload. The webpack-dev-server serves the UI on port **9000**. The `/auth` and `/hub`
  routes are forwarded to port **8080** for Express to handle.

The Express [server/src/setupProxy.js](server/src/setupProxy.js) proxies use the environment
variables `TACKLE_HUB_URL` and `SSO_SERVER_URL` to define the backend endpoints:

- If the Tackle Hub variable `TACKLE_HUB_URL` is not defined, the URL `http://localhost:9002` is
  used by default.

- If the Tackle Keycloak (SSO) variable `SSO_SERVER_URL` is not defined, the URL
  `http://localhost:9001` is used by default.

### Running the UI outside the cluster

To enable running the UI outside the cluster, port forwardings must be activated to route
the Tackle Keycloak (SSO) and Tackle Hub requests to the services on the cluster. Use
the script `npm run port-forward` to easily start the forwards. The script `npm run start:dev`
will also setup port forwarding to all tackle2 services concurrently with starting the dev server.

To manually setup the kubectl port forwards, open a terminal and run each following command separately:

```sh
$ kubectl port-forward svc/tackle-keycloak-sso -n konveyor-tackle 9001:8080
$ kubectl port-forward svc/tackle-hub -n konveyor-tackle 9002:8080
```

**Note**: The `npm run port-forward` or `kubectl port-forward` commands need to remain running
for the ports to be available.

## Accessing the Kubernetes dashboard

We may need to access the dashboard, either simply to see what's happening under the hood, or to
troubleshoot an issue. The dashboard addon is enabled in the default in recommended `minikube start`
command in the [Minikube setup section](#minikube-setup).

There are two ways to setup access to the dashboard.

First, we can use the `minikube dashboard` command. Use to following to open on an explicit
port and only show the URL instead of opening the default browser directly:

```sh
$ minikube dashboard --port=18080 --url=true
```

Second, we can use the `kubectl port-forward` command to enable access to the dashboard:

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

## File Naming Conventions

- Use kebab-case for file names.
- The root page/parent level components are placed directly in their respective directories.
- Presentation layer components are placed within the `components/` subdirectory of the parent component.

# Contributing

We welcome contributions to this project! If you're interested in contributing,
please read the [konveyor/community CONTRIBUTING doc](https://github.com/konveyor/community/blob/main/CONTRIBUTING.md)
for more information on how to get started.

# Code of Conduct

Refer to Konveyor's [Code of Conduct page](https://github.com/konveyor/community/blob/main/CODE_OF_CONDUCT.md)
