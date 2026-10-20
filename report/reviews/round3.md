# Review – Round 3 (Diagrams: Figure 1 general use case diagram, Figures 2–11 activity diagrams)

Reviewed: `figures/png/*.png` (all 11 at 2x scale), `figures/src/*.drawio`, `figures/tools/*.mjs` and `lib.mjs`, and `main.pdf` (built 17:40). In the PDF, Figure 1 is on p. 14 (PDF p. 15) and Figures 2–11 are on pp. 33–42 (PDF pp. 34–43); I rendered each of those pages at 70 dpi, and one region at 200 dpi.
Compared against: `tables/uc001–uc010.tex`, §3.1 and §3.3 text in `chapters/03_analysis.tex`, and `Example_Report.pdf` (p. 15 general UC diagram, pp. 32–52 activity diagrams).

**Note on check.json:** the file in `figures/png/` only covers the last partial build (AD-UC002 and AD-UC003). I re-ran `d.check()` on all 11 generators without exporting:

| Diagram | Nodes | Edges | Crossings | Issues reported |
|---|---|---|---|---|
| AD-UC001 … AD-UC010 | 5–20 | 4–20 | 0 | none |
| general_use_case | 32 | 35 | 1 (Guest–UC012 × Customer–UC011, drawn with a line jump) | none |

The automated check does not catch a guard label sitting on its own edge or on a lane border, or text touching a node border. All three happen (see below), so the visual findings below go further than the automated check.

---

## Scores

| # | Diagram | Readability | Overlap | Crossings | UML | Spec / template | **Score** |
|---|---|---|---|---|---|---|---|
| Fig 1 | General use case | 6.5 | 8.5 | 9 | 9 | 9 | **8.0** |
| Fig 2 | AD-UC001 Register as Customer | 7.5 | 9.5 | 10 | 8.5 | 8.5 | **8.5** |
| Fig 3 | AD-UC006 Log In | 8 | 10 | 10 | 8.5 | 8.5 | **8.5** |
| Fig 4 | AD-UC007 Log Out | 7 | 9 | 10 | 9 | 9 | **8.0** |
| Fig 5 | AD-UC002 Place Online Order | 7.5 | 9 | 10 | 8 | 7.5 | **8.0** |
| Fig 6 | AD-UC003 Create Staff-Assisted Order | 7 | 8.5 | 10 | 8.5 | 8 | **8.0** |
| Fig 7 | AD-UC008 Update Store Order Status | 8 | 9 | 10 | 7.5 | 7 | **7.5** |
| Fig 8 | AD-UC010 Process Bottle Exchange | 8 | 9 | 10 | 8.5 | 8.5 | **8.5** |
| Fig 9 | AD-UC005 Update Delivery Status | 7.5 | 7 | 10 | 8 | 6.5 | **7.5** |
| Fig 10 | AD-UC009 Assign Delivery | 8.5 | 10 | 10 | 9 | 9 | **9.0** |
| Fig 11 | AD-UC004 Manage Discount Codes | 8 | 9.5 | 10 | 8.5 | 8.5 | **8.5** |
| | **Overall** | | | | | | **8.2 / 10** |

Strong points that apply to all diagrams:
- The template's style is reproduced faithfully: a rounded frame with the title, `<<precondition>>`/`<<postcondition>>` lines, labelled swimlanes, a single initial node, and flow-final nodes drawn as bull's-eyes.
- Edges are orthogonal, with zero crossings in every activity diagram.
- Every decision has a guard on each outgoing branch, and merges are drawn as diamonds.
- System processing is always in the System lane and user actions are in the actor lane.
- Codes and names match the catalogue, and the «extend» use cases are cited in the actions ("(UC023)", "(UC024)", "(UC025)").

---

## Cross-cutting issues (apply to several figures; fix in `lib.mjs` / generators)

**X1 – Printed font size is small (all figures; highest priority for the general diagram).** Drawio fonts are 11 (guards, notes) to 12 (actions); the figures are scaled to the page as follows:

| Figure | Scale | Actions | Guards |
|---|---|---|---|
| Fig 1 | ≈ 0.37 | ≈ 4.4 pt | ≈ 4.1 pt |
| Fig 2 (0.62\textheight cap) | ≈ 0.44 | ≈ 5.3 pt | 4.8 pt |
| Fig 4 (0.7\textwidth) | ≈ 0.42 | ≈ 5 pt | — |
| Fig 6 | ≈ 0.45 | ≈ 5.4 pt | 4.9 pt |
| Figs 5, 7–11 | ≈ 0.47–0.50 | ≈ 5.7–6 pt | — |

