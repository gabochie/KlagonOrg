# Commit messages

`main` redeploys the live site on its own every night at 06:00 UTC (see
`.github/workflows/publish.yml`). That makes commit messages the only record of
why the site changed, so they are worth writing.

## The format

[Conventional Commits](https://www.conventionalcommits.org/): a type, an
optional scope, then a description in the imperative mood.

```
<type>(<scope>): <what changed and why it matters>
```

Types: `feat` (new capability), `fix` (bug fix), `chore` (build, deps,
tooling, migrations), `docs`, `refactor`, `test`, `perf`, `ci`, `style`,
`revert`.

Good:

```
feat(directory-claims): staff queue for approving owner claims
fix(auth): stop admins being bounced off admin pages during profile load
chore(supabase): one-time manual-apply SQL for lead_events telemetry
```

Bad, and why:

| Message | Problem |
| --- | --- |
| `sdfghj` | Says nothing. This was 54 of the last 60 commits. |
| `Update rss.xml` | Says a file was touched, not what changed or why. |
| `wip` | Not recoverable by anyone, including you in a week. |
| `fix stuff` | No subject, no symptom. |

The subject line answers "what would a reader need to know to decide whether to
revert this?". If reverting would be scary, the message did its job. Put the
reasoning in the body, separated by a blank line.

## The auto-titler

Committing with a junk title through GitHub Desktop rewrites it automatically,
based on the staged diff, and tells you what it wrote:

```
sdfghj  ->  feat(admin): update DirectoryClaimsQueue +3 more files
```

It only fires when the message is genuinely unrecoverable — a keyboard mash, a
single word, or a bare "update <file>". A real sentence like `fix typo` or
`add claim queue` is left alone, and so is anything already in the conventional
format. If it guesses wrong, amend:

```
git commit --amend -m "feat(scope): what this change actually does"
```

To see the suggestion before committing anything:

```
npm run commit:msg
```

## How it is wired up

- `.githooks/commit-msg` is the hook. It **rewrites rather than rejects**, on
  purpose: a hook that exits non-zero blocks the commit, and GitHub Desktop has
  no way to pass `--no-verify`, so a blocking hook would leave you unable to
  commit until you found a terminal. If `node` is not on the PATH the hook
  exits 0 and does nothing — a missing tool must never be the reason a commit
  fails.
- `scripts/suggest-commit-message.mjs` does the work. It is deterministic: no
  network, no API key, no model. It reads `git diff --cached` and reports what is
  actually there. It never invents a *reason*, because it cannot know one, and a
  plausible lie is worse than an honest file list.
- `core.hooksPath` is **local git config**, so it is enabled in this clone only.
  The hook itself is committed, so another clone enables it with:

  ```
  git config core.hooksPath .githooks
  ```
