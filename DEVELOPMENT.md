# Dev environment

Note - The steps described below are executed on a Fedora 35 workstation, but will likely work on any recent Linux distribution. The only prerequisites are to enable virtualization extensions in the BIOS/EFI of the machine, to install libvirt and to add our user to the libvirt group.

The first thing to do is to install Minikube, which provides a certified Kubernetes platform with most of the vanilla features. This allows to simulate a real Kubernetes cluster with a fairly high level of feature parity.

## Installing Minikube
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


The following command gives us the IP address assigned to the virtual machine created by Minikube. It will be used later, when interacting with the Tackle Hub API.

```
$ minikube ip
192.168.39.23
```

## Configuring kubectl (optional)
Minikube allows us to use the kubectl command with `minikube kubectl. To make the experience more Kubernetes-like, we can set a shell alias to simply use kubectl. The following example shows how to do it for Bash on Fedora 35.

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

We can now access the dashboard through the proxy.
In the following URL, replace the IP address with your workstation IP address. 

http://192.168.0.1:18080/api/v1/namespaces/kubernetes-dashboard/services/http:kubernetes-dashboard:/proxy/#/


## Installing Tackle
We can now deploy Tackle using the Ansible based operator. It is currently not published, so we'll have to use the deploy target of the Makefile provided in the repository.

```
$ git clone https://github.com/fabiendupont/tackle-operator
$ cd tackle-operator
$ make deploy
```

This only deploys the controller-manager pod, we need to create a Tackle CR to trigger the deployment of the other services. An example is provided in the repository.

`$ kubectl create -f config/samples/tackle.konveyor.io_v1alpha1_tackle.yaml`

## Set-up kubectl to forward each api services to localhost
In separate windows run each of the following:

`$ kubectl port-forward svc/tackle-keycloak-sso -n tackle-operator 9001:8080`

`$ kubectl port-forward svc/tackle-hub-api -n tackle-operator 9002:8080`

`$ kubectl port-forward svc/tackle-pathfinder-api -n tackle-operator 9003:8080`