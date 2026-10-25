---
"serupa-ds": minor
---

- Added: `clickable="all"` on Stepper, for a form people can fill in any order. With `onStepClick`, every step but the current one becomes a button, upcoming ones too; the default, `'completed'`, keeps only the steps before the current one (R6).
- Added: `status: 'warning'` on a Stepper step, for a softer problem than `'error'`: a warning-subtle circle with a warning mark, read as ", needs attention" (new `hasWarning` label, in English and Indonesian). New tokens `--stepper-warning-bg`, `--stepper-warning-border` and `--stepper-warning-text`.
