# Operator Follow-up: CA Certificate Handling for tackle2-ui

This document tracks the changes needed in the [konveyor/operator](https://github.com/konveyor/operator) repository to align with the updated CA cert handling in `entrypoint.sh`.

## Background

`entrypoint.sh` was refactored to:

1. Use `/tmp/node-ca-bundle.pem` as the **output** path (rather than `/opt/app-root/src/ca.crt`)
2. Automatically pick up `*.crt` and `*.pem` files from the drop-in directory `/opt/app-root/ca-certs.d/`
3. Fully own the `NODE_EXTRA_CA_CERTS` variable -- any externally set value is ignored

## Required Operator Changes

### Remove the NODE_EXTRA_CA_CERTS env var (roles/tackle/templates/deployment-ui.yml.j2)

The entrypoint now manages `NODE_EXTRA_CA_CERTS` internally. The operator should stop setting it:

```yaml
# Remove this block from deployment-ui.yml.j2:
- name: NODE_EXTRA_CA_CERTS
  value: { { ui_node_extra_ca_certs } }
```

And remove the default from `roles/tackle/defaults/main.yml`:

```yaml
# Remove this line:
ui_node_extra_ca_certs: "/opt/app-root/src/ca.crt"
```

### Mount custom CAs to the drop-in directory (deployment-ui.yml.j2)

For deployments that need to inject a custom CA without using the OpenShift cluster-wide trust bundle mechanism, mount a Secret or ConfigMap into `/opt/app-root/ca-certs.d/`. The entrypoint will automatically include any `*.crt` or `*.pem` files found there.

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

continues to work unchanged -- `/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem` remains a hardcoded source in `ca_sources` in the entrypoint.
