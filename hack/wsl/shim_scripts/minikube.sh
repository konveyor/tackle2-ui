#! /usr/bin/env bash
TARGET=/usr/local/bin

if [ ! -e "$TARGET/minikube.exe" ]; then
  [[ $(id -u) -ne 0 ]] && SUDO=sudo || SUDO=

  roots=(
    "/mnt/c/Users/*/AppData/Local/Microsoft/WindowsApps"
    "/mnt/c/Program Files/Kubernetes/Minikube"
    "/mnt/host/c/Users/*/AppData/Local/Microsoft/WindowsApps"
    "/mnt/host/c/Program Files/Kubernetes/Minikube"
  )

  shopt -s nullglob
  IFS=$'\n'
  for root in $roots; do
    if [ -e "${root}/minikube.exe" ]; then
      echo "linking to ${root}/minikube.exe"
      $SUDO ln -s "${root}/minikube.exe" "$TARGET/minikube.exe"
      break
    fi
  done
fi

minikube.exe $@
