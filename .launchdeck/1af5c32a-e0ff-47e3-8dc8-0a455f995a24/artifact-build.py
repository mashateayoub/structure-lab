#!/usr/bin/env python3
"""Build Compose images on the agent and package a content-verified release."""
import json
import base64
import os
import re
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

workspace=Path.cwd().resolve()
sha=os.environ['DEPLOY_SHA']
archive=workspace/'.launchdeck-compose-source.tar.gz'
base=['docker','compose','--project-name','launchdeck-1af5c32a-e0ff-47e3-8dc8-0a455f995a24','--profile','launchdeck-operations']
env=dict(os.environ,DOCKER_DEFAULT_PLATFORM='linux/amd64')

def run(args, **kwargs):
    return subprocess.check_output(args,env=env,text=True,**kwargs).strip()

with tempfile.TemporaryDirectory(prefix='launchdeck-artifact-') as temporary:
    root=Path(temporary)/'source';root.mkdir()
    with tarfile.open(archive) as bundle:
        bundle.extractall(root, filter='data')
    (root/'.env.production').write_text('' if os.environ.get('RUNTIME_ENV') == '__LAUNCHDECK_UNMANAGED_RUNTIME_ENV__' else os.environ.get('RUNTIME_ENV',''))
    (root/'.env.production').chmod(0o600)
    for line in os.environ.get('BUILD_SECRETS','').splitlines():
        if not line.strip() or line.lstrip().startswith('#'): continue
        name,value=line.split('=',1)
        env["LAUNCHDECK_BUILD_"+name]=value
    config_file=root/'resolved.json'
    compose=base+['--project-directory',str(root),'--env-file',str(root/'.env.production'),'-f',str(root/'compose.yaml')]
    config_file.write_text(run(compose+['config','--format','json']))
    prepare=[sys.executable,str(workspace/'.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/compose-prepare.py'),str(root),str(config_file),'app','5000','8080','launchdeck-1af5c32a-e0ff-47e3-8dc8-0a455f995a24',sha,'false',str(Path(temporary)/'ignore'),'http','{"services":["app"],"serviceChecks":[]}','[]','[]']
    subprocess.check_call(prepare,env=env)
    compose+=['-f',str(root/'.launchdeck-images.yaml')]
    actual=run(['docker','info','--format','{{.Architecture}}'])
    compatible={'linux/amd64':('x86_64','amd64'),'linux/arm64':('aarch64','arm64')}
    if actual not in compatible['linux/amd64']:
        raise SystemExit('Build agent architecture differs from target; provision a matching agent. No implicit emulation is enabled.')
    host=''
    env['DOCKER_CONFIG']=str(Path(temporary)/'docker')
    Path(env['DOCKER_CONFIG']).mkdir()
    if host:
        subprocess.run(['docker','login',host,'--username',os.environ['REGISTRY_USER'],'--password-stdin'],input=os.environ['REGISTRY_PASSWORD'],text=True,env=env,check=True,stdout=subprocess.DEVNULL)
    args=json.loads(base64.b64decode('e30='))
    flags=[flag for name,value in args.items() for flag in ('--build-arg',f'{name}={value}')]
    subprocess.check_call(compose+['build','--pull']+flags,env=env)
    subprocess.check_call(compose+['pull','--ignore-buildable'],env=env)
    resolved=json.loads(run(compose+['config','--format','json']))
    override=json.loads((root/'.launchdeck-images.yaml').read_text())
    manifest={'schema':1,'sha':sha,'platform':'linux/amd64','services':{}}
    images=[]
    for name,service in resolved['services'].items():
        image=service['image']
        info=json.loads(run(['docker','image','inspect',image]))[0]
        if info['Architecture'] not in compatible['linux/amd64']:
            raise SystemExit(f'Image architecture mismatch: {name}')
        checks={check['service']:check['readiness'] for check in json.loads('{"services":["app"],"serviceChecks":[]}').get('serviceChecks',[])}
        health=service.get('healthcheck') or info.get('Config',{}).get('Healthcheck')
        if checks.get(name)=='healthy' and (not health or health.get('disable') or health.get('test',health.get('Test'))==['NONE']):
            raise SystemExit(f'Required healthy service has no healthcheck: {name}')
        if host and service.get('build'):
            tag_part=re.sub(r'[^a-z0-9_-]+','-',name.lower()).strip('-_')
            target=f"{host}//launchdeck-1af5c32a-e0ff-47e3-8dc8-0a455f995a24-{tag_part}:{sha}"
            subprocess.check_call(['docker','tag',image,target],env=env)
            subprocess.check_call(['docker','push',target],env=env)
            info=json.loads(run(['docker','image','inspect',target]))[0]
        reference=info['Id']
        override['services'].setdefault(name,{})['image']=reference
        manifest['services'][name]={'image':reference,'id':info['Id'],'source':(info.get('RepoDigests') or [info['Id']])[0]}
        images.append(info['Id'])
    (root/'.launchdeck-images.yaml').write_text(json.dumps(override))
    (root/'.launchdeck-release.json').write_text(json.dumps(manifest))
    subprocess.check_call(['docker','save','-o',str(workspace/'.launchdeck-images.tar')]+sorted(set(images)),env=env)
    # The source archive contains no interpolated config, runtime variables or secret values.
    config_file.unlink();(root/'.env.production').unlink()
    subprocess.check_call([sys.executable,str(workspace/'.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/compose-prepare.py'),'restore',str(root),str(Path(temporary)/'ignore')],env=env)
    with tarfile.open(archive,'w:gz') as bundle:
        for path in root.iterdir(): bundle.add(path,arcname=path.name)
    (workspace/'.launchdeck-release.json').write_text(json.dumps(manifest))
    print('Content-verified release prepared:',sha)
