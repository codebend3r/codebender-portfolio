#!/bin/bash

. ./bin/utils.sh --source-only

git --no-pager log --decorate --oneline -n 10

log "pushed successfully"
