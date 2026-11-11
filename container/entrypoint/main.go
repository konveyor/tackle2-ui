// Command entrypoint assembles public and cluster CA trust, then replaces itself
// with Caddy. The generated bundle is private to the current (possibly arbitrary)
// container UID and is inherited by Caddy through SSL_CERT_FILE.
package main

import (
	"fmt"
	"io"
	"os"
	"syscall"
)

const (
	// Kubernetes service-account certificate sources.
	kubeAPICert   = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
	serviceCACert = "/var/run/secrets/kubernetes.io/serviceaccount/service-ca.crt"

	// Public trust is copied into the hardened runtime image at build time.
	systemCACert = "/etc/ssl/certs/ca-certificates.crt"

	// Optional operator-mounted custom ingress trust.
	ingressCACert = "/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem"

	caddyBin    = "/usr/bin/caddy"
	caddyConfig = "/etc/caddy/Caddyfile"
)

func main() {
	validateEnv()
	bundle, err := assembleCA(systemCACert, []string{
		os.Getenv("SSL_CERT_FILE"), kubeAPICert, serviceCACert, ingressCACert,
	}, os.TempDir())
	if err != nil {
		fatal(fmt.Sprintf("failed to assemble CA trust: %v", err))
	}
	if err := os.Setenv("SSL_CERT_FILE", bundle); err != nil {
		fatal(fmt.Sprintf("failed to set SSL_CERT_FILE: %v", err))
	}
	if os.Getenv("DEBUG") == "1" {
		logConfig()
	}

	// Exec the actual runtime binary so signals reach Caddy directly.
	argv := []string{caddyBin, "run", "--config", caddyConfig, "--adapter", "caddyfile"}
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
	fmt.Printf("  KEYCLOAK_SERVER_URL = %s\n", envOr("KEYCLOAK_SERVER_URL", "(unset — legacy proxy disabled)"))

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

// assembleCA always includes public roots before optional mounted CA sources.
// Only absent optional files are skipped; any other I/O failure aborts startup
// rather than silently starting with incomplete trust.
func assembleCA(systemBundle string, sources []string, destDir string) (string, error) {
	dest, err := os.CreateTemp(destDir, "tackle-ui-ca-*.crt")
	if err != nil {
		return "", fmt.Errorf("create CA bundle: %w", err)
	}
	complete := false
	defer func() {
		if !complete {
			dest.Close()
			os.Remove(dest.Name())
		}
	}()

	if err := appendCA(dest, systemBundle, false); err != nil {
		return "", err
	}
	for _, source := range sources {
		if source == "" {
			continue
		}
		if err := appendCA(dest, source, true); err != nil {
			return "", err
		}
	}
	if err := dest.Close(); err != nil {
		return "", fmt.Errorf("close CA bundle: %w", err)
	}
	complete = true
	return dest.Name(), nil
}

func appendCA(dest io.Writer, source string, optional bool) error {
	src, err := os.Open(source)
	if err != nil {
		if optional && os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("open CA source %s: %w", source, err)
	}
	_, copyErr := io.Copy(dest, src)
	closeErr := src.Close()
	if copyErr != nil {
		return fmt.Errorf("copy CA source %s: %w", source, copyErr)
	}
	if closeErr != nil {
		return fmt.Errorf("close CA source %s: %w", source, closeErr)
	}
	// PEM files need not end in a newline; keep adjacent blocks separate.
	if _, err := io.WriteString(dest, "\n"); err != nil {
		return fmt.Errorf("separate CA source %s: %w", source, err)
	}
	return nil
}

func fatal(msg string) {
	fmt.Fprintln(os.Stderr, msg)
	os.Exit(1)
}