The template is similarly small, but 4–5 pt is at the limit of legibility on paper. Fixes:
- Raise the action font to 14 and the guard/note font to 13 in `ST`/`Activity`.
- Or shrink unused lane width and height so that the scale rises. Candidates: the empty lower half of the actor lane in UC001, UC008 and UC010, and the one-action customer lanes in UC003 and UC010.
- Raise the `\diagram` width for UC001 (0.9 → 1.0, with the height cap raised to 0.74) and for UC007 (0.7 → 0.9). UC007 currently leaves 60% of p. 35 blank.

**X2 – Text touches the node border** (no inner padding; this shows clearly at print size). Widen these boxes by 20–30 px, or set `spacingLeft=6;spacingRight=6`:

| Figure | Labels |
|---|---|
| Fig 1 (ellipses) | UC016 "View Membership, Points and Notifications", UC020 "View Reports and Audit Logs", UC022 "View Bottle Exchange History" |
| Fig 6 (UC003) | "Open the POS screen and select the order source", "Record the order in the staff member's branch (preparing, unpaid) and display it", "Look up the member (UC024)" |
| Fig 9 (UC005) | "Confirm the start of the delivery", "Award loyalty points; upgrade rank if reached (UC025)" |
| Fig 7 (UC008) | "Update the status; record history and audit log" |
| Fig 8 (UC010) | "Display the recorded exchange" |
| Fig 11 (UC004) | "Open the discount codes page" |
| Fig 4 (UC007) | both system actions |
| Fig 5 (UC002) | "Show the discount in the order summary" |

**X3 – Pre/postcondition spacing is inconsistent.** UC002 and UC009 have a blank line between the `<<precondition>>` and `<<postcondition>>` lines; all other diagrams use single spacing. Use one rule everywhere; single spacing is closest to the template.

**X4 – Error branches have no "show error" action.** The template (p. 33, Log In) routes `[Unsuccessful]` through a "Show error message" action before looping back. Here every error branch jumps straight back to the input action, although the specs name the message:

| Spec | Message / flow |
|---|---|
| UC001 | E1 validation messages; E2 "Phone already registered" |
| UC006 | "Invalid credentials" |
| UC008 | "Invalid status transition" |
| UC004 | "Discount code already exists" |
| UC003 | E1 member not found |
| UC010 | E1–E3 |
| UC002 | E1 shows the reason |

Add a small system action on each error branch, e.g. "Show error message" or the exact message, before the loop. At minimum, do this in UC001, UC006 and UC004, where the spec quotes the message. This also makes the loops easier to read.

**X5 (optional, UML strictness) – Implicit merges.** Several actions receive two or three incoming edges without a merge node:

| Figure | Action |
|---|---|
| UC001 | "Fill out and submit the form" |
| UC002 | "Select branch…", "Confirm the order" |
| UC003 | "Enter recipient…" |
| UC004 | "Enter code…" |
| UC006 | "Enter credentials…" |
| UC008 | "Select an order…" |
| UC009 | "Select a delivery…" |
| UC010 | "Enter bottles…" |

In addition, the UC002 `[has code]/[no code]` decision and the UC003 member decision each receive two incoming edges. Strict UML 2 reads multiple incoming edges into an action as an implicit join. The template does the same, so this is acceptable. A merge diamond before each re-entry point would be cleaner, especially in UC001, where two loop edges (x = 122 and x = 152) meet on one arrowhead.

---

## Per-diagram findings and fixes (prioritised)

### Fig 1 – General use case diagram (8.0)

Correct as drawn:
- **System boundary:** titled; all actors are outside it.
- **Generalisation:** the arrows point from specific to general (Admin → Manager → Staff → Employee; Shipper → Employee).
- **Abstract actor:** *Employee* is shown in italics.
- **«extend» relationships:** all point from the extension to the base (UC023 → UC002/UC003, UC024 → UC003, UC025 → UC008/UC005).
- **Associations:** they match Table 1, including Guest/Customer on UC011 and UC012, and Customer/Employee on UC006 and UC007.
- **Crossing:** the only crossing (Guest–UC012 × Customer–UC011) uses a line jump, which is acceptable.

