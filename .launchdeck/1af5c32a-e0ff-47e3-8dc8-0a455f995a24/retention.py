#!/usr/bin/env python3
"""Delete only managed, inactive releases; never prune volumes or unrelated images."""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
root=Path(sys.argv[1]).resolve();count=max(2,int(sys.argv[2]))
current=(root/'.deployment/current').read_text().strip()
releases=sorted([p for p in (root/'.releases').iterdir() if p.is_dir() and not p.is_symlink() and re.fullmatch('[a-f0-9]{40}',p.name) and (p/'.launchdeck-release.json').is_file()],key=lambda p:p.stat().st_mtime,reverse=True)
keep={p.name for p in releases[:count]}|{current}
containers=subprocess.check_output(['docker','ps','-aq'],text=True).split()
used=set();mounts=[]
if containers:
    for item in json.loads(subprocess.check_output(['docker','inspect']+containers,text=True)):
        used.add(item.get('Image'))
        mounts.extend(Path(m['Source']).resolve() for m in item.get('Mounts',[]) if m.get('Type')=='bind')
removed_images=set()
for path in releases:
    if path.name in keep or any(path==source or path in source.parents for source in mounts): continue
    manifest=json.loads((path/'.launchdeck-release.json').read_text())
    if any(item['id'] in used for item in manifest['services'].values()): continue
    # A remaining release may share the same base image. Keep image storage conservatively.
    removed_images.update(item["id"] for item in manifest["services"].values())
    shutil.rmtree(path)
    print('Removed inactive release directory',path.name)
remaining_images=set(used)
for path in (root/'.releases').iterdir():
    if (path/'.launchdeck-release.json').is_file():
        remaining_images.update(item['id'] for item in json.loads((path/'.launchdeck-release.json').read_text())['services'].values())
# Removal without --force preserves images referenced by any other tag/container.
for image in removed_images-remaining_images:
    try:
        info=json.loads(subprocess.check_output(['docker','image','inspect',image],text=True))[0]
        if any(not tag.startswith('launchdeck-1af5c32a-e0ff-47e3-8dc8-0a455f995a24-') for tag in info.get('RepoTags') or []): continue
        subprocess.run(['docker','image','rm',image],check=False,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        pass
