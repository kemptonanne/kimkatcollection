Cleanup: delete plan files and audit for unnecessary files

1. Delete archived plan files in `.lovable/plan/`.
2. Delete `.lovable/plan.md` after this plan is approved.
3. Quick audit for other unnecessary files (old screenshots, unused components, empty directories, leftover migration files) and remove any found.
4. Run typecheck and build to confirm nothing is broken.

Note: `.lovable/project.json` is required project metadata and will be kept.