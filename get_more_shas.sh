#!/bin/bash
get_sha() {
  repo=$1
  tag=$2
  echo "$repo@$tag: $(git ls-remote https://github.com/$repo refs/heads/$tag refs/tags/$tag | awk '{print $1}')"
}
get_sha "actions/configure-pages" "v5" &
get_sha "actions/upload-pages-artifact" "v3" &
get_sha "actions/deploy-pages" "v4" &
get_sha "swatinem/rust-cache" "v2" &
get_sha "tauri-apps/tauri-action" "v0" &
get_sha "docker/login-action" "v3" &
get_sha "docker/build-push-action" "v6" &
wait
