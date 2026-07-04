#!/bin/sh
# HOSTNAME is a reserved key in run.envVariables and start: is exec'd
# without a shell — export it here to force the 0.0.0.0 bind.
export HOSTNAME=0.0.0.0
exec node .next/standalone/server.js
