# Operator Follow-up: CA Certificate Handling for tackle2-ui

This document tracks the changes needed in the [konveyor/operator](https://github.com/konveyor/operator) repository to align with the updated CA cert handling in `entrypoint.sh`.

## Background

`entrypoint.sh` was refactored to:

1. Use `/tmp/node-ca-bundle.pem` as the **output** path (rather than `/opt/app-root/src/ca.crt`)
2. Treat any pre-set `NODE_EXTRA_CA_CERTS` as an **input source** (safe to point at read-only mounts)
3. Automatically pick up `*.crt` and `*.pem` files from the drop-in directory `/opt/app-root/ca-certs.d/`

## Required Operator Changes (roles/tackle/defaults/main.yml)

The `ui_node_extra_ca_certs` default currently points at the old output path:

```yaml
# Before
ui_node_extra_ca_certs: "/opt/app-root/src/ca.crt"
```

It should either be removed (the entrypoint no longer needs it set externally) or updated to the new output path. Removing it is preferred — the entrypoint manages everything internally now:

```yaml
# After: remove the line entirely, OR update to new output path if other
# tooling depends on a predictable env var value at runtime:
ui_node_extra_ca_certs: "/tmp/node-ca-bundle.pem"
```

And in `roles/tackle/templates/deployment-ui.yml.j2`, the env var block:

```yaml
# Before
- name: NODE_EXTRA_CA_CERTS
  value: { { ui_node_extra_ca_certs } }
```

Can be removed entirely, or kept pointing at `/tmp/node-ca-bundle.pem` if downstream tooling needs the env var present regardless.

## Optional: Drop-in Directory Mount (deployment-ui.yml.j2)

For deployments that need to inject a custom CA without using the OpenShift cluster-wide trust bundle mechanism, operators can mount a Secret or ConfigMap into `/opt/app-root/ca-certs.d/`. The entrypoint will automatically include any `*.crt` or `*.pem` files found there.

Example volume + mount:

```yaml
# In the container's volumeMounts:
- name: custom-ca
  mountPath: /opt/app-root/ca-certs.d
  readOnly: true

# In the pod's volumes:
- name: custom-ca
  secret:
    secretName: my-custom-ca-secret
    # Each key in the Secret that ends in .crt or .pem will be picked up.
```

Or with a ConfigMap:

```yaml
volumes:
  - name: custom-ca
    configMap:
      name: my-custom-ca-configmap
      items:
        - key: ca.crt
          path: ca.crt
```

This is an alternative to (or complement of) the existing `trusted_ca_enabled` mechanism that mounts the OpenShift cluster CA bundle to `/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem`.

## Existing trusted_ca_enabled Mechanism: No Change Needed

The existing conditional volume mount in `deployment-ui.yml.j2`:

```yaml
{% if trusted_ca_enabled is defined and trusted_ca_enabled|bool %}
- name: trusted-ca
  mountPath: /etc/pki/ca-trust/extracted/pem
  readOnly: true
{% endif %}
```

continues to work unchanged — `/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem` remains a hardcoded source in `ca_sources` in the entrypoint.
