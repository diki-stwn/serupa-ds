---
"serupa-ds": patch
---

- Fixed (serupa-purge): a mistake on the command line (`-o` or `--css` with no file name, an unknown option, a source or `--keep @file` that isn't there) now ends with a one-line message and the usage, exit code 2, instead of a stack trace or a file written to `undefined`.
- Fixed (serupa-purge): a symbolic link to a folder inside a source folder no longer crashes the scan when its name ends like a source file (`lib.js`); linked source files are still read, linked folders are skipped.
- Fixed (serupa-purge): a CSS escape for no character (`\0`, a surrogate, past U+10FFFF) in the stylesheet passed with `--css` reads as U+FFFD, as CSS defines, instead of stopping the run.
