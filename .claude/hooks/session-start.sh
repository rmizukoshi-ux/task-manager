#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# This is a static HTML project with no build dependencies.
# Verify the main file is present.
if [ ! -f "$CLAUDE_PROJECT_DIR/index.html" ]; then
  echo "WARNING: index.html not found in $CLAUDE_PROJECT_DIR" >&2
  exit 1
fi

echo "Session ready: static HTML project at $CLAUDE_PROJECT_DIR"
