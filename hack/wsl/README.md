# Konveyor on Windows

Running Konveyor on Windows has the same basic requirements as running
on Linux or Mac:

- A kubernetes / minikube instance
- OLM installed on the instance to be able to use Operators

Minikube needs to run on top of a container platform. There are multiple ways to set
that up (see [minikube drivers](https://minikube.sigs.k8s.io/docs/drivers/)). A
recommended approach is to use a docker or podman container runtime running on top of
WSL. There are various way to achieve this, but one way that was found to work is
described below.

> [!NOTE]
> Note: Installing a fedora distribution to WSL and then setting up an environment
> directly on that distribution is possible. This most likely involves nested
> virtualization and may require additional network configurations to run correctly.

General steps to get going:

- Install [the windows binary of minikube](#minikube)
- Install [a container runtime](#container-runtime) (docker or podman) on top of the WSL
- Start/create a [minikube instance](#start-a-minikube-instance)
- [Configure your default WSL](#configure-the-default-wsl) instance to:
  - be able to download and run bash scripts
  - use the `minikube` installed to windows
  - map the `kubectl` command to use the `minikube kubectl --` command. This is needed
    to be able to run the normal OLM and Konveyor install scripts.
- Install [OLM](#install-olm-on-minikube)
- Install [Konveyor](#install-konveyor-operator-on-minikube)
- Finally, [access the Konveyor UI](#accessing-the-ui-running-on-minikube)

## Installing

### Minikube

Install page: https://minikube.sigs.k8s.io/docs/start

- Download the [latest release of the Windows stable .exe download](https://minikube.sigs.k8s.io/docs/start/?arch=%2Fwindows%2Fx86-64%2Fstable%2F.exe+download)
- Run the installer (no changes to the default options are needed)

Alternatively, Minikube can be installed from podman desktop: https://podman-desktop.io/docs/minikube

### Container Runtime

Podman desktop or docker desktop can be used to setup WSL and a base
container runtime environment. Podman desktop allows for easy installation
of minikube from within its GUI.

Both docker desktop and podman desktop can be installed, but really just pick one.

#### Podman Desktop

Install page: https://podman-desktop.io/docs/installation/windows-install

The install has a few extra options to help setup WSL, the podman runtime[^1], and other
tools that I found more useful than Docker Desktop.

[^1]: Standard install of podman on windows: https://podman.io/docs/installation#windows

#### Docker Desktop

Install page: https://www.docker.com/products/docker-desktop/

Note: After installing, you'll either need to sign in to docker or hit skip a
bunch of times to start using docker. If this is annoying, Podman Desktop doesn't
do that.

## Start a minikube instance

General configuration and startup of a minikube instance is covered
[local minikube setup](/docs/local-minikube-setup.md#install-and-start-minikube).
However, on windows it is helpful to explicitly configure the driver to use based on what
container runtime you installed. **Assuming you installed the windows binaries for
minikube, these command should be run in a normal windows Command Prompt.** Sample
commands assuming you have podman installed (substitute podman for any other driver,
such as docker, as needed):

```
minikube start --addons=dashboard --addons=ingress --driver=podman
```

If a minikube instance already exists but doesn't have the needed addons, they can
be enabled individually:

```
minikube addons enable dashboard
minikube addons enable ingress
```

## Configure the default WSL

No matter what distribution is setup as default on your WSL environment, it probably
needs additional configurations to be able to run windows binaries, bash scripts,
minikube and kubectl

### Configuring the Docker Desktop WSL distribution

Docker desktop's WSL instance appears to use a version of alpine linux, so curl and
bash probably need to be installed manually. To install them, from the WSL prompt
run:

```
apk add curl bash
```

### Configuring the podman machine WSL distribution

The podman WSL distribution is based on fedora so curl and bash should already be
available.

The distribution may need extra configurations to be able to invoke windows binaries.
To verify windows binaries can be called, from the podman WSL instance (which should
be the default if only podman / podman desktop is installed), run the command

```
/mnt/c/Windows/System32/notepad.exe
```

If the notepad application opens, everything is ok.

If an error occurs, the distribution needs to be reconfigured[^2]:

- from the WSL command line run:

  ```
  sudo sh -c 'echo :WSLInterop:M::MZ::/init:PF > /usr/lib/binfmt.d/WSLInterop.conf'
  ```

- Exit the shell

- Either reboot or from the windows command prompt run:

  ```
  wsl --shutdown
  ```

- Open the WSL shell and try running notepad again. It should work this time.

[^2]: See this github comment: https://github.com/microsoft/WSL/issues/8843#issuecomment-1459120198

<!--
!!!!!!!! https://github.com/microsoft/WSL/issues/8843#issuecomment-1459120198
in WSL shell: `sudo sh -c 'echo :WSLInterop:M::MZ::/init:PF > /usr/lib/binfmt.d/WSLInterop.conf'`
exit the WSL shell
from windows command prompt: `wsl --shutdown`
go back in the WSL shell and should be able to invoke windows .exe files!
!!!!!!!!
-->

### Setting up the WSL instance to run the windows version of minikube / kubectl

Installing minikube as a windows binary has advantages, but for the OLM and Konveyor
install scripts to work unmodified, the most reliable way I found is to use a pair
of shell scripts. These scripts will then call the installed windows binary.

The scripts should be copied into a folder listed in the `$PATH`. Typically
the path `/usr/local/bin` is included and is a good location to put the scripts.

- Install a [shell script for `minikube`](shim_scripts/minikube.sh) to call the installed
  windows binary:

  ```
  curl -L https://raw.githubusercontent.com/konveyor/tackle2-ui/main/hack/wsl/shim_scripts/minikube.sh -o minikube.sh
  sudo install -m 777 minikube.sh /usr/local/bin/minikube
  ```

- Install a [shell script for `kubectl`](shim_scripts/kubectl.sh) to use the kubectl
  embedded in minikube `minikube kubectl --`:

  ```
  curl -L https://raw.githubusercontent.com/konveyor/tackle2-ui/main/hack/wsl/shim_scripts/kubectl.sh -o kubectl.sh
  sudo install -m 777 kubectl.sh /usr/local/bin/kubectl
  ```

- Test that minikube and kubectl are working:
  ```
  minikube profile list
  kubectl cluster-info
  ```

## Install OLM on minikube

Follow the normal OLM install process in
[local minikube setup](/docs/local-minikube-setup.md#install-olm) docs, but run the
commands in the WSL shell.

## Install Konveyor Operator on minikube

Follow the normal Konveyor operator install process in
[local minikube setup](/docs/local-minikube-setup.md#install-the-konveyor-operator) docs,
but run the commands in the WSL shell.

## Accessing the UI running on minikube

Looking at the [Ingress option of the deploy applications](https://minikube.sigs.k8s.io/docs/start/?arch=%2Fwindows%2Fx86-64%2Fstable%2F.exe+download#Ingress)
step in the minikube get started guide, there is a note for Docker Desktop Users:

> To get ingress to work you'll need to open a new terminal window and run minikube
> tunnel and in the following step use 127.0.0.1 in place of <ip_from_above>.

I also found this to be true using podman desktop.

Using `minikube tunnel` to have the tackle service exposed on localhost should work.
Open a new command prompt window and run (the window will need to remain open for
the tunnel to stay open):

```
minikube tunnel
```

Once the tunnel is running, Konveyor will be available at `http://127.0.0.1/`.
