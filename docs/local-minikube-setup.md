# Setting up Konveyor on a local minikube instance

The preferred local development for the tackle2-ui is to install the Konveyor
operator on a minikube instance. When the operator is installed and running,
the ui development server can attach to it and use the running hub api. There
will also be a running UI instance to work with.

The setup process follows the general steps:

- install minikube
- start minikube with the **dashboard** and **ingress** addons
- install the operator framework (OLM)
- install the Konveyor operator
- optionally add test data

## Konveyor Documentation

A guide for installing minikube and Konveyor is also available in the general project
documentation. See document [Installing Konveyor](https://konveyor.github.io/konveyor/installation).

For information on general Kubernetes installation refer to
[Konveyor operator readme](https://github.com/konveyor/tackle2-operator#readme).

## Install and start minikube

[Minikube](https://github.com/kubernetes/minikube) implements a local Kubernetes cluster
and is available on macOS, Linux, and Windows. All you need to run minikube is a container
runtime ([Docker](https://docs.docker.com/engine/install/) or [podman](https://podman.io/docs/installation))
or a Virtual Machine environment.

See the minikube [getting started guide](https://minikube.sigs.k8s.io/docs/start/) for install
details for your platform.

By default, Minikube uses a [driver](https://minikube.sigs.k8s.io/docs/drivers/) with 6 GB
of memory and 2 CPUs. This may not be enough to run all the services, so we need to increase
the allocated memory. In our experience, 10 GB of memory and 4 CPUs is fine:

```sh
minikube config set memory 10240
minikube config set cpus 4
```

> [!IMPORTANT]
> Depending on your driver, administrator access may be required. Common driver choices are
> Docker for container-based virtualization and KVM for hardware-assisted virtualization on Linux
> systems. If you're not sure which driver is best for you or if you're encountering compatibility
> issues, minikube supports auto-selecting a driver based on your system's capabilities and
> installed software.

Start minikube with the command:

```sh
minikube start --addons=dashboard --addons=ingress
```

> [!NOTE]
> We need to enable the **dashboard** and **ingress** addons. The dashboard addon installs
> the dashboard service that provides a web UI for the Kubernetes objects. The ingress addon
> allows us to create Ingress CRs to expose the Tackle UI and Tackle Hub API.

## Install OLM

Since Konveyor is deployed as an operator, the [operator framework](https://operatorframework.io/)'s
[operator lifecycle manager (OLM)](https://olm.operatorframework.io/) needs to be installed
on our new minikube instance before installing the Konveyor operator.

Since the minikube olm addon is disabled until OLM issue
[2534](https://github.com/operator-framework/operator-lifecycle-manager/issues/2534)
is resolved we need to install the [OLM manually](https://github.com/operator-framework/operator-lifecycle-manager/releases).

For version `v0.28.0` (latest version as of 17-May-2024) use the scripts:

```sh
curl -L https://github.com/operator-framework/operator-lifecycle-manager/releases/download/v0.28.0/install.sh -o install.sh
chmod +x install.sh
./install.sh v0.28.0
```

## Install the Konveyor Operator

See also official Konveyor instructions for [Provisioning Minikube](https://konveyor.github.io/konveyor/installation/#provisioning-minikube).

## Sample Data

## Optional Setup

### Configuring kubectl for minikube

You will need `kubectl` on your PATH and configured to control minikube in order to proceed.
There are a few ways to set this up:

1. **Install kubectl yourself**

   If you already [have the `kubectl` CLI tool installed](https://kubernetes.io/docs/tasks/tools/#kubectl)
   and available on your PATH, the `minikube start` command should configure it to control the minikube
   cluster. You should see the following message when minikube starts if this worked correctly:

   ```
   🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
   ```

2. **Use a shell alias for minikube's built-in kubectl**

   Minikube provides its own internal `kubectl` which you can use by running `minikube kubectl --`
   followed by your CLI arguments. If you want to use the built-in `minikube kubectl` as the `kubectl`
   on your shell, you can setup a shell alias.

   The following example shows how to setup an alias for bash on Fedora 35:

   ```sh
   $ mkdir -p ~/.bashrc.d
   $ cat << EOF > ~/.bashrc.d/minikube
   alias kubectl="minikube kubectl --"
   EOF
   $ source ~/.bashrc
   ```

   > [!WARNING]
   > The alias will only work for an interactive shell. If you want to use `minikube kubectl --`
   > as the command in scripts, you'll need to use a shim shell script.

3. **Use a shim shell script to route kubectl to minikube**

   To be able to use `minikube kubectl --` as the command `kubectl` in general use (interactive
   prompt and in other scripts), a simple shell script can be used. Any location that is in
   the `$PATH` can be used. Installing for all system users can typically be done to `/usr/local/bin`:

   ```sh
   $ cat << EOF > kubectl.sh
   #! /usr/bin/env bash
   minikube kubectl -- $@
   EOF
   $ sudo install -m 777 kubectl.sh /usr/local/bin/kubectl
   ```