The generalisation chain is explained in the text and does reduce clutter. It does not hurt clarity.

1. **(High) Readability at print size.** Labels are about 4.4 pt (X1). Options:
   - Raise the ellipse font to 14–15 and the actor font to 14.
   - Or put the figure on its own landscape page (`\begin{landscape}`), which gives about a 1.4× gain.
   - Or reclaim width: the empty band between UC001 and UC004 at the top, and the area left of UC024/UC025, allow narrowing the boundary by about 15%.
2. **(High) The UC025 → UC008 «extend» arrow is ambiguous.** Its head lands on the lower-left of UC008, about 25 px above UC010. Its «extend» label sits in the gap between UC008 and UC010, so it reads as if UC025 extends UC010. Fix: reorder the Staff column to UC003, UC010, UC008, UC005, i.e. swap UC008 and UC010. UC025 then sits directly between its two bases, with two short arrows, and nothing else nearby. The Staff association lines remain crossing-free.
3. **(Medium) The Customer–UC006 line grazes the bottom-left of UC016.** The clearance is about 25 drawio units, which looks like contact at print size. It runs almost parallel to the Customer–UC016 line, so the two look like one line that ends at UC016. Fix: move UC006 and UC007 slightly further right and lower, or move UC016 up about 20 px (there is space under UC015). Either change gives a clear angle between the two lines.
4. **(Medium) Ellipse labels touch the outline** for UC016, UC020 and UC022 (X2). Widen these three ellipses to about 340.
5. **(Low) The UC023 → UC003 «extend» label (≈1175, 880) sits just left of UC020.** Shift the label along the edge towards UC023 (t ≈ 0.35) so that it does not seem to belong to UC020.
6. **(Low) Balance.** UC006 and UC007 are offset at different x positions (835 vs 615), which looks accidental. Align them in one column with UC024/UC025, or stagger them deliberately.

### Fig 2 – AD-UC001 Register as Customer (8.5)

The steps, branches and codes match the spec. Steps 6–8 are kept as three actions.

1. **(Medium) Add a "Show validation messages" / "Show 'Phone already registered'" action** on the two error branches (X4).
2. **(Medium) Join the two loop-backs at a merge diamond.** They currently run as parallel verticals 30 px apart (x = 122 and x = 152) into one arrowhead. Place the merge just left of "Fill out and submit the form" (X5).
3. **(Medium) Print size.** The figure is capped at 0.62\textheight, which gives about 5.3 pt (X1). The Guest lane below y = 720 is empty. Either narrow the Guest lane (~560 → ~420) or raise the cap to 0.74 together with width 1.0.
4. (Low) A1 (the Guest leaves the form) is not shown. This is acceptable, but a short `[cancel]` branch to a flow-final node would complete the spec.

### Fig 3 – AD-UC006 Log In (8.5)

Clean, and almost identical in structure to the template's Log In.

1. **(Medium) Add a "Show 'Invalid credentials'" action** on the `[invalid]` branch, as the template does (X4).
2. **(Low) Text/diagram mismatch.** §3.3 says "a successful sign-in branches to the work area of the user's role", but the diagram has a single action, "Open the work area of the user's role". Either change the text to "opens the work area of the user's role", or add a 4-way decision ([Customer]/[Staff]/[Shipper]/[Manager or Admin]) that leads to four "Open … area" actions. Changing the text is simpler.

### Fig 4 – AD-UC007 Log Out (8.0)

Matches the corrected spec (local logout, no token revocation).

1. **(Medium) Scale.** It is included at 0.7\textwidth (≈5 pt) on a page that is otherwise 60% empty. Use 0.9–1.0, or drop the `\clearpage` before UC007 so that it can share p. 34 with UC006.
2. **(Low) Text touches the box border** in both system actions (X2). Widen them to about 200.

### Fig 5 – AD-UC002 Place Online Order (8.0)

Correct:
- the pickup/delivery branch and merge;
- the `[has code]/[no code]` branch;
- the UC023 validation loop (E1: change the code or clear it);
- server-side re-validation.

