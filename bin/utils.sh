#!/usr/bin/env bash

# Color definitions
NC='\033[0m'       # No Color
RED='\033[1;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
CYAN='\033[1;36m'
MAGENTA='\033[1;35m'

# Generic color logger
log_color() {
  local COLOR=$1
  local MESSAGE=$2

  printf "${COLOR} ${MESSAGE} ${NC}\n"
}

# Specific log functions
log() {
  log_color "$GREEN" "$1"
}

warning() {
  log_color "$RED" "$1"
}

info() {
  log_color "$CYAN" "$1"
}

note() {
  log_color "$YELLOW" "$1"
}

success() {
  log_color "$MAGENTA" "$1"
}
