# tackle2-ui

[![Operator Repository on Quay](https://quay.io/repository/konveyor/tackle2-ui/status "Operator Repository on Quay")](https://quay.io/repository/konveyor/tackle2-ui) [![License](http://img.shields.io/:license-apache-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0.html) [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/konveyor/tackle2-ui/pulls)

Tackle (2nd generation) UI component.

To install a Tackle2 cluster environment please refer to [Tackle documentation](https://github.com/konveyor/tackle).
# Development
## Prerequisites

- [NodeJS](https://nodejs.org/en/) >= 16.x
## Getting Started 

```
git clone https://github.com/konveyor/tackle2-ui
cd tackle2-ui
npm install -ws && npm install
```

With a Tackle2 environment available (with kubectl authentication validated)  
then one can start a tackle-ui instance locallly serving the pages from the current source code: 

`npm run start:dev:local`

If you're using minikube please read on.

## Understanding the local development environment

Tackle2 runs in a Kubernetes compatible environment (Openshift, Kubernetes or minikube) and is usually deployed with Tackle2 Operator (OLM).
Alhtough the UI pod has access to tackle2 APIs from within the cluster, the UI can also be executed outside the cluster and access Tackle APIs endpoints by proxy.

The UI is composed of web pages (React) served by an http server (Express) with proxy capabilities (http-middleware-prox).
So we when we run Express locally it forwards all API requests to the backend and at same time we keep watching any source changes to be immediatly reloaded.
It's the equivalent of running webpack dev-server with proxy configuration.

The Express server (pkg/server/setupProxy.js) uses by default the environment variables TACKLE_HUB_URL, PATHFINDER_URL and SSO_SERVER_URL to determine the backend endpoints. 
If no env. variables are defined, the server then listens on ports 9001 (SSO), 9002 (Application inventory and controls) and 9003 (Pathfinder).

In which case the port forwarding must activated to route Tackle Keycloack (SSO), Tackle Hub and Tackle Pathfinder requests.
To set-up kubectl port forwarding Tackle2 services to localhost, open a terminal and run each following command separatly: 
`$ kubectl port-forward svc/tackle-keycloak-sso -n konveyor-tackle 9001:8080`
`$ kubectl port-forward svc/tackle-hub -n konveyor-tackle 9002:8080`
`$ kubectl port-forward svc/tackle-pathfinder -n konveyor-tackle 9003:8080` 

That's exactly what `start:dev:local` does by port forwarding all tackles2 services for us.

## How to configure Minikube for Tackle2

Note - The steps described below are executed on a Fedora 35 workstation, but will likely work on any recent Linux distribution.
The only prerequisites are to enable virtualization extensions in the BIOS/EFI of the machine, to install libvirt and to add our user to the libvirt group.

Minikube provides a certified Kubernetes platform with most of the vanilla features allowing to simulate a real Kubernetes cluster with a fairly high level of feature parity.
The installation consists in downloading the minikube binary into ${HOME}/.local/bin, so that we don't need to modify the PATH variable. Other options are described in Minikube documentation.

```
$ curl -sL -o ${HOME}/.local/bin/minikube \
    https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
$ chmod u+x ~/.local/bin/minikube
```

Add ${HOME}/.local/bin to your PATH environment variable

By default, Minikube uses the kvm driver with 6,000 MB of memory. This is not enough to run all the services, so we need to increase the allocated memory. In our experience, 10 GB of memory is fine.

`$ minikube config set memory 10240`

Then, the following command will download a qcow2 image of Minikube and start a virtual machine from it. It will then wait for the Kubernetes API to be ready.

`$ minikube start`

We need to enable the dashboard, ingress and olm addons. The dashboard addon installs the dashboard service that exposes the Kubernetes objects in a user interface. The ingress addon allows us to create Ingress CRs to expose the Tackle UI and Tackle Hub API. The olm addon allows us to use an operator to deploy Tackle.

`$ minikube addons enable dashboard`
`$ minikube addons enable ingress`
`$ minikube addons enable olm`


The following command gives us the IP address assigned to the virtual machine created by Minikube.
It's used when interacting with tackle UI image installed on the minikube cluster.

```
$ minikube ip
192.168.39.23
```

### Configuring kubectl (optional)
Minikube allows us to use the kubectl command with `minikube kubectl. To make the experience more Kubernetes-like, we can set a shell alias to simply use kubectl.
The following example shows how to do it for Bash on Fedora 35.

```
$ mkdir -p ~/.bashrc.d
$ cat << EOF > ~/.bashrc.d/minikube
alias kubectl="minikube kubectl --"
EOF
$ source ~/.bashrc
```

### Accessing the Kubernetes dashboard
We may need to access the dashboard, either simply to see what's happening under the hood, or to troubleshoot an issue. We have already enabled the dashboard addon in a previous command.

We can use the kubectl proxy command to enable that. The following command sets up the proxy to listen on any network interface (useful for remote access), on the 18080/tcp port (easy to remember), with requests filtering disabled (less secure, but necessary).

`$ kubectl proxy --address=0.0.0.0 --port 18080 --disable-filter=true`

We can now access the minikube dashboard through the proxy.
In the following URL, replace the IP address with your workstation IP address. 

http://192.168.0.1:18080/api/v1/namespaces/kubernetes-dashboard/services/http:kubernetes-dashboard:/proxy/#/


### Installing Tackle on Minikube or Kubernetes

For installation on Kubernetes refer to Tackle2 documentation [https://github.com/konveyor/tackle2-operator/blob/main/docs/k8s.md](k8s.md)

Once minikube is installed with OLM installed, as seen above, then deploy Tackle by running this command : 
`kubectl apply -f https://raw.githubusercontent.com/konveyor/tackle2-operator/main/tackle-k8s.yaml`

Then launch Tackle by applying the following CR:

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

Wait few minutes to make sure tackle is fully deployed: 

`kubectl wait deployment tackle-keycloak-sso -n konveyor-tackle --for condition=Available --timeout=5m` 

## Code of Conduct
Refer to Konveyor's [Code of Conduct page](https://github.com/konveyor/community/blob/main/CODE_OF_CONDUCT.md) 
