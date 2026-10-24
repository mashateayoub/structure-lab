#!/usr/bin/env python3
import json
import re
import subprocess
import sys
from pathlib import Path
root=Path(sys.argv[1]);sha=sys.argv[2]
manifest=json.loads((root/'.launchdeck-release.json').read_text())
override=json.loads((root/'.launchdeck-images.yaml').read_text())
if manifest.get('schema')!=1 or manifest.get('sha')!=sha or manifest.get('platform')!='linux/amd64':
    raise SystemExit('Invalid release manifest')
if set(override.get('services',{})) != set(manifest.get('services',{})):
    raise SystemExit('Release service set does not match image overrides')
allowed=json.loads('[]')
if 'http' != 'worker': allowed.append({'service':'app','appPort':5000,'containerPort':8080})
for service,item in manifest['services'].items():
    entry=override['services'][service]
    if set(entry)-{'image','ports'}: raise SystemExit('Unsafe release override')
    for port in entry.get('ports',[]):
        if set(port)-{'host_ip','published','target','protocol'} or port.get('host_ip')!='127.0.0.1' or port.get('protocol','tcp')!='tcp' or not any(route['service']==service and str(route['appPort'])==str(port.get('published')) and int(route['containerPort'])==port.get('target') for route in allowed):
            raise SystemExit('Release ingress differs from configured loopback bindings')
    image=item['image']
    if not re.fullmatch(r'(?:sha256:[a-f0-9]{64}|[a-z0-9][a-z0-9._:/-]*@sha256:[a-f0-9]{64})',image):
        raise SystemExit('Release images must be content-addressed')
    if override['services'].get(service,{}).get('image')!=image:
        raise SystemExit('Image override differs from release manifest')
    info=json.loads(subprocess.check_output(['docker','image','inspect',image],text=True))[0]
    if info['Id']!=item['id']:
        raise SystemExit('Loaded image differs from release manifest')
print('Release image content verified')
