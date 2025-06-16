# Scripts and samples of import data

This folder is a place to keep sample data and scripts to help developers with
creating/importing various pieces of data.

## Adding a base set of data to an empty instance

For creating a base set of data in a tackle-hub instance, a good place to start
is [tackle-hub's hack folder](https://github.com/konveyor/tackle2-hub/tree/main/hack).
If you have the Konveyor operator running on minikube without authentication, a basic
set of data can be added to the instance by:

```sh
git clone https://github.com/konveyor/tackle2-hub.git
cd tackle2-hub/hack
HOST=http://$(minikube ip)/hub ./add/all.sh
```

## Useful commands

#### List all of the "tackle-" pods, what container image they're using, and the image's manifest digest:

```sh
minikube kubectl -- \
    get pods -n konveyor-tackle -o=json \
    | jq '
        .items[] | select(.metadata.name | test("tackle-")) |
        {
          name:.metadata.name,
          image:.status.containerStatuses[0].image,
          imageID:.status.containerStatuses[0].imageID
        }
      '
```

Example output:

```json
{
  "name": "tackle-hub-57b4f5b87c-5cdds",
  "image": "quay.io/konveyor/tackle2-hub:latest",
  "imageID": "docker-pullable://quay.io/konveyor/tackle2-hub@sha256:f19ab51cc9f23ee30225dd1c15ca545c2b767be7d7e1ed5cd83df47a40e5d324"
}
{
  "name": "tackle-operator-597f9755fb-84jg7",
  "image": "quay.io/konveyor/tackle2-operator:latest",
  "imageID": "docker-pullable://quay.io/konveyor/tackle2-operator@sha256:4110d23743087ee9ed97827aa22c1e31b066a0e5c25db90196c5dfb4dbf9c65b"
}
{
  "name": "tackle-ui-5ccd495897-vsj5x",
  "image": "quay.io/konveyor/tackle2-ui:latest",
  "imageID": "docker-pullable://quay.io/konveyor/tackle2-ui@sha256:541484a8919d9129bed5b95a2776a84ef35989ca271753147185ddb395cc8781"
}
```

#### List the current ":latest" tag's manifest digest from quay for a single image (tackle2-hub in this example):

```sh
curl https://quay.io/api/v1/repository/konveyor/tackle2-hub/tag/\?onlyActiveTags\=true\&specificTag\=latest | jq '.'
```

Example output:

```json
{
  "tags": [
    {
      "name": "latest",
      "reversion": false,
      "start_ts": 1718406240,
      "manifest_digest": "sha256:f19ab51cc9f23ee30225dd1c15ca545c2b767be7d7e1ed5cd83df47a40e5d324",
      "is_manifest_list": true,
      "size": null,
      "last_modified": "Fri, 14 Jun 2024 23:04:00 -0000"
    }
  ],
  "page": 1,
  "has_additional": false
}
```

#### Bounce a deployment to update to the current image with a tag

The ":latest" image tag usually move frequently. Using the previous two commands, the `sha256` for the
`tackle2-hub` image match between the kubectl output and the quay.io output. This comparison is an easy
way to make sure the container image in your environment is actually the current version.

If the digests do not match, the easy way to update is to "bounce" the deployment (the tackle-hub in this example):

```sh
minikube kubectl -- scale -n konveyor-tackle deployment tackle-hub --replicas=0
minikube kubectl -- scale -n konveyor-tackle deployment tackle-hub --replicas=1
```

Assuming the default `image_pull_policy=Always`, after the bounce the deployment and pod will be using the current image.

#### Patch your Tackle CR to use a custom container

```sh
kubectl patch -n konveyor-tackle tackle tackle --type=merge --patch-file=/dev/stdin <<-EOF
spec:
  image_pull_policy: IfNotPresent
  ui_image_fqin: quay.io/sdickers/tackle2-ui:test
EOF
```

#### Pull the Keycloak SSO admin login secret

```sh
kubectl get secrets -n konveyor-tackle tackle-keycloak-sso -o=json \
  | jq ".data|map_values(@base64d)"
```