Problems:
1. **(High, spec consistency) The single `[rejected]` loop returns to "Select branch and fulfilment method".** The spec returns to different steps: E2 → step 1 (update cart), E3/E4 → step 3, E5 → step 5. Either:
   - (a) split the decision into `[cart/product rejected]` → flow-final (or "Review the cart"), `[branch or city rejected]` → "Select branch…", and `[code rejected]` → the code decision; or
   - (b) keep one loop and relabel it `[rejected: show reason]`, then add a sentence to §3.3: "all server rejections return to the checkout form".

   Option (a) is better; it adds one decision and no crossings if the cart branch ends at a flow-final node in the System lane.
2. **(Medium) Add "Show the reason" actions** on the `[invalid code]` and `[rejected]` branches (X4).
3. **(Medium) Two long loop verticals run side by side in the Customer lane.** `[rejected]` (x = 113) and `[no code]` (x = 138) run in parallel for about 400 px. Move the `[no code]` edge to the right side (route it down at x ≈ 535 into the right side of "Confirm the order"); the pickup bypass already uses that corridor above y = 890, so there is no conflict.
4. (Low) Use the same spacing for the pre/postcondition lines as in the other diagrams (X3). Pad "Show the discount in the order summary" (X2).

### Fig 6 – AD-UC003 Create Staff-Assisted Order (8.0)

Correct:
- the three lanes, including the supporting participant;
- the member/non-member branch;
- the UC024 lookup with a `[not found]` loop (E1);
- the UC023 validation in the confirm step;
- the `[rejected]` loop to step 8.

Problems:
1. **(Medium) Text touches the border** in three actions (X2): "Open the POS screen and select the order source", "Record the order in the staff member's branch (preparing, unpaid) and display it", and "Look up the member (UC024)". Widen these to about 300.
2. **(Medium) "Confirm the order" sits about 25 px below "Enter recipient…".** The connecting arrow is barely visible at print size. Move "Confirm the order" down 30–40 px; there is plenty of space before "Validate…".
3. **(Medium) The `[rejected]` loop always returns to step 8.** E3 also allows "Staff corrects the items (step 4)". Either relabel it `[rejected: show reason]` and note in §3.3 that the order screen is kept, or add the step-4 target (this needs a second loop on the left side).
4. **(Low) Add a "Report 'member not found'" action** on `[not found]` (X4).
5. **(Low) Reclaim width.** The Store Customer / Caller lane holds one action. Narrow it from ≈ 365 to ≈ 260 so that the figure prints at a larger scale (X1).
6. (Low) The two right-side loop verticals are at x = 1397 (`[not found]`) and x = 1405 (`[rejected]`). They do not overlap vertically, but aligning them on one x looks tidier.

### Fig 7 – AD-UC008 Update Store Order Status (7.5)

The three-way status branch, the merge and the "(UC025)" reference are good. The pickup-only completion is shown in the guard.

1. **(High, spec consistency) E2 (the order belongs to another branch → access denied, use case ends) is missing.** The action is named "Check the branch and that the transition is allowed", but the decision only has `[not allowed]` and `[allowed]`. Add a third guard, `[other branch]`, to a flow-final node to the right of the decision, as Fig 10 does with `[other branch or order not ready]`. Alternatively, rename the action to "Check that the transition is allowed" and drop "branch" from §3.3; option (a) is preferred because the spec lists E2.
2. **(Medium) Add a "Show 'Invalid status transition'" action** on `[not allowed]` (X4).
3. **(Low) The Staff lane is empty below y = 660.** Narrow the Staff lane (~500 → ~400), or move the three result actions closer together, to gain print scale.
4. (Low) Pad "Update the status; record history and audit log" (X2).

### Fig 8 – AD-UC010 Process Bottle Exchange (8.5)

The flow matches steps 1–9 and the final hand-over is in the Staff lane.

1. **(Medium) Add a "Show the reason" action** on `[invalid]`. E1–E3 each produce a message (X4). Optionally rename the guard to `[invalid quantity, product or member]` so that all three exceptions are visible.
2. **(Low) The Store Customer lane holds a single action.** Narrow it (~420 → ~300). Optionally add "Receive the reward products" in that lane after the Staff hand-over, which balances the lane and makes the participant's role explicit.
3. (Low) Pad "Display the recorded exchange" (X2).

### Fig 9 – AD-UC005 Update Delivery Status (7.5)

