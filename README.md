# GUNS frontend integration testing

This repository implements the four Jira-driven integration tests for `GUNSQA-85` to `GUNSQA-88`.

## Scope

- `GUNSQA-85`: certificate attachment preview should not fail because `router` is undefined
- `GUNSQA-86`: non-Excel files should be blocked before hitting the import preview API
- `GUNSQA-87`: download URLs must not expose `token=` query parameters
- `GUNSQA-88`: upload failure responses must not be shown as successful uploads

## Jira and Xray flow

1. Jira `Test` issues remain the source of truth for test design.
2. `config/xray-test-executions.json` maps each Jira Test to a stable Xray Test Execution.
3. Branches should use the `GUNSQA-xx-*` naming convention.
4. GitHub Actions resolves the Jira key from the branch, runs the mapped Playwright selector, and writes results back to Xray.
5. Assertion failures create or reuse a Jira Bug and post short machine evidence into Jira comments.

## Mapping note

This project keeps the field name `testClass` to stay compatible with the existing automation shape, but in this repository it is used as a Playwright `--grep` selector instead of a Java class name.

## Stable execution

All four integration tests currently reuse `GUNSQA-89` (`IT - stable integration execution`).

## Local run

Install dependencies and run one mapped test by selector:

```bash
npm install
npx playwright install chromium
python scripts/resolve_test_context.py --mapping-path config/xray-test-executions.json --github-ref-name GUNSQA-85-local
python scripts/run_frontend_it.py
```

## Environment variables

The tests are written to be environment-driven because the target GUNS deployment URL, credentials, and some selectors vary by environment.

Required in practice:

- `APP_BASE_URL`
- `APP_USERNAME`
- `APP_PASSWORD`

Useful overrides:

- `LOGIN_PATH`
- `FILE_PAGE_PATH`
- `USER_PAGE_PATH`
- `FILE_UPLOAD_PAGE_PATH`
- selector overrides documented in `tests/helpers/env.ts`

## Repository layout

- `tests/integration/`: Playwright specs for the four Jira cards
- `tests/helpers/`: environment and login helpers
- `config/xray-test-executions.json`: Jira to execution mapping
- `scripts/`: runner plus Jira/Xray automation helpers
- `.github/workflows/ci.yml`: managed branch workflow
