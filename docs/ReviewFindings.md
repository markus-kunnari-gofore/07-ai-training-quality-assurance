# Code Review Findings — `app/`

Reviewed with the repo's installed `code-review` skill (two-axis: Standards / Spec).

**Scope:** `app/src/game.ts`, `app/src/game-runner.ts`, `app/tests/game-runner.test.ts`, `app/package.json`.
**Fixed point:** the empty tree (i.e. this review covers the full current content of these files — `app/` has not changed since the repo's initial commit, so there is no meaningful diff to review against).

## Spec

No spec was found. The repo has no issue tracker config (`docs/agents/issue-tracker.md` is absent), no `docs/`/`specs/` spec files, and no linked issue content beyond the generic exercise instructions in `.github/steps/1-step.md`, which describe the exercise process ("find the planted problems") rather than functional requirements for the Trivia game itself. **Spec axis skipped — no spec available.**

## Standards

Repo has no documented coding standards (no `CODING_STANDARDS.md`/`CONTRIBUTING.md`), so this axis applies the Fowler smell baseline (judgement calls, not hard violations) plus any clear correctness bugs spotted while reading.

### `game.ts`

**(a) Smells**

1. **Data Clumps / Primitive Obsession** (lines 3–6, throughout): `players`, `places`, `purses`, `inPenaltyBox` are four parallel arrays indexed by the same player index — the classic "should be one `Player[]`" clump. Every method (`roll`, `wasCorrectlyAnswered`, `wrongAnswer`) reaches across all four in lockstep.
2. **Duplicated Code**, `roll()` lines 54–61 vs 68–75: the "advance place, wrap at 12, log location/category, askQuestion" block is copy-pasted between the penalty-box and non-penalty-box branches.
3. **Duplicated Code**, "advance currentPlayer with wraparound" (`this.currentPlayer += 1; if (this.currentPlayer == this.players.length) this.currentPlayer = 0;`) appears 4 times: lines 121–123, 136–138, 142–144, 159–161. Should be one `nextPlayer()` method.
4. **Repeated Switches**, `currentCategory()` (90–110) and `askQuestion()` (79–88) both branch on the same place→category / category→questionArray mapping via long if-cascades — a shared `Map`/array indexed by `place % 4` would replace both.
5. **Mysterious Name**, `didPlayerWin()` (112–114) actually returns `true` when the player has **not** won (`!(purses==6)`); callers use it as "still playing." The inverted name is actively misleading and risks future misuse.
6. **Mysterious Name**, `isGettingOutOfPenaltyBox` mixes two lifecycles (this roll's outcome vs. use in the *next* `wasCorrectlyAnswered()` call) — not obvious from the name that it's stale-read across method calls.
7. Typo "corrent" (line 151) — cosmetic, not counted toward the smell budget.

**(b) Correctness bug**

`add()`, lines 30–33:
```ts
this.players.push(name);
this.places[this.howManyPlayers()] = 0;
this.purses[this.howManyPlayers()] = 0;
this.inPenaltyBox[this.howManyPlayers()] = false;
```
`howManyPlayers()` returns `players.length` **after** the push, i.e. it's off by one relative to the new player's actual index (`length - 1`). For the **first** player added, this sets `places[1]/purses[1]/inPenaltyBox[1]` instead of index `0` — `places[0]`, `purses[0]`, `inPenaltyBox[0]` are never initialized (`undefined`).

Concrete failure scenario: player 0's `this.places[this.currentPlayer]` is `undefined`; `undefined + roll` → `NaN`, so `currentCategory()` never matches 0/4/8/etc. and always returns `'Rock'` for that player, and `this.purses[0] += 1` → `NaN`, so `didPlayerWin()`'s `purses == 6` check never succeeds — **the first player added can never win.** This is directly visible in `app/master.txt`, e.g. "Chet's new location is NaN" / "Chet now has NaN Gold Coins."

Fix: use `this.players.length - 1` (or capture the index before pushing).

### `game-runner.ts`

No new smells beyond what's inherited from `Game`; `runProgram` cleanly injects `random` for testability.

### `game-runner.test.ts`

Fragile **Golden Master** setup: the only enabled test compares against `master.txt` (line 34), but the test that generates it is commented out (lines 28–30) — if `master.txt` is ever missing, every test run fails with an unrelated file-read error rather than a clear "no baseline" message. Also, since `master.txt` was captured from the current (buggy) code, it locks in the `NaN` bug above as "expected" output — the golden master will need regenerating once that bug is fixed. Worth a comment/guard, not a Fowler smell per se.

### `package.json`

Nothing in scope for the smell baseline (outdated dependency versions are a toolchain concern, not a design smell).

---

## Summary

- **Spec:** 0 findings (axis skipped — no spec source found in the repo).
- **Standards:** 7 smells + 1 correctness bug across `game.ts`, plus 1 test-fragility note. Worst issue: the `add()` off-by-one (lines 30–33) — a genuine runtime defect (`NaN` places/purses for the first player, who can never win), not just a style smell.
