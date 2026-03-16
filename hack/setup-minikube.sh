#!/bin/bash
set -euo pipefail

if ! command -v minikube >/dev/null 2>&1; then
  echo "minikube not found, please install it:"
  echo "    https://minikube.sigs.k8s.io/docs/start/"
  exit 1
fi

# Configure minikube with our preferred settings for running on Fedora and start
set_if_not_set() {
  local key="$1" value="$2"
  if ! minikube config get "$key" >/dev/null 2>&1; then
    echo "Setting $key to $value"
    minikube config set "$key" "$value"
  fi
}
set_if_not_set driver kvm2
set_if_not_set memory 28000
set_if_not_set cpus 4
set_if_not_set disk-size 35g

minikube start --addons=dashboard --addons=ingress

# Install OLM
OLM_VERSION="v0.32.0"
curl \
  -L https://github.com/operator-framework/operator-lifecycle-manager/releases/download/${OLM_VERSION}/install.sh \
  -o install_${OLM_VERSION}.sh

chmod +x install_${OLM_VERSION}.sh
./install_${OLM_VERSION}.sh ${OLM_VERSION}
rm ./install_${OLM_VERSION}.sh
