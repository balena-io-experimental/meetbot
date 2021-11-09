#!/usr/bin/env bash

app=${BALENA_APP:-gh_vipulgupta2048/meetbot}

balena push "${app}" \
  --release-tag commit-sha "$(git rev-parse --short HEAD)"
