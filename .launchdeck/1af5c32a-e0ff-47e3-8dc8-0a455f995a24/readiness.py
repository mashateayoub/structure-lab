#!/usr/bin/env python3
"""Evaluate Compose ps output without exposing container environment or secrets."""
import json
import sys

policy = json.loads(sys.argv[1])
raw = sys.argv[2].strip()
try:
    rows = json.loads(raw) if raw.startswith('[') else [json.loads(line) for line in raw.splitlines() if line.strip()]
except (ValueError, TypeError):
    print('Invalid container state response', file=sys.stderr)
    raise SystemExit(1)
checks = {item['service']: item['readiness'] for item in policy.get('serviceChecks', [])}
expected = policy.get('services', []) or list({row.get('Service') for row in rows})
if not expected:
    print('No deployment services found', file=sys.stderr)
    raise SystemExit(2)
pending = []
for service in expected:
    containers = [row for row in rows if row.get('Service') == service]
    if not containers:
        pending.append(service + ': missing')
        continue
    for row in containers:
        state = str(row.get('State', '')).lower()
        health = str(row.get('Health', '')).lower()
        readiness = checks.get(service, 'healthy' if health else 'running')
        exit_code = int(row.get('ExitCode') or 0)
        if state in ('dead', 'removing') or (state == 'exited' and (readiness != 'completed' or exit_code != 0)):
            print(f'{service}: failed ({state}, exit {exit_code})', file=sys.stderr)
            raise SystemExit(1)
        ready = ((readiness == 'completed' and state == 'exited' and exit_code == 0) or
                 (readiness == 'running' and state == 'running') or
                 (readiness == 'healthy' and state == 'running' and health == 'healthy'))
        if not ready:
            pending.append(f'{service}: waiting for {readiness} ({state}, {health or "no healthcheck"})')
if pending:
    print('; '.join(pending), file=sys.stderr)
    raise SystemExit(2)
print('All required services are ready')
