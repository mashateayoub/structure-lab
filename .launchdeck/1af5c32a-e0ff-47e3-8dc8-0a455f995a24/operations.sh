#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
root="$HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24"
operation=${1:-backup}
backup_id=${2:-}
[[ $operation == backup || $operation == verify-backup || $operation == restore ]] || exit 2
[[ -z $backup_id || $backup_id =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$ ]] || exit 2
mkdir -p "$root/.deployment"
exec 9>"$root/.deployment/lock"
flock -w 300 9
sha=$(cat "$root/.deployment/current")
[[ $sha =~ ^[a-f0-9]{40}$ ]] || { echo 'Database jobs require a deployed Compose release.' >&2; exit 2; }
release="$root/.releases/$sha"
compose_file=$(cat "$root/.deployment/compose-file-$sha")
[[ $compose_file =~ ^[A-Za-z0-9_./-]+\.ya?ml$ ]] || exit 2
resolved=$(realpath -e "$release/$compose_file")
[[ $resolved == "$release/"* ]] || exit 2
service=''
case "$operation" in
  backup) service=''; backup_id=${backup_id:-$(date -u +%Y%m%dT%H%M%SZ)-${sha:0:12}} ;;
  verify-backup) service='' ;;
  restore) service=''; [[ -n $backup_id && ${3:-false} == true ]] || { echo 'Restore requires a backup ID and explicit confirmation.' >&2; exit 2; } ;;
esac
[[ -n $service ]] || { echo 'Configure the corresponding Compose database job first.' >&2; exit 2; }
if [[ -z $backup_id && -f $root/.deployment/last-backup ]]; then backup_id=$(cat "$root/.deployment/last-backup"); fi
[[ $backup_id =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$ ]] || exit 2
record() { printf '{"operation":"%s","service":"%s","backupId":"%s","state":"%s","at":"%s"}\n' "$operation" "$service" "$backup_id" "$1" "$(date -u +%FT%TZ)" >>"$root/.deployment/operations.jsonl"; }
record running
trap 'record failed' ERR
if [[ $operation == restore ]]; then
  echo 'Explicit database restore requested. This does not roll back the application or its schema automatically.'
fi
docker compose --project-name 'launchdeck-1af5c32a-e0ff-47e3-8dc8-0a455f995a24' --project-directory "$release" --env-file "$release/.env.production" --file "$resolved" --file "$release/.launchdeck-images.yaml" --profile launchdeck-operations run --rm --no-deps -e "LAUNCHDECK_BACKUP_ID=$backup_id" "$service"
if [[ $operation == backup ]]; then
  verifier=''
  [[ -n $verifier ]] || { echo 'A backup verification service is required.' >&2; record failed; exit 2; }
  docker compose --project-name 'launchdeck-1af5c32a-e0ff-47e3-8dc8-0a455f995a24' --project-directory "$release" --env-file "$release/.env.production" --file "$resolved" --file "$release/.launchdeck-images.yaml" --profile launchdeck-operations run --rm --no-deps -e "LAUNCHDECK_BACKUP_ID=$backup_id" "$verifier"
  printf '%s\n' "$backup_id" >"$root/.deployment/last-backup"
fi
record succeeded
trap - ERR
echo "Database operation $operation completed for backup $backup_id"
