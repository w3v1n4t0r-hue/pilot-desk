#!/usr/bin/env bash
set -euo pipefail

# Vercel semantics: exit 0 = skip this build, exit 1 = continue building.
# Only skip commits that cannot change the deployed website. This keeps production
# builds for real site/API/config changes while preventing QA/workflow/docs-only
# commits from consuming Hobby deployment quota.

previous="${VERCEL_GIT_PREVIOUS_SHA:-}"
current="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

if [[ -z "$previous" ]]; then
  echo "No previous successful deployment SHA available; build required."
  exit 1
fi

if ! git cat-file -e "${previous}^{commit}" 2>/dev/null; then
  echo "Previous deployment SHA is unavailable in checkout; build required."
  exit 1
fi

changed="$(git diff --name-only "$previous" "$current" -- || true)"
if [[ -z "$changed" ]]; then
  echo "No deployed-file changes detected; skipping build."
  exit 0
fi

echo "Files changed since last successful deployment:"
printf '%s\n' "$changed"

# These paths are repository automation/test/documentation only. Everything else
# is treated as production-affecting and gets a real deployment.
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  case "$file" in
    .github/*|qa/*|*.md|CITATION.cff)
      ;;
    *)
      echo "Production-affecting change detected: $file"
      exit 1
      ;;
  esac
done <<< "$changed"

echo "Only workflow, QA, or repository-documentation files changed; skipping Vercel build."
exit 0
