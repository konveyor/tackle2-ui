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

```
git clone https://github.com/konveyor/tackle2-ui
cd tackle2-ui
npm install
```

## Quick start

With an existing Tackle2 environment available, one can start a locally served tackle2-ui instance with:

`npm run start:dev`

## Tackle2 environment setup

With the UI project setup out of the way, you can now begin setting up you local Tackle2 dev environment. The preferred local development option is to setup a minikube instance.
Alternatively, for information on general Kubernetes installation refer to [Tackle2 operator readme](https://github.com/konveyor/tackle2-operator#readme) file.

### Minikube setup

[Minikube](https://github.com/kubernetes/minikube) implements a local Kubernetes cluster on macOS, Linux, and Windows. See the minikube getting started guide [here.](https://minikube.sigs.k8s.io/docs/start/)

All you need to run minikube is [Docker](https://docs.docker.com/engine/install/) (or similarly compatible) container or a Virtual Machine environment.

By default, Minikube uses a [driver](https://minikube.sigs.k8s.io/docs/drivers/) with 6,000 MB of memory. This is not enough to run all the services, so we need to increase the allocated memory. In our experience, 10 GB of memory is fine.

`$ minikube config set memory 10240`

From a terminal with administrator access (but not logged in as root), run:

`$ minikube start --addons=dashboard --addons=ingress --addons=olm`

Note: We need to enable the dashboard, ingress and olm addons. The dashboard addon installs the dashboard service that exposes the Kubernetes objects in a user interface. The ingress addon allows us to create Ingress CRs to expose the Tackle UI and Tackle Hub API. The olm addon allows us to use an operator to deploy Tackle.

### Installing Tackle resources

Create a `konveyor-tackle` namespace and other supporting tackle resources including the tackle CRD.

`kubectl apply -f https://raw.githubusercontent.com/konveyor/tackle2-operator/main/tackle-k8s.yaml `

Deploy the tackle CR:

Note: The below command will fail if the Tackle CRD is not yet established. This may take some time.

```
cat << EOF | kubectl apply -f -
kind: Tackle
apiVersion: tackle.konveyor.io/v1alpha1
metadata:
  name: tackle
  namespace: konveyor-tackle
spec:
EOF
```

Note: If you wish to run tackle without keycloak authentication enabled, append the following field to the above tackle CR spec:

`feature_auth_required: false`

Wait few minutes to make sure tackle is fully deployed:

`kubectl wait deployment tackle-keycloak-sso -n konveyor-tackle --for condition=Available --timeout=5m`

### Start your local development server

Now that your environment is ready, navigate to your installed tackle-ui directory and run your development server:

```
cd tackle2-ui
npm run start:dev
```

## Understanding the local development environment

Tackle2 runs in a Kubernetes compatible environment (Openshift, Kubernetes or minikube) and is usually deployed with Tackle2 Operator (OLM).
Although the UI pod has access to tackle2 APIs from within the cluster, the UI can also be executed outside the cluster and access Tackle APIs endpoints by proxy.

The UI is composed of web pages (React) served by an http server with proxy capabilities.

- In production mode, Express (Node.js) plays the role of both UI server and proxy server (using http-proxy-middleware).
  Everything is served on port 8080: the `/auth` and `/hub` routes are proxied to their services, and all other routes serve the UI bundle where they are handled by react-router.
- In development mode, webpack-dev-server plays the role of UI server and Express plays the role of proxy server only. This allows webpack-dev-server to provide development features such as auto-reload.
  webpack-dev-server serves the UI on port 9000 and forwards the `/auth` and `/hub` routes to port 8080 for Express to handle.

The Express server (server/setupProxy.js) uses by default the environment variables TACKLE_HUB_URL and SSO_SERVER_URL to determine the backend endpoints.
If no env. variables are defined, the server then listens on ports 9001 (SSO), 9002 (Application inventory and controls).

In which case the port forwarding must be activated to route Tackle Keycloack (SSO), Tackle Hub requests.
To set-up kubectl port forwarding Tackle2 services to localhost, open a terminal and run each following command separately:

```
$ kubectl port-forward svc/tackle-keycloak-sso -n konveyor-tackle 9001:8080
$ kubectl port-forward svc/tackle-hub -n konveyor-tackle 9002:8080
$ kubectl port-forward svc/tackle-pathfinder -n konveyor-tackle 9003:8080
```

That's exactly what `start:dev` does by port forwarding all tackle2 services for us.

## Configuring kubectl (optional)

Minikube allows us to use the kubectl command with `minikube kubectl. To make the experience more Kubernetes-like, we can set a shell alias to simply use kubectl.
The following example shows how to do it for Bash on Fedora 35.

```

$ mkdir -p ~/.bashrc.d
$ cat << EOF > ~/.bashrc.d/minikube
alias kubectl="minikube kubectl --"
EOF
$ source ~/.bashrc

```

## Accessing the Kubernetes dashboard

We may need to access the dashboard, either simply to see what's happening under the hood, or to troubleshoot an issue. We have already enabled the dashboard addon in a previous command.

We can use the kubectl proxy command to enable that. The following command sets up the proxy to listen on any network interface (useful for remote access), on the 18080/tcp port (easy to remember), with requests filtering disabled (less secure, but necessary).

`$ kubectl proxy --address=0.0.0.0 --port 18080 --disable-filter=true`

We can now access the minikube dashboard through the proxy.
In the following URL, replace the IP address with your workstation IP address.

http://192.168.0.1:18080/api/v1/namespaces/kubernetes-dashboard/services/http:kubernetes-dashboard:/proxy/#/

## Troubleshooting

Note - The steps described are executed on a Fedora 35 workstation, but will likely work on any recent Linux distribution.
The only prerequisites are to enable virtualization extensions in the BIOS/EFI of the machine, to install libvirt and to add our user to the libvirt group.

- Ensure that your minikube installation directory is available in your `$PATH` environment variable. This is usually `/usr/local/bin/` or something similar depending on your OS of choice.

- The following command gives us the IP address assigned to the virtual machine created by Minikube.
  It's used when interacting with tackle UI image installed on the minikube cluster.

```

$ minikube ip
192.168.39.23

```

## Code of Conduct

Refer to Konveyor's [Code of Conduct page](https://github.com/konveyor/community/blob/main/CODE_OF_CONDUCT.md)
