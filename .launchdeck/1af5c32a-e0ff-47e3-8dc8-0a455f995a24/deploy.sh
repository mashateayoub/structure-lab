#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
cd "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24"
mkdir -p .deployment
exec 9>.deployment/lock
flock -w 300 9
sha=$1
staging=$2
[[ $staging =~ ^[0-9]+-[0-9]+$ ]] || exit 2
root="$PWD"
cp "$root/.incoming-$staging/readiness.py" "$root/readiness.py"
policy='{"services":["app"],"serviceChecks":[]}'
candidate="$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.incoming-$staging/compose.yaml"
[[ $sha =~ ^[a-f0-9]{40}$ ]] || exit 2
export IMAGE_REF='launchdeck-1af5c32a-e0ff-47e3-8dc8-0a455f995a24':"$sha"
touch .env.production
cleanup() { rm -rf "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.incoming-$staging"; }
trap cleanup EXIT
compose() { docker compose --file "$candidate" --project-directory "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24" "$@"; }
health_url='http://127.0.0.1:5000/'
previous_health=$health_url
if [[ -f .deployment/health ]]; then previous_health=$(cat .deployment/health); fi
[[ $previous_health == http://127.0.0.1:* || $previous_health == none ]] || exit 2
previous_policy=$(cat .deployment/readiness.json 2>/dev/null || printf '{}')
previous=''
previous_mode=dockerfile
previous_compose_sha=''
if [[ -f .deployment/current ]]; then
  previous=$(cat .deployment/current)
  if [[ $previous =~ ^[a-f0-9]{40}$ ]]; then
    previous_mode=compose
    previous_compose_sha=$previous
  elif [[ $previous =~ ^launchdeck-1af5c32a-e0ff-47e3-8dc8-0a455f995a24:[a-f0-9]{40}$ ]]; then
    previous_mode=dockerfile
  else
    exit 2
  fi
fi
compose_previous() {
  local old_release="$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.releases/$previous_compose_sha"
  local old_compose_file
  [[ -f $HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.deployment/compose-file-$previous_compose_sha ]] || return 1
  cp "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.env.production" "$old_release/.env.production"
  chmod 600 "$old_release/.env.production"
  old_compose_file=$(cat "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.deployment/compose-file-$previous_compose_sha")
  [[ $old_compose_file =~ ^[A-Za-z0-9_./-]+\.ya?ml$ ]] || return 1
  old_release=$(realpath -e "$old_release")
  local resolved_compose_file
  resolved_compose_file=$(realpath -e "$old_release/$old_compose_file")
  [[ $resolved_compose_file == "$old_release/"* ]] || return 1
  docker compose --project-name 'launchdeck-1af5c32a-e0ff-47e3-8dc8-0a455f995a24' \
    --env-file "$old_release/.env.production" \
    --project-directory "$old_release" \
    --file "$old_release/$old_compose_file" \
    --file "$old_release/.launchdeck-images.yaml" "$@"
}
compose config --quiet
docker image inspect "$IMAGE_REF" >/dev/null
# Each readiness check has its own wall-clock budget, including rollback recovery.
wait_for_http() {
  local url=$1
  [[ $url == none ]] && return 0
  local deadline=$((SECONDS + 210))
  local remaining request_timeout
  while (( SECONDS < deadline )); do
    remaining=$((deadline - SECONDS))
    request_timeout=5
    if (( remaining < request_timeout )); then request_timeout=$remaining; fi
    if curl --fail --silent --max-time "$request_timeout" "$url" >/dev/null; then return 0; fi
    remaining=$((deadline - SECONDS))
    if (( remaining > 2 )); then sleep 2;
    elif (( remaining > 0 )); then sleep "$remaining"; fi
  done
  echo "HTTP readiness timed out after 210 seconds: $url" >&2
  return 1
}

wait_for_services() {
  local policy=$1
  local command=${2:-compose}
  local deadline=$((SECONDS + 210))
  local state result
  while (( SECONDS < deadline )); do
    state=$("$command" ps --all --format json) || return 1
    if python3 "$root/readiness.py" "$policy" "$state"; then return 0; else result=$?; fi
    if [[ $result != 2 ]]; then return 1; fi
    sleep 2
  done
  echo 'Required service readiness deadline exceeded.' >&2
  return 1
}

restore_proxy() {
  local saved="$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.deployment/proxy.previous"
  local sites="$HOME/.launchdeck/proxy/sites"
  if [[ -f $saved && -d $sites && -f "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.deployment/proxy.was-present" && $(cat "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.deployment/proxy.was-present") == 1 ]]; then
    cp "$saved" "$sites/1af5c32a-e0ff-47e3-8dc8-0a455f995a24.caddy"
    docker compose --project-name launchdeck-proxy --project-directory "$HOME/.launchdeck/proxy" --file "$HOME/.launchdeck/proxy/compose.yaml" exec -T caddy caddy reload --config /etc/caddy/Caddyfile || true
  elif [[ -f "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.deployment/proxy.was-present" && $(cat "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.deployment/proxy.was-present") == 0 ]]; then
    rm -f "$sites/1af5c32a-e0ff-47e3-8dc8-0a455f995a24.caddy"
    docker compose --project-name launchdeck-proxy --project-directory "$HOME/.launchdeck/proxy" --file "$HOME/.launchdeck/proxy/compose.yaml" exec -T caddy caddy reload --config /etc/caddy/Caddyfile || true
  fi
}

rollback() {
  trap - ERR INT TERM
  restore_proxy
  if [[ $previous_mode == compose && -n $previous_compose_sha ]]; then
    if compose_previous up -d --no-build --pull never --remove-orphans && wait_for_services "$(cat "$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.releases/$previous_compose_sha/.launchdeck-policy.json" 2>/dev/null || printf '{}')" compose_previous && wait_for_http "$previous_health"; then
      echo "Previous Compose release $previous_compose_sha restored." >&2
    else
      echo 'ROLLBACK FAILED: previous Compose release did not recover.' >&2
    fi
  elif [[ -n $previous ]]; then
    export IMAGE_REF=$previous
    candidate="$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/compose.yaml"
    if compose up -d --no-deps --pull never app && wait_for_services "$previous_policy" && wait_for_http "$previous_health"; then
      echo 'Previous image restored.' >&2
    else
      echo 'ROLLBACK FAILED: inspect the EC2 container.' >&2
    fi
  else
    compose stop app || true
    echo 'No previous successful image exists.' >&2
  fi
  exit 1
}
trap rollback ERR INT TERM
if [[ $previous_mode == compose ]]; then
  compose_previous down
fi
compose up -d --no-deps --pull never app
if ! wait_for_services "$policy" || ! wait_for_http "$health_url"; then
  echo "Health check failed for $health_url; recent container output follows:" >&2
  compose ps >&2 || true
  compose logs --no-color --tail=80 app >&2 || true
  rollback
fi
if ! wait_for_http 'https://lab.mashateayoub.com/'; then
  echo "Public health check failed; recent container output follows:" >&2
  compose ps >&2 || true
  compose logs --no-color --tail=80 app >&2 || true
  rollback 1
fi

if [[ -n $previous && $previous != "$IMAGE_REF" ]]; then
  printf '%s\n' "$previous" >.deployment/previous.tmp
  mv .deployment/previous.tmp .deployment/previous
fi
printf '%s\n' "$health_url" >.deployment/health.tmp
mv .deployment/health.tmp .deployment/health
cp "$candidate" compose.yaml.tmp
mv compose.yaml.tmp compose.yaml
printf '%s\n' "$policy" >.deployment/readiness.json
printf '%s\n' dockerfile >.deployment/mode.tmp
mv .deployment/mode.tmp .deployment/mode
printf '%s\n' "$IMAGE_REF" >.deployment/current.tmp
mv .deployment/current.tmp .deployment/current
trap - ERR INT TERM
echo "Deployed $IMAGE_REF"
