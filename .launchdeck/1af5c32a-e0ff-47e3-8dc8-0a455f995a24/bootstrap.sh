#!/usr/bin/env bash
set -Eeuo pipefail
fail() { echo "Launchdeck host setup: $*" >&2; exit 1; }
command -v sudo >/dev/null || fail "sudo is required to prepare this host."
sudo -n true || fail "the SSH user must have passwordless sudo for first-time setup."
[[ -r /etc/os-release ]] || fail "cannot identify this Linux distribution."
. /etc/os-release
id="${ID:-}"
version="${VERSION_ID:-}"
arch="$(uname -m)"
case "$arch" in x86_64|aarch64) ;; *) fail "unsupported CPU architecture: $arch" ;; esac
if [[ 'linux/amd64' == linux/amd64 && $arch != x86_64 ]] || [[ 'linux/amd64' == linux/arm64 && $arch != aarch64 ]]; then
  fail "project architecture linux/amd64 differs from this EC2 host ($arch)."
fi

needs_install=0
if ! command -v docker >/dev/null 2>&1 || ! sudo docker compose version >/dev/null 2>&1 || ! command -v curl >/dev/null 2>&1 || ! command -v flock >/dev/null 2>&1 || ! command -v ss >/dev/null 2>&1 || ! command -v python3 >/dev/null 2>&1; then
  needs_install=1
fi

if [[ $needs_install == 1 ]]; then
case "$id" in
  ubuntu|debian)
    codename="${UBUNTU_CODENAME:-${VERSION_CODENAME:-}}"
    [[ -n $codename ]] || fail "could not determine the Ubuntu/Debian release codename."
    sudo apt-get update
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl gnupg util-linux iproute2 bash python3
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL "https://download.docker.com/linux/$id/gpg" | sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/%s %s stable\n' "$(dpkg --print-architecture)" "$id" "$codename" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
    sudo apt-get update
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    ;;
  amzn)
    if [[ $version == 2 || $version == 2.* ]]; then
      command -v amazon-linux-extras >/dev/null || fail "Amazon Linux Extras is unavailable."
      sudo amazon-linux-extras install docker -y
      sudo yum install -y curl util-linux iproute bash python3
    elif [[ $version == 2023* ]]; then
      sudo dnf install -y docker util-linux iproute bash python3
      command -v curl >/dev/null || sudo dnf install -y curl-minimal
    else
      fail "unsupported Amazon Linux version: $version"
    fi
    if ! sudo docker compose version >/dev/null 2>&1; then
      tmp="$(mktemp)"
      checksums="$(mktemp)"
      trap 'rm -f "$tmp" "$checksums"' EXIT
      curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$arch" -o "$tmp"
      curl -fsSL https://github.com/docker/compose/releases/latest/download/checksums.txt -o "$checksums"
      expected="$(awk -v file="docker-compose-linux-$arch" '$2 == file || $2 == "*" file { print $1; exit }' "$checksums")"
      [[ $expected =~ ^[a-f0-9]{64}$ ]] || fail "could not verify the Docker Compose download checksum."
      printf '%s  %s\n' "$expected" "$tmp" | sha256sum --check --status || fail "Docker Compose checksum verification failed."
      sudo install -D -m 0755 "$tmp" /usr/local/lib/docker/cli-plugins/docker-compose
      rm -f "$tmp"
      rm -f "$checksums"
      trap - EXIT
    fi
    ;;
  *) fail "unsupported distribution '$id'. Supported: Ubuntu, Debian, Amazon Linux 2 and 2023." ;;
esac
fi

sudo systemctl enable --now docker
builder_version="$(sudo docker buildx version 2>/dev/null | awk '{sub(/^v/, "", $2); print $2}' || true)"
if [[ ! $builder_version =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]] ||
   [[ "$(printf '%s\n' 0.17.0 "$builder_version" | sort -V | head -n 1)" != 0.17.0 ]]; then
  # Amazon Linux's Docker package can omit Buildx even when Compose is present.
  # Extract the plugin from Docker's official CLI image without running it.
  builder_container="$(sudo docker create docker:cli)"
  builder_tmp="$(mktemp -d)"
  trap 'sudo docker rm "$builder_container" >/dev/null 2>&1 || true; rm -rf "$builder_tmp"' EXIT
  sudo docker cp "$builder_container:/usr/local/libexec/docker/cli-plugins/docker-buildx" "$builder_tmp/docker-buildx"
  sudo install -D -m 0755 "$builder_tmp/docker-buildx" /usr/local/lib/docker/cli-plugins/docker-buildx
  sudo docker rm "$builder_container" >/dev/null
  rm -rf "$builder_tmp"
  trap - EXIT
fi
sudo docker buildx version >/dev/null || fail "Docker Buildx installation failed."
sudo usermod -aG docker "$(id -un)"

proxy_dir="$HOME/.launchdeck/proxy"
mkdir -p "$proxy_dir/sites" "$proxy_dir/data" "$proxy_dir/config"
exec 8>"$proxy_dir/bootstrap.lock"
flock -w 300 8
if [[ ! -f "$proxy_dir/compose.yaml" ]]; then
  if sudo ss -ltnH | awk '$4 ~ /:80$/ || $4 ~ /:443$/ { found=1 } END { exit !found }'; then
    fail "ports 80 or 443 are already in use. Configure the existing reverse proxy for lab.mashateayoub.com to 127.0.0.1:5000, then remove the Launchdeck proxy bootstrap from this project."
  fi
  cat >"$proxy_dir/compose.yaml" <<'COMPOSE'
services:
  caddy:
    image: caddy:2-alpine
    network_mode: host
    restart: unless-stopped
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./sites:/etc/caddy/sites:ro
      - ./data:/data
      - ./config:/config
COMPOSE
  cat >"$proxy_dir/Caddyfile" <<'CADDY'
import /etc/caddy/sites/*.caddy
CADDY
fi
mkdir -p "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.deployment"
if [[ -f "$proxy_dir/sites/1af5c32a-e0ff-47e3-8dc8-0a455f995a24.caddy" ]]; then
  cp "$proxy_dir/sites/1af5c32a-e0ff-47e3-8dc8-0a455f995a24.caddy" "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.deployment/proxy.previous"
  printf 1 >"$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.deployment/proxy.was-present"
else
  printf 0 >"$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.deployment/proxy.was-present"
fi
cat >"$proxy_dir/sites/1af5c32a-e0ff-47e3-8dc8-0a455f995a24.caddy.tmp" <<'SITE'
https://lab.mashateayoub.com {
  reverse_proxy 127.0.0.1:5000
}
SITE
mv "$proxy_dir/sites/1af5c32a-e0ff-47e3-8dc8-0a455f995a24.caddy.tmp" "$proxy_dir/sites/1af5c32a-e0ff-47e3-8dc8-0a455f995a24.caddy"
sudo docker compose --project-name launchdeck-proxy --project-directory "$proxy_dir" --file "$proxy_dir/compose.yaml" up -d
sudo docker compose --project-name launchdeck-proxy --project-directory "$proxy_dir" --file "$proxy_dir/compose.yaml" exec -T caddy caddy reload --config /etc/caddy/Caddyfile

sudo install -d -m 0750 -o "$(id -un)" -g "$(id -gn)" "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24"
sudo docker compose version >/dev/null
command -v curl >/dev/null || fail "curl installation failed."
command -v flock >/dev/null || fail "flock (util-linux) installation failed."
command -v python3 >/dev/null || fail "python3 installation failed."
echo "Launchdeck host setup complete. Docker group access is active on the next SSH connection."
