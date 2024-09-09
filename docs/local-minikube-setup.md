# Setting up Konveyor on a local minikube instance

The preferred local development for the tackle2-ui is to install the Konveyor
operator on a minikube instance. When the operator is installed and running,
the UI development server can attach to it and use the operator's hub api. There
will also be a running UI instance to work with.

The setup process follows the general steps:

- install minikube
- start minikube with the **dashboard** and **ingress** addons
- install the operator framework (OLM)
- install the Konveyor operator
- optionally add test data

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

There are a few good ways to install the Konveyor operator:

- Use the script [`hack/setup-operator.sh`](/hack/setup-operator.sh). It is a local variation of
  the script from the operator that applies all CRs needed to install the Konveyor operator and
  setup the Tackle instance. Use of this script is described in the next section.

- Follow the official instructions for [Installing Konveyor Operator](https://konveyor.github.io/konveyor/installation/#installing-konveyor-operator)

- Use one of the `hack/install-*` scripts in the [konveyor/operator](https://github.com/konveyor/operator)
  repository. These scripts require `kubectl` and the `operator-sdk`.

### Running the setup script

To run the setup script without cloning the repo, make sure the `kubectl` command (not alias)
is working and configured for minikube instance, and that the bash shell is available:

```sh
curl https://raw.githubusercontent.com/konveyor/tackle2-ui/main/hack/setup-operator.sh -o setup-operator.sh
chmod +x setup-operator.sh
./setup-operator.sh
```

You may also run the script directly from you tackle2-ui clone:

```sh
cd tackle2-ui/hack
./setup-operator.sh
```

> [!WARNING]
> While CRDs are being established, you may see the script output `NotFound` errors.
> You can safely ignore these. The script will wait and recheck for the CRD again before
> proceeding.

The installation is complete when the script outputs "condition met" messages and terminates.

### Customizing the setup script

The setup script provides optional environment variables that may be used to customize the
images used, settings, and features enabled during the install.

Configuration environment variable include:
| variable | default | description |
| --- | --- | --- |
| TACKLE*CR | *(empty)\_ | Allows specifying the full Tackle CR |
| ADDON_ANALYZER_IMAGE | quay.io/konveyor/tackle2-addon-analyzer:latest | image for the ADDON_ANALYZER pod |
| ANALYZER_CONTAINER_REQUESTS_CPU | 0 | cpu count for the analyzer (0 is no restriction) |
| ANALYZER_CONTAINER_REQUESTS_MEMORY | 0 | memory size for the analyzer (0 is no restriction) |
| FEATURE_AUTH_REQUIRED | false | include keycloak SSO in operator deployment |
| HUB_BUCKET_VOLUME_SIZE | 100Gi | PV claim size for the HUB buckets |
| HUB_DATABASE_VOLUME_SIZE | 10Gi | PV claim size for the HUB database |
| HUB_IMAGE | quay.io/konveyor/tackle2-hub:lates | image for the HUB pod |
| IMAGE_PULL_POLICY | Always | When should images needed by the operator be pulled **link to docs for the pull policy** |
| NAMESPACE | konveyor-tackle | kubernetes namespace used |
| OPERATOR_INDEX_IMAGE | quay.io/konveyor/tackle2-operator-index:latest | base operator container image |
| UI_IMAGE | quay.io/konveyor/tackle2-ui:latest | image for the UI pod |
| UI_INGRESS_CLASS_NAME | nginx | nginx is the used as the ingress for minikube to access the UI |

For example, if you wish to run tackle with keycloak authentication enabled, export the following variable before running the install script:

```sh
export FEATURE_AUTH_REQUIRED=true
./setup-operator.sh
```

If the `TACKLE_CR` variable is defined, its contents will be used to create the `Tackle`
instance in lieu of one built in the script based on the other config variables. For
example, this will create a Tackle instance with authentication turned on and the UI
using a specially built test image:

```sh
export TACKLE_CR=$(cat <<EOF
kind: Tackle
apiVersion: tackle.konveyor.io/v1alpha1
metadata:
  name: tackle
spec:
  feature_auth_required: true
  ui_image_fqin: quay.io/sdickers/tackle2-ui:test-new-feature
EOF
)
./setup-operator.sh
```

## Optional Steps...

### Considerations for MacOS

Some core utils used in install and setup scripts may not be available by default on
a Mac. They are available to install via [Homebrew](https://brew.sh/) as the `coreutils`
package:

```sh
brew install coreutils
```

### Sample data from tackle2-hub

The [tackle2-hub repo](https://github.com/konveyor/tackle2-hub) has some scripts to add
basic entities to a Konveyor instance. Using the scripts is a reasonable way to get a
base setup. Importing that data is [described here](/hack/README.md#adding-a-base-set-of-data-to-an-empty-instance).

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

   The following example shows how to setup an alias for bash on Fedora:

   ```sh
   mkdir -p ~/.bashrc.d
   cat << EOF > ~/.bashrc.d/minikube
   alias kubectl="minikube kubectl --"
   EOF
   source ~/.bashrc
   ```

   > [!WARNING]
   > The alias will only work for an interactive shell. If you want to use `minikube kubectl --`
   > as the command in scripts, you'll need to use a shim shell script.

3. **Use a shim shell script to route kubectl to minikube**

   To be able to use `minikube kubectl --` as the command `kubectl` in general use (interactive
   prompt and in other scripts), a simple shell script can be used. Any location that is in
   the `$PATH` can be used. Installing for all system users can typically be done to `/usr/local/bin`:

   ```sh
   cat << EOF > kubectl.sh
   #! /usr/bin/env bash
   minikube kubectl -- $@
   EOF
   sudo install -m 777 kubectl.sh /usr/local/bin/kubectl
   ```

## Starting Over

If at any point your minikube Konveyor operator instance stops working properly, it
is simple to destroy the environment and rebuild.

To destroy an existing minikube instance (with Konveyor installed):

```sh
minikube stop
minikube delete
```

Rebuild by starting a new instance of minikube and following the rest of the
install steps in this document.
