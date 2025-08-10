#!/bin/bash

. ./bin/utils.sh --source-only

if [[ -z $DRY_RUN ]]; then
  DRY_RUN=true
fi

log "running clean stale branches script"...

CURRENT_BRANCH=$(git branch --show-current)

if [[ $CURRENT_BRANCH != "main" ]] || [[ $CURRENT_BRANCH != "dev" ]]; then
  log "fetching and pruning"
  git fetch -p
fi

wasCleaned=false

protectedBranches=('main dev')

for branch in $(git branch -vv | grep ': gone]' | awk '{print $1}'); do
  if [[ $DRY_RUN == true ]]; then
    log "(dry run) will delete branch: $branch"
    wasCleaned=true
  else
    git branch -D $branch
    wasCleaned=true
  fi
done

if [[ $wasCleaned == false ]]; then
  log "no stale branches were removed"
fi

log ""
