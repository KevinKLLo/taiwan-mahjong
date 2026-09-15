---
name: workshop-bdd-tdd
description: Apply one reviewed OpenSpec change by checking concrete behavior examples, tracing scenarios to evidence, then using test-driven development, browser verification, and a concise handoff. Use after proposal, delta spec, design, and tasks are ready.
---

# OpenSpec BDD-TDD Workflow

Use this Skill for the implementation phase of one reviewed OpenSpec change. It adds a lightweight BDD bridge—Discovery, Formulation, and Automation—before Red → Green → Refactor. It does not require Cucumber and does not replace OpenSpec Sync Specs or Archive Change.

## Guardrails

- Read `AGENTS.md`, `COURSE_TASK.md`, the active change artifacts, relevant source files, and existing tests first.
- If `openspec/` does not exist, stop and tell the user to run `npx openspec init --tools codex`.
- Select the active change named by the user or unambiguously implied by the task. Ask only when the missing choice would materially change the work.
- Do not change application code before the proposal, delta spec, design, tasks, and test plan are coherent.
- Do not treat GIVEN／WHEN／THEN wording alone as proof that BDD happened. The team must agree on concrete examples and unresolved questions.
- Never invent an unanswered business rule. Stop and ask when a question would change observable behavior.
- Do not weaken, delete, skip, or rewrite a valid test merely to obtain a green result.
- Keep the implementation within the change's scope and non-goals.
- User instructions take precedence over this Skill's workflow guidance. Preserve authorization already given in the conversation; do not ask again for each routine step.
- Authorized local implementation includes necessary locked installation (`npm ci`), tests, builds, local Preview, and relevant read-only research, subject to actual execution permissions. Continue these steps autonomously.
- Ask only for unresolved behavior, a material scope expansion, or an external deployment, destructive operation, or secret access that lacks authorization. Complete independent in-scope work while waiting.
- If a Skill or `AGENTS.md` causes a pause, link the exact file and quote the instruction; explain what decision or authority is missing.

## 1. Inspect

Summarize the selected change:

- desired behavior and non-goals
- acceptance scenarios
- likely files to change
- regression risk
- test layers required

Resolve any ambiguity that changes observable behavior before continuing.

## 2. Example Check

Before changing code, summarize each important behavior as:

- Story: the user outcome
- Rule: the constraint that must hold
- Example: concrete input, action, and observable result
- Question: anything still undecided

Check the conversation and artifacts for existing decisions before asking. Formulate agreed examples as OpenSpec scenarios. Label instructor examples and inferred assumptions as such; never invent a human discussion or approval record. Keep examples in domain language.

## 3. Trace

Create a concise traceability table with these columns:

| Rule or Example | OpenSpec scenario | Automated test | Browser or human acceptance |
| --- | --- | --- | --- |

Every important scenario must have an automated test, a visible acceptance check, or an explicit reason why it remains manual. Do not claim a screenshot proves hidden domain behavior.

## 4. Red

Translate each important acceptance scenario into a focused test. Add the smallest failing test first and run:

```bash
npm test
```

Report the expected failure and why it proves the behavior is missing. If the new test passes before implementation, repair the test or explain why the change already exists.

## 5. Green

Implement the smallest production change that makes the failing test pass. Keep rule logic in `src/mahjong/` and UI behavior in `src/main.ts` or `src/styles.css`.

Run:

```bash
npm test
```

Do not start unrelated refactors while the test is red.

## 6. Refactor

After all tests are green, remove clear duplication and improve names only where it reduces real complexity. Run:

```bash
npm test
npm run build
```

## 7. Verify Visible Behavior

When the change affects UI, start the app with `npm run dev`, open it in Browser Preview, and check every visible acceptance scenario at desktop and mobile width. Capture the result or record the exact manual checks.

## 8. Review And Update Artifacts

- Inspect `git status` and `git diff`.
- Compare the final diff and tests with the traceability table; flag any drift.
- Mark completed tasks in the active change's `tasks.md` only after evidence exists.
- Run OpenSpec Verify Change when available.
- Do not sync or archive automatically; tell the user those are separate decisions after review.

## 9. Handoff

Report:

1. selected OpenSpec change
2. agreed Rules／Examples／Questions and remaining questions
3. scenario-to-test-to-visible-acceptance traceability
4. files changed
5. tests added and Red evidence
6. final test and build result
7. Browser Preview result
8. diff risks and manual checks
9. whether the change is ready for Sync Specs and Archive Change