Correct:
- the A1 `[none]` early end;
- the pickup → delivering → outcome sequence;
- the UC025 sub-branch with its merge;
- the failure path ending in a flow-final node.

Problems:
1. **(High, spec and text consistency) Failure can only be reported after "Confirm the start of the delivery".** The spec (A3, "3, 5 or 7") and the §3.3 sentence ("which can also be reported before pickup or during delivery") allow failure from assigned and picked-up as well. Two options:
   - Option A: insert a `[cannot deliver]` decision after "Display assigned deliveries" (in the Shipper lane, before "Collect the order") and after "Set picked up" (before "Confirm the start"). Route both into "Enter the failure reason…" through a merge in the left corridor (x ≈ 138), which is already used by the existing `[cannot deliver]` edge.
   - Option B, simpler: add a note anchored to "Enter the failure reason…" that says "can also be reported from assigned or picked up (A3)", and change the §3.3 sentence to "the diagram shows the failure after the delivery has started; the same path is available before pickup and after pickup".
2. **(High, overlap) Guard labels sit on their own edges.**
   - `[has deliveries]` is drawn on top of the bend of the outgoing edge and hides the corner.
   - `[otherwise]` sits on the corner of its edge and runs into the right System-lane border: the label spans x ≈ 1503–1607 and the border is at x = 1600.
   - The `[otherwise]` vertical (x ≈ 1560) also runs only about 40 px inside the lane border, almost parallel to it.

   Fixes: give both labels an offset away from the line, e.g. `[has deliveries]` below-right of the diamond at (1340, 690) with the edge starting below it, and `[otherwise]` above the horizontal at about x = 1420. Move the `[otherwise]` corridor in to x ≈ 1540, or widen the System lane by 40 px.
3. **(Low) A2 (shortcut transitions) is not shown.** This is acceptable as a simplification; a one-line remark in §3.3 would remove the question.
4. (Low) Pad "Confirm the start of the delivery" and "Award loyalty points; upgrade rank if reached (UC025)" (X2).

### Fig 10 – AD-UC009 Assign Delivery (9.0)

The best diagram of the set:
- E1/E2 end at a flow-final node;
- E3 loops back to step 3;
- the actions match steps 1–6;
- there are no overlaps.

1. (Low) Pre/postcondition spacing differs from the majority (X3).
2. (Low) Add a "Show rejection reason" action on `[invalid shipper]`, and optionally before the flow-final node of `[other branch or order not ready]` (X4).
3. (Low) The lane is named "Manager"; since Admin may also perform UC009, "Manager / Admin" would match the spec's Actor row. The same reasoning would apply to the Staff lanes, but there the generalisation already covers it, so this is optional.

### Fig 11 – AD-UC004 Manage Discount Codes (8.5)

Correct:
- the rank / no-rank branch and its merge (A1);
- the combined duplicate/invalid loop (E1/E2);
- save → show success → end.

1. **(Medium) Add a "Show error message" action** on `[duplicate or invalid]`, since the spec quotes "Discount code already exists" (X4).
2. **(Low) Separate the two-line guard `[duplicate or invalid]` from the loop line.** It sits close above the line at print size. Shorten it to `[duplicate / invalid]` on one line, or move it up 6 px.
3. (Low) A2 (the Admin leaves the page) is not shown; this is acceptable. Pad "Open the discount codes page" (X2).

---

## Summary of priorities

1. **UC005 (Fig 9):** model or annotate failure from assigned/picked-up, or change the §3.3 sentence. Move the `[has deliveries]` and `[otherwise]` labels off their edges and away from the lane border.
2. **UC008 (Fig 7):** add the `[other branch]` → end branch (E2).
3. **General diagram (Fig 1):** increase the print font size (X1). Remove the UC025 → UC008 / UC010 ambiguity by swapping UC008 and UC010. Separate the Customer–UC006 line from UC016.
4. **UC002 (Fig 5):** make the `[rejected]` targets match E2/E3–E4/E5, or relabel the loop and explain it in §3.3.
5. **All figures:** larger fonts or a better scale (X1), padding in the tight boxes (X2), uniform pre/postcondition spacing (X3), "show error" actions on error branches (X4).
6. **Regenerate `check.json` with a full `node build.mjs`** so that it covers all 11 diagrams. Consider extending `lib.mjs` with a check for "label bbox intersects its own edge segment / lane border", which would have caught the UC005 issues.
