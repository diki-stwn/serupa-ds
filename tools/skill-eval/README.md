# Skill eval

Does the Serupa skill (`skills/serupa/SKILL.md`) make coding agents write better Serupa code? Small tasks a project would give an agent go to Claude Code twice each: once with the skill as its instructions and once without. Then `grade.mjs` scores both answers on what the skill asks for. When an edit to the skill lowers the score, it made agents worse.

```sh
node tools/skill-eval/run.mjs                    # every task, both ways (about 15 minutes)
node tools/skill-eval/run.mjs --only sign-in     # some tasks
node tools/skill-eval/grade.mjs <answers dir>    # grade a folder of <task>.tsx answers again
```

`run.mjs` needs the `claude` CLI signed in. The agent runs in an empty folder with no tools, so it has only the prompt and, in one of the two runs, the skill. The answers go to `results/<date>/with/` and `results/<date>/without/`, and the two score tables go to `results/<date>.md`. Commit them. Run it again whenever the skill changes.

## The tasks

`tasks.json` holds each task's prompt and the components a good answer uses. An `"A|B"` entry accepts either one. Seven tasks: a sign-in form, a team settings table, a confirm-delete, a profile form with a toast, a formatting toolbar, an empty projects list and a search bar with filters.

## What the grader checks

The grader reads the code only, so it can't tell whether the page works. It checks each answer for:

| Check | Passes when |
|---|---|
| `parses` | the answer is TSX that parses |
| `serupa` | it imports from `serupa-ds` |
| `components` | it uses the components the task expects |
| `no-rebuilds` | it has no native `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>` or `<dialog>` where Serupa has a component |
| `tokens` | it has no raw colors (`#hex`, `rgb()`, `hsl()`), and no pixel sizes or durations in style props, CSS strings or classes such as `p-[12px]` |
| `names` | every form control sits in a `Field` or has its own name, every IconButton has a `label`, and every picture has `alt` |
| `no-div-click` | no `onClick` on a `div`, `span`, `li`, `tr`, `td`, `p`, `img` or `section` |

`tools/test/skill-eval.mjs` checks the grader itself. A good answer passes every check, and each kind of mistake fails only the check that names it.

One run is one sample per task, so a difference of a check or two between runs can be noise. A check that fails across several tasks is not.
