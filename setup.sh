#!/usr/bin/env bash

# Start the anthroproxy bridge in the background
npx -y anthroproxy \
  --target-url "https://deepseek-free-api-xyvk.onrender.com/v1" \
  --api-key "dummy" \
  --port 8080 &