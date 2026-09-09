// Command entrypoint is the container entry point for tackle2-ui's production
// image.  It validates required environment variables, assembles any available
// Kubernetes CA certificate bundles into a single PEM file, then replaces
// itself with the Caddy web server.
//
// CA handling: Caddy uses Go's crypto/tls stack, which respects the
// SSL_CERT_FILE environment variable.  When one or more certificate sources are
// found the bundle path is written to SSL_CERT_FILE before exec'ing Caddy so
// that all upstream TLS connections automatically trust the cluster CAs.
package main

import (
	"fmt"
	"os"
	"syscall"
)

const (
	// Kubernetes service-account certificate sources.
	kubeAPICert   = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
	serviceCACert = "/var/run/secrets/kubernetes.io/serviceaccount/service-ca.crt"

	// Red Hat / OpenShift custom CA trust bundle; injected by cert-manager or
	// the Konveyor operator when a custom ingress CA is configured.
	ingressCACert = "/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem"

	// Destination for the assembled PEM bundle.  /tmp is writable in the
	// distroless hi/caddy runtime image.
	caBundleDest = "/tmp/ca-bundle.crt"

	caddyBin    = "/usr/bin/caddy"
	caddyConfig = "/etc/caddy/Caddyfile"
)

func main() {
	validateEnv()
	assembleCA()

	// Replace this process with Caddy.  os.Environ() includes any SSL_CERT_FILE
	// that assembleCA() set, so Caddy's Go TLS stack inherits it automatically.
	argv := []string{caddyBin, "run", "--config", caddyConfig}
	if err := syscall.Exec(caddyBin, argv, os.Environ()); err != nil {
		fmt.Fprintf(os.Stderr, "failed to exec caddy: %v\n", err)
		os.Exit(1)
	}
}

// validateEnv replicates the checks from the former entrypoint.sh, preserving
// the exact error messages so that operator documentation remains accurate.
func validateEnv() {
	if os.Getenv("TACKLE_HUB_URL") == "" {
		fatal("You must provide TACKLE_HUB_URL environment variable")
	}

	if os.Getenv("AUTH_REQUIRED") != "false" {
		issuer := os.Getenv("OIDC_ISSUER")
		clientID := os.Getenv("OIDC_CLIENT_ID")

		switch {
		case issuer == "" && clientID == "":
			fatal("Further configuration via environment variables is required to enable authentication,\n" +
				"OIDC_ISSUER and OIDC_CLIENT_ID are required.")
		case issuer != "" && clientID == "":
			fatal("You must provide OIDC_CLIENT_ID environment variable")
		case issuer == "" && clientID != "":
			fatal("You must provide OIDC_ISSUER environment variable")
		}
	}
}

// assembleCA concatenates each available certificate source into caBundleDest
// and points SSL_CERT_FILE at the result.  Missing sources are silently skipped
// so that the binary works in both Kubernetes and local container environments.
func assembleCA() {
	sources := []string{kubeAPICert, serviceCACert, ingressCACert}

	dest, err := os.Create(caBundleDest)
	if err != nil {
		fmt.Fprintf(os.Stderr, "warning: could not create CA bundle at %s: %v\n", caBundleDest, err)
		return
	}
	defer dest.Close()

	assembled := false
	for _, src := range sources {
		data, err := os.ReadFile(src)
		if err != nil {
			continue // source not present — skip silently
		}
		if _, err := dest.Write(data); err != nil {
			fmt.Fprintf(os.Stderr, "warning: could not append %s to CA bundle: %v\n", src, err)
			continue
		}
		assembled = true
	}

	if assembled {
		if err := os.Setenv("SSL_CERT_FILE", caBundleDest); err != nil {
			fmt.Fprintf(os.Stderr, "warning: could not set SSL_CERT_FILE: %v\n", err)
		}
	}
}

func fatal(msg string) {
	fmt.Fprintln(os.Stderr, msg)
	os.Exit(1)
}
