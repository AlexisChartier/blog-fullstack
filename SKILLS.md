# Agent Skills for DevBlog

Skills are specialized instructions loaded by the AI agent to enforce project conventions. Below is the catalog of available skills and when to use them in this project.

---

## Available Skills

### `laravel-cruddy-by-design`

**When:** Creating or refactoring Laravel controllers and routes.

Enforces strict RESTful controllers:
- Max 7 default methods (`index`, `show`, `create`, `store`, `edit`, `update`, `destroy`) or `__invoke` for single-action controllers
- `Route::resource()` / `Route::apiResource()` for standard CRUD
- Custom verbs (e.g., `publish`, `subscribe`) must be extracted to dedicated invokable controllers or treated as state resources
- Controllers are HTTP-only — business logic belongs in models, actions, or services
- Form Requests for validation, Policies for authorization

**Use for:** Any backend controller or route change in `backend/app/Http/Controllers/` or `backend/routes/api.php`.

---

### `commit`

**When:** Committing code changes or writing commit messages.

Follows conventional commits with Infomaniak-specific issue references:
- `<type>(<scope>): <description>` format
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`
- Ensures commit messages are consistent and traceable

**Use for:** Every `git commit` in this project.

---

### `create-mr`

**When:** Opening merge requests or preparing changes for review.

Follows Infomaniak's code review guidelines for MR descriptions and formatting.

**Use for:** Creating merge requests on GitLab for this project.

---

### `code-review`

**When:** Reviewing code or getting critical feedback on changes.

Adversarial code review that forces finding real issues instead of rubber-stamping. Checks against:
- Cruddy by Design controller violations
- Code smells (bloaters, couplers, dispensables)
- Angular anti-patterns (fire-and-forget, missing `computed()`, SSR safety)
- Test coverage and quality gates

**Use for:** Reviewing a feature branch before merging, or auditing an existing file.

---

### `gitlab-ci`

**When:** Interacting with GitLab CI/CD pipelines and jobs.

Covers listing, viewing, running, tracing, retrying, and managing pipelines via `glab` CLI.

**Use for:** Investigating CI failures, retrying jobs, viewing pipeline status.

---

### `gitlab-issues`

**When:** Creating, viewing, updating, or managing GitLab issues.

Interact with GitLab issues using `glab` CLI following Infomaniak conventions.

**Use for:** Bug reports, feature requests, sprint tracking.

---

### `gitlab-summary`

**When:** Generating a daily activity summary or standup report.

Formats output as markdown grouped by project name following Infomaniak conventions.

**Use for:** Daily standups, quick recap of GitLab work.

---

### `readme`

**When:** Generating or updating comprehensive README.md documentation.

Template-based approach for project documentation.

**Use for:** Updating the root `README.md` when architecture or setup changes.

---

### `user-stories`

**When:** Writing well-structured user stories from requirements.

Template-based approach for user story creation.

**Use for:** Sprint planning, translating client requirements into actionable stories.

---

### `translate-doc`

**When:** Translating documentation between languages.

Preserves meaning and structure across translations.

**Use for:** Translating guidelines, README, or API docs (e.g., EN to FR).

---

### `find-skills`

**When:** Looking for new skills that might extend agent capabilities.

Helps discover and install additional agent skills.

**Use for:** When the team needs a workflow not covered by existing skills.

---

## Skill Usage Map by Workflow

| Workflow | Skills to load |
|----------|---------------|
| Create a new API endpoint | `laravel-cruddy-by-design` → implement → `code-review` → `commit` |
| Refactor a fat controller | `laravel-cruddy-by-design` → `code-review` → `commit` |
| Ship a frontend feature | Implement → `code-review` → `commit` |
| Review a merge request | `code-review` → `create-mr` |
| CI pipeline failure | `gitlab-ci` → fix → `commit` |
| Daily standup | `gitlab-summary` |
| Update project docs | `readme` or `translate-doc` |
| Sprint planning | `user-stories` → `gitlab-issues` |
| Find a new workflow | `find-skills` |

---

## How to Load a Skill

The agent loads skills via the `skill` tool. The skill name must match one listed above.

```
skill: laravel-cruddy-by-design
skill: commit
skill: code-review
```

Skills inject detailed instructions, workflows, and reference material into the agent's context for the duration of the task.
