#!/bin/bash

while true; do
  read -p "Do you want to prune old git branches? (Don't worry, this won't delete any branches you're still working on)" yn
  case $yn in
  [Yy]*)
    pnpm branches:stale
    break
    ;;
  [Nn]*) exit ;;
  *) echo "Please answer yes or no." ;;
  esac
done
