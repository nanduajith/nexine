#!/bin/bash
get_sha() {
  repo=$1
  tag=$2
  echo "$repo@$tag: $(git ls-remote https://github.com/$repo refs/heads/$tag refs/tags/$tag | awk '{print $1}')"
}
get_sha "actions/checkout" "v4" &
get_sha "pnpm/action-setup" "v4" &
get_sha "actions/setup-node" "v4" &
get_sha "dtolnay/rust-toolchain" "stable" &
get_sha "taiki-e/install-action" "cargo-audit" &
get_sha "github/codeql-action" "v3" &
get_sha "gitleaks/gitleaks-action" "v2" &
get_sha "actions/setup-python" "v5" &
get_sha "aquasecurity/trivy-action" "master" &
wait
