# SlopMonster Copy Linter & Humanizing Engine

This reference module is an active operational engine of `agent-delegation`. Based on `ItsssssJack/SlopMonster`, it enforces human-grade clarity, rhythm, and evidence standards for all public-facing English prose (READMEs, landing pages, marketing copy, emails, and documentation).

---

## 1. The 5 Scored Anti-Patterns

The linter (`toolbox/deslop.py`) evaluates copy across 5 categories. Each matched category penalizes the draft by 1 point (exits `0` at `5/5`, `1` below `5/5`):

1. **Vocabulary (AI Clichés & Buzzwords)**:
   - Overused filler: *delve, tapestry, beacon, game-changer, testament, pivotal, foster, leverage, robust, seamless, unlock, elevate, transformative, groundbreaking, navigate the landscape, in today's fast-paced world, paradigm shift, holistic, synergy*.
   - Fix: Replace with direct, plain verbs (e.g., replace *"delve into the data"* with *"inspect the rows"*).
2. **Sentence Patterns (Formulaic Structures & False Curiosity)**:
   - Constructions like *"not only X, but also Y"*, *"not just X, but Y"*, *"It is important to remember that..."*, and rhetorical questions answered immediately (*"Why does this matter? Because..."*).
   - Fix: State the claim directly in active voice without rhetorical warmups.
3. **Punctuation (Em-Dash & Semicolon Abuse)**:
   - Clustered em-dashes (`—`), double hyphens (`--`), or high semicolon density within short paragraphs.
   - Fix: Break into natural short and medium sentences using periods and commas.
4. **Three-Item Lists (Formulaic Tricolon)**:
   - Clustered three-part parallel lists (*"fast, secure, and reliable"*, *"scalability, flexibility, and performance"*).
   - Fix: Keep only the single most accurate descriptor, or give concrete evidence.
5. **Possible Unsupported Proof (Fabricated Metrics)**:
   - Unanchored number-noun patterns claiming 10x gains, 99.9% improvements, or hundreds of thousands of users without concrete evidence.
   - Fix: Cite the actual benchmark or use `[needs number]` until verified.

---

## 2. The 4-Step De-Slop Workflow

1. **Step 1: Context & First Audit**:
   - Determine reader intent (e.g., README must show installation, usage, and limits in the first 20 seconds).
   - Run `python3 toolbox/deslop.py <file>` to inspect initial score and flagged patterns.
2. **Step 2: 3-Pass Human Rewrite**:
   - **Pass 1 (Structure & Purpose)**: Answer the reader's primary question immediately. Delete teaser openings.
   - **Pass 2 (Meaning & Facts)**: Ensure every sentence carries new information. Zero invented statistics or fake testimonials.
   - **Pass 3 (Wording & Rhythm)**: Vary sentence lengths naturally. Never hide normal prose inside code blocks to fool the score. Do not manufacture fake personality (forced typos or slang).
3. **Step 3: Cross-Model Cleanse (`tools/cleanse.sh`)**:
   - When a rival CLI is available (`DESLOP_WRITER=claude` or `DESLOP_WRITER=gpt`), pass the draft through the cleansing prompt strictly as a bounded text tool.
4. **Step 4: Diff & Rescore**:
   - Confirm zero technical instructions, commands, or links were lost.
   - Confirm `python3 toolbox/deslop.py` exits `0` with `5/5`.
