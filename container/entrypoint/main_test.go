package main

import (
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeCAFixture(t *testing.T, dir, name, content string) string {
	t.Helper()
	path := filepath.Join(dir, name)
	if err := os.WriteFile(path, []byte(content), 0600); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestAssembleCAPreservesPublicAndMountedTrust(t *testing.T) {
	dir := t.TempDir()
	public := writeCAFixture(t, dir, "public.pem", "public-roots")
	cluster := writeCAFixture(t, dir, "cluster.pem", "cluster-root")
	custom := writeCAFixture(t, dir, "custom.pem", "custom-root\n")

	bundle, err := assembleCA(public, []string{
		"", filepath.Join(dir, "absent.pem"), cluster, custom,
	}, dir)
	if err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(bundle)
	if err != nil {
		t.Fatal(err)
	}
	if got, want := string(data), "public-roots\ncluster-root\ncustom-root\n\n"; got != want {
		t.Fatalf("bundle = %q, want %q", got, want)
	}
	info, err := os.Stat(bundle)
	if err != nil {
		t.Fatal(err)
	}
	if got := info.Mode().Perm(); got != 0600 {
		t.Fatalf("bundle permissions = %o, want 600", got)
	}

	second, err := assembleCA(public, nil, dir)
	if err != nil {
		t.Fatal(err)
	}
	if second == bundle {
		t.Fatal("bundle paths must be unique, including across container UIDs")
	}
	data, err = os.ReadFile(second)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "public-roots\n" {
		t.Fatalf("public-only bundle = %q", data)
	}
}

func TestAssembleCARejectsIncompleteTrust(t *testing.T) {
	for _, name := range []string{"missing-public", "unreadable-source", "source-read-error", "destination-error"} {
		t.Run(name, func(t *testing.T) {
			dir := t.TempDir()
			public := writeCAFixture(t, dir, "public.pem", "public-roots")
			var sources []string
			destDir := dir
			switch name {
			case "missing-public":
				public = filepath.Join(dir, "absent.pem")
			case "unreadable-source":
				if os.Geteuid() == 0 {
					t.Skip("root bypasses file read permissions")
				}
				source := writeCAFixture(t, dir, "unreadable.pem", "cluster-root")
				if err := os.Chmod(source, 0000); err != nil {
					t.Fatal(err)
				}
				sources = []string{source}
			case "source-read-error":
				// Opening a directory succeeds; copying its contents must fail.
				sources = []string{dir}
			case "destination-error":
				destDir = public
			}

			bundle, err := assembleCA(public, sources, destDir)
			if err == nil || bundle != "" {
				t.Fatalf("assembleCA = (%q, %v), want empty path and error", bundle, err)
			}
			entries, err := os.ReadDir(dir)
			if err != nil {
				t.Fatal(err)
			}
			for _, entry := range entries {
				if strings.HasPrefix(entry.Name(), "tackle-ui-ca-") {
					t.Fatalf("partial bundle left behind: %s", entry.Name())
				}
			}
		})
	}
}

type shortCAWriter struct {
	remaining int
}

func (w *shortCAWriter) Write(p []byte) (int, error) {
	if len(p) > w.remaining {
		n := w.remaining
		w.remaining = 0
		return n, io.ErrShortWrite
	}
	w.remaining -= len(p)
	return len(p), nil
}

func TestAppendCARejectsPartialWrites(t *testing.T) {
	dir := t.TempDir()
	source := writeCAFixture(t, dir, "source.pem", "roots")
	for _, limit := range []int{2, len("roots")} {
		// Cover failure both while copying a source and appending its separator.
		err := appendCA(&shortCAWriter{remaining: limit}, source, false)
		if !errors.Is(err, io.ErrShortWrite) {
			t.Fatalf("write limit %d: error = %v, want io.ErrShortWrite", limit, err)
		}
	}
}
