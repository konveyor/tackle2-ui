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
	logConfig()

	// Replace this process with Caddy.  os.Environ() includes any SSL_CERT_FILE
	// that assembleCA() set, so Caddy's Go TLS stack inherits it automatically.
	argv := []string{caddyBin, "run", "--config", caddyConfig}
	if err := syscall.Exec(caddyBin, argv, os.Environ()); err != nil {
		fmt.Fprintf(os.Stderr, "failed to exec caddy: %v\n", err)
		os.Exit(1)
	}
}

// logConfig prints the resolved values of every environment variable that
// influences server behaviour: the proxy upstreams consumed by Caddy's
// proxy-routes.caddy, the auth variables validated above, the client-facing
// variables served via env.json.tmpl, and the CA bundle path (if assembled).
// Output goes to stdout so it appears in container logs alongside Caddy's own
// log stream.
func logConfig() {
	// envOr returns the variable's value or the given fallback string when unset.
	envOr := func(key, fallback string) string {
		if v := os.Getenv(key); v != "" {
			return v
		}
		return fallback
	}

	fmt.Println("=== tackle2-ui server configuration ===")

	// Proxy upstreams (defaults mirror proxy-routes.caddy).
	fmt.Println("-- proxy upstreams --")
	fmt.Printf("  TACKLE_HUB_URL      = %s\n", envOr("TACKLE_HUB_URL", "(unset)"))
	fmt.Printf("  KAI_LLM_PROXY_URL   = %s\n", envOr("KAI_LLM_PROXY_URL", "http://localhost:9003 (caddy default)"))
	fmt.Printf("  KEYCLOAK_SERVER_URL = %s\n", envOr("KEYCLOAK_SERVER_URL", "http://localhost:9004 (caddy default)"))

	// Authentication.
	fmt.Println("-- authentication --")
	fmt.Printf("  AUTH_REQUIRED = %s\n", envOr("AUTH_REQUIRED", "(unset — auth enforced)"))
	fmt.Printf("  OIDC_ISSUER   = %s\n", envOr("OIDC_ISSUER", "(unset)"))
	fmt.Printf("  OIDC_CLIENT_ID = %s\n", envOr("OIDC_CLIENT_ID", "(unset)"))

	// Client-side config served via /.env (env.json.tmpl).
	fmt.Println("-- client environment (/.env) --")
	fmt.Printf("  NODE_ENV                  = %s\n", envOr("NODE_ENV", "(unset)"))
	fmt.Printf("  VERSION                   = %s\n", envOr("VERSION", "(unset)"))
	fmt.Printf("  MOCK                      = %s\n", envOr("MOCK", "(unset)"))
	fmt.Printf("  DEVTOOLS                  = %s\n", envOr("DEVTOOLS", "(unset)"))
	fmt.Printf("  UI_INGRESS_PROXY_BODY_SIZE = %s\n", envOr("UI_INGRESS_PROXY_BODY_SIZE", "(unset)"))
	fmt.Printf("  RWX_SUPPORTED             = %s\n", envOr("RWX_SUPPORTED", "(unset)"))
	fmt.Printf("  AGENTIC_ENABLED           = %s\n", envOr("AGENTIC_ENABLED", "(unset)"))
	fmt.Printf("  AGENTIC_STEER_ENABLED     = %s\n", envOr("AGENTIC_STEER_ENABLED", "(unset)"))

	// TLS / CA bundle.
	fmt.Println("-- TLS / CA bundle --")
	fmt.Printf("  SSL_CERT_FILE = %s\n", envOr("SSL_CERT_FILE", "(not set — system default trust store)"))

	fmt.Println("=======================================")
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
