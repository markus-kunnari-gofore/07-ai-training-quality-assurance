### Code Quality Assurance with Agents

Agents can review code and write tests — but both outputs require your judgment to be useful. This exercise practises that judgment on real code: you will ask Claude to review and then test the same TypeScript file, and compare what each approach finds.

The `app/` directory contains a small TypeScript module with deliberately planted problems. The same file is used for both parts.

---

## Exercise

### Part 1 — Code review: find the planted problems

1. Browse the [Anthropic plugins](https://github.com/anthropics/claude-plugins-official) or [skills.sh](https://skills.sh/) and find a skill relevant to code review or code quality.
2. Install it into `.claude/skills/` following the skill's installation instructions.
3. *(Optional)* Ask Claude to create a custom review skill for TypeScript that uses common guidelines like Effective TypeScript, TypeScript Official Guidelines, Google TypeScript Style Guide, Uncle Bob.
4. Start a new Claude Code session and ask Claude to review the `app/` codebase using the installed skill. Save the findings to **`docs/ReviewFindings.md`**.
5. Ask Claude to fix the issues it identified so that the code is correct and tests will pass. For example: _"Based on the findings in `docs/ReviewFindings.md`, fix the issues in the `app/` codebase so the logic is correct and tests can verify real behaviour."_ Review each change before accepting it — you decide what gets fixed.
6. Run `npm install && npm test` to verify the fixes did not break anything.

### Part 2 — Unit tests for the same code

1. Ask Claude to write comprehensive unit tests for application in app directory. Save the tests to `app/tests/` directory.
2. Run the tests: `npm install && npm test`
3. Evaluate the result — for each test, ask:
   - Does this test verify real behaviour, or does it verify that a mock was called?
   - Would a bug in the implementation break this test?
4. Iterate with Claude to fix any tests that only assert mock calls rather than real behaviour.

### Automated Checks

The CI pipeline will verify:

1. `docs/ReviewFindings.md` exists and is not empty.
2. Tests exists and contains at least one `it(` or `test(` block.
3. `npm test` passes.

Commit and push after finishing both parts — the check runs on every push to these files.

<details>
<summary>Having trouble? 🤷</summary><br/>

 * If Claude's review is too generic, give it more context: mention the domain, name specific things to look for, or reference the project's error handling conventions.
 * If the generated tests all assert mock calls and nothing else, ask Claude explicitly: "Rewrite any test that only asserts a mock was called — each test should verify real behaviour."
 * If `npm test` fails after Claude generates the tests, paste the error output into the session and ask Claude to fix it.
 * If nothing happens for a while after pushing, or if the check fails, check the [Actions](../actions) tab to see what went wrong.
 * If you are still having trouble, ask for help in the the course support channel.

</details>

---

<img alt="Amin 2.0" src="../images/amin2_smile.png" align="right" height="125px" />

Please, follow the steps above.
I'll watch your progress in the background to provide feedback. 🧐