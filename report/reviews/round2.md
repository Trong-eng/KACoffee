# Review – Round 2 (§3 Analysis: 3.1 General Use Case Diagram, 3.2 Use Case Details, 3.3 Activity Diagram text)

Reviewed: `main.pdf` (35 pp., built 2026-10-20 17:22; §3 = pp. 13–34), `chapters/03_analysis.tex`, `tables/uc001–uc010.tex`, `preamble.tex` (usecase macros)
Compared against: `Example_Report.pdf` §3.1–3.3 (pp. 14–36), `KACoffee/KACoffee_UseCases.html`, `README_Analysis1_KACoffee.md` §3–§9 and §12, `KACoffee_Project_Description.pdf` (acceptance focus), backend `auth/{service,schemas,deps,router}.py`, `orders/{service,router,pricing_service}.py`, `deliveries/{service,router,schemas}.py`, `discounts/{service,router,schemas}.py`, `bottle_exchange/{service,schemas}.py`, `employees/router.py` (member lookup), `seed/data.py` (rank thresholds), and frontend `authStore.ts`, `Header.tsx`, `ProtectedRoute.tsx`, `CheckoutPage.tsx`, `InStoreOrderPage.tsx`, login pages.

`main.log`: no Overfull/Underfull boxes and no undefined references.

## Scores

| Criterion | Score | Comment |
|---|---|---|
| (a) Template conformance | **8.5/10** | Each use case has the template's bold "UCxxx: Name" heading and a table with Use Case Code / Use Case Name, Actor, Usage, Activation Event, Preconditions, Main Event Flow (Index / Done by / Action) and Postconditions, in the template's order. Use cases are grouped by actor in both 3.2 and 3.3, and the actor bullets follow the template's "Represents …" style. Minor problems: "Use Case Name" wraps onto two lines, and the 3.2 intro says the tables use "the fields of the template" although two rows are added. |
| (b) Content fidelity | **8/10** | Almost every number, status value, message and permission matches the code: 8–20 / 6–100 / 1–100 field lengths, "Phone already registered", "Invalid credentials", "Discount code already exists", VND 20,000, Hanoi-only delivery, quantities 1–50, 100/300/700 thresholds, floor(amount/1,000), multiples of five, require_system_admin for UC004, ensure_same_branch, and the shortcut transitions. All README §12 "Năm bản đặc tả" items are covered. Errors: (1) UC005 says a failed delivery "returns the order to ready", but the order never left ready; (2) UC007 claims a refresh-token revocation that the web UI never performs; (3) UC002 has no branch for a code rejected when the order is confirmed; (4) the failure branch of UC005 starts only at step 7. |
| (c) Internal consistency | **8.5/10** | Codes and names are identical across the catalogue, table headings and 3.3 paragraphs, and all step references exist. Problems: the three extension use cases appear in the relationship list but not in the catalogue and have no extension points in the tables; there is one "(step A2)" reference; alt-flow ordering differs between tables; and the UC005 failure text contradicts its own Business Rules. |
| (d) Writing / layout | **7/10** | The English is clear and concise. Layout problems: the first line of every Alternative Flows cell rides up onto the top rule (a macro bug); alt-flow cells cannot break across pages, which leaves 20–30% blank on pp. 21 and 24; table headers are orphaned at page bottoms (UC002 on p. 18, the Main Event Flow header of UC003 on p. 20); and in 3.3 the paragraphs are separated from their figures (pp. 29→30, 33→34). |

---

## Prioritised issues

### P1 – High priority (factual errors or broken layout)

**1. UC005: the failed-delivery branch says the order "returns" to ready** (`tables/uc005.tex`, A2 and Postconditions)
In the code, a delivery order stays `ready` throughout pickup and delivery: `shipper_fail` sets `order.status = READY`, but the value is already `ready`. The table's own Business Rules say "Intermediate delivery states do not change the order status", and README §6.5 says "order giữ `ready`". As written, the reader infers that the order had become "delivering".
- Current (A2): `The system sets the delivery to failed, returns the order to ready, records the history and notifies the member, if any.`
- Replace: `The system sets the delivery to failed, keeps the order in the ready status, records the failure reason in the delivery history and notifies the member, if any.`
- Current (Postconditions): `Failed: the order returns to ready and remains available for follow-up and reassignment.`
- Replace: `Failed: the order remains ready and is available for follow-up and reassignment (UC009).`

**2. UC005: a failure can be reported from three statuses, not only at step 7** (`tables/uc005.tex`)
`shipper_fail` accepts `assigned`, `picked_up` and `delivering`, and the HTML input table says the same. The fail action is also available before pickup (for example, when the store cannot reach the customer).
- Current: `\ucalt{A2}{7}{[the order cannot be delivered, e.g. the customer is absent or the address is wrong]}`
- Replace: `\ucalt{A2}{3, 5 or 7}{[the order cannot be delivered, e.g. the customer is absent or the address is wrong]}`
- Current: `\ucalt{E3}{A2}{[no failure reason]}{…}`. This renders as "(step A2)".
- Replace with plain text: `\item \textbf{E3} (in A2) [no failure reason]: The system asks for a reason (1--255 characters) before recording the failure; the Shipper enters it and A2 continues.` This also gives E3 an explicit resume point.

**3. UC007 Log Out describes an API capability that the UI does not use** (`tables/uc007.tex`; `03_analysis.tex` §3.3 UC007 paragraph)
`authStore.logout()` only removes `kacoffee-auth` from localStorage and resets the state. The Header button calls it directly and never calls `POST /auth/logout`, so the refresh token is **not** revoked by the web client. The UI also does not navigate: on a protected page, `ProtectedRoute` redirects to that portal's sign-in page; on a public page, the user stays where they are. README §6.4/§9 require API-only capabilities to be labelled.
- Replace the main flow:
  ```
  \ucstep{1}{User}{Select ``Log Out''.}
  \ucstep{2}{System}{Remove the stored tokens and profile from the browser.}
  \ucstep{3}{System}{Show the signed-out header; a protected page redirects to the sign-in page of its portal.}
  ```
- Business Rules, current: `A revoked refresh token can no longer be used to obtain new access tokens.`
- Replace: `The backend also offers a logout endpoint that revokes the refresh token so that it can no longer obtain new access tokens; the current web interface ends the session locally and does not call it.`
- §3.3, current: `The system revokes the refresh token, clears the session and returns the user to the public area.`
- Replace: `The system clears the stored session in the browser and shows the signed-out interface; protected pages redirect to the sign-in page.`

**4. UC002: no branch when the code is rejected on confirmation** (`tables/uc002.tex`)
`discount_code` is a form field that `CheckoutPage` submits whether or not the preview succeeded. `create_online_order` re-validates it at confirmation and rejects the whole order (HTTP 400/404) when it fails. Step 9 says "re-validate the discount", but no alternative flow covers the failure, and E1's "continues without it (step 7)" implies the order would go through with the code still in the field.
- Add after E4: `\item \ucalt{E5}{9}{[the discount code entered at checkout is no longer valid, or was kept after a failed preview]}{The order is rejected and nothing is recorded; the Customer removes or changes the code (step 5).}`
- E1, current: `The Customer changes the code (step 5) or continues without it (step 7).`
- Replace: `The Customer changes the code (step 5) or clears it and continues (step 7).`

**5. The first line of every "Alternative Flows" cell collides with the top rule** (`preamble.tex`, `uclist`)
`\vspace{-\baselineskip}\vspace{3pt}` inside the `[t]` minipage pushes the first bullet about one line up. It touches or overlaps the horizontal rule above (clearly visible in UC005 p. 26 and UC006 p. 18), and the bullet sits higher than the bold "Alternative Flows" label. The minipage also makes the cell unbreakable, which causes P1-6.
- Option A (minimal): replace the environment with a list that has no minipage and check the result:
  ```
  \newenvironment{uclist}{%
    \begin{itemize}[label=-,leftmargin=0.4cm,nosep,
      before=\vspace{-\baselineskip},after=\vspace{-\baselineskip}]}{%
    \end{itemize}}
  ```
  Adjust the `before` length until the first bullet's baseline lines up with the label.
- Option B (recommended, also fixes P1-6): give each alternative flow its own row, like the main flow and like README §5.3:
  `\ucalthead` → `\textbf{Alternative Flows} & \textbf{ID (step)} & \textbf{Condition} & \textbf{Handling and resume point} \\ \cline{2-4}`
  then one `\ucstep{E1 (4)}{Missing or invalid data}{The system shows … continues from step 3.}` per flow. Rows can then break across pages, and alignment is automatic.

**6. Unbreakable alt-flow cells and orphaned headers cause large gaps** (rendered pp. 18, 20–21, 23–24)
- p. 18: the UC002 heading and its "Use Case Code" row are stranded at the page bottom; the rest of the table is on p. 19.
- p. 20: the UC003 "Main Event Flow | Index | Done by | Action" header row is alone at the page bottom.
- p. 21 (UC003) and p. 24 (UC010): about 25% of the page is blank because the whole Alternative Flows cell moved to the next page.
- Fix: Option B in P1-5 removes the gaps. For orphaned headers, put `\\*` (no-break) after the code row and after `\ucflowhead`. In `usecase`, use `\textbf{Use Case Code} & #1 & \textbf{Use Case Name} & #2 \\* \hline`, and change `\ucflowhead` to end with `\\* \cline{2-4}`. Alternatively, add `\needspace{8\baselineskip}` (package `needspace`) before the heading in the `usecase` environment.

### P2 – Medium priority (consistency and UML semantics)

**7. Extension use cases are missing from the catalogue, and the tables name no extension points** (`03_analysis.tex` catalogue and relationship list; `uc002/003/005/008`)
The diagram text introduces *Validate Discount Code*, *Look Up Member* and *Award Loyalty Points*, but Table 1 does not list them. The README checklist requires codes and names to be consistent across every table and figure. With «extend», the base use case must also be complete without the extension and must declare where it can be extended. In UC005 step 9 and UC008 step 7, however, point awarding is part of the base main flow.
- Add three catalogue rows, for example `UC023 & Validate Discount Code (extends UC002, UC003) & --- \\`, `UC024 & Look Up Member (extends UC003) & --- \\` and `UC025 & Award Loyalty Points (extends UC005, UC008) & --- \\`. Alternatively, add a sentence: "Extension use cases are not numbered because they have no actor of their own."
- Name the extension points in the tables, for example:
  - UC002 step 6: `Validate the discount code and show the discount amount in the updated summary (extension point: Validate Discount Code).`
  - UC003 step 7: `… (extension point: Look Up Member).`
  - UC005 step 9: `Extension point \emph{Award Loyalty Points}: if the order belongs to a member and no points have been awarded yet, credit the loyalty points and upgrade the membership rank when a threshold is reached.` Use the same wording for UC008 step 7.
- In §3.1, after the list, add: `Each extension is inserted at the named extension point of the base use case; the arrow points from the extending use case to the base use case.`
- Typography: `$\langle\langle$extend$\rangle\rangle$` renders as ⟨⟨extend⟩⟩. Use `\guillemotleft extend\guillemotright` (T1 encoding), which gives «extend», the UML notation.

**8. UC003: the "Member not found" branch does not say what happens if Staff ignores it** (`tables/uc003.tex`)
The lookup endpoint returns "Customer not found", and the UI shows "Không tìm thấy thành viên". If Staff leaves the unknown number in the field, `create_staff_order` rejects the order at step 10 (`_resolve_customer_by_phone`). The HTML spec states this explicitly.
- E1, current: `Staff corrects the number (step 6) or clears it to continue as a non-member (step 8).`
- Replace: `Staff corrects the number (step 6) or clears it to continue as a non-member (step 8); if the unknown number is left in the form, the order is rejected at step 10.`
- §3.3 UC003 paragraph, current: `…the system looks up the member and validates the order; non-members skip the lookup.` This omits the [not found] guard that README §6.3 requires. Replace: `…the system looks up the member, looping back when the phone number is not found, and validates the order; non-members skip the lookup.`

**9. UC002 delivery-area wording overstates the check** (`tables/uc002.tex`)
`calculate_delivery_fee` only checks that `city` is recognised as Hanoi (an alias list). There is no address or GPS verification, and address_line, ward and district are optional (README §6.2 "Lưu ý đúng code").
- E4, current: `[delivery address outside Hanoi]`. Replace: `[the delivery city is missing or not recognised as Hanoi]`.
- Business Rules, current: `Delivery is restricted to Hanoi.` Replace: `Delivery is restricted to Hanoi; only the city name is checked, and the other address fields are optional.`
- Apply the same E3 wording to UC003: `[delivery city missing or not recognised as Hanoi, or a delivery order contains a dine-in item]`.

**10. UC008: conditional branches inside the main flow; the cancel alt flow skips the checks** (`tables/uc008.tex`)
Steps 6 and 7 are both "If …" steps, so the main flow describes three scenarios at once. A1 also jumps from step 3 straight to step 8, which suggests that cancellation bypasses the branch and transition check and the status history (it does not: the same `update_order_status` runs).
- Make the main flow the "mark ready" scenario: step 3 `Select a preparing order and choose "ready"`, and step 6 `Notify the member, if any; for a delivery order, create a delivery record awaiting shipper assignment.` Move completion into an alternative flow: `\ucalt{A2}{3}{[a ready pickup order is completed]}{Steps 4--5 apply; the system records the payment as paid and, for a member order, awards loyalty points once (extension point Award Loyalty Points); the flow continues at step 8.}`
- A1, current: `The order becomes cancelled and its payment status cancelled; the flow continues at step 8.`
- Replace: `Steps 4--5 apply; the order and its payment status become cancelled and no notification is sent; the flow continues at step 8.`

**11. UC009 E3 is placed at a step where the UI cannot trigger it** (`tables/uc009.tex`)
Step 2 already limits the list to the Manager's branch (`resolve_branch_scope`). The cross-branch check (`ensure_same_branch`, "This action is limited to your branch") runs on the server when the assignment is submitted, i.e. at step 4.
- Current: `\ucalt{E3}{3}{[a Manager selects a delivery of another branch]}`
- Replace: `\ucalt{E3}{4}{[the delivery belongs to another branch than the Manager's]}{Access is denied and the use case ends.}`

**12. Inconsistent ordering of alternative flows** (`uc001`, `uc004`)
UC002, UC003 and UC005 list flows by step number. UC001 lists E1(4), E2(5), A1(3), and UC004 lists A1(3), E1(5), E2(5), A2(3). Pick one rule, by step number then A before E, and apply it everywhere. For example, UC004 becomes A1(3) no rank, A2(3) leaves page, E1(5), E2(5); UC001 becomes A1(3), E1(4), E2(5).

**13. UC004 Business Rules: "system interface" is ambiguous** (`tables/uc004.tex`)
README §6.4 requires labelling capabilities that exist only in the API. "System interface" reads as the UI, which is the opposite of what is meant.
- Current: `Validity dates and later edits are supported by the system interface but are not shown on the current creation form.`
- Replace: `Validity dates, the active flag and later edits are supported by the backend API but are not exposed on the current admin screen; the form always creates an active code.`

**14. §3.3 paragraphs are separated from their figures** (`03_analysis.tex`; rendered pp. 29–30 and 33–34)
The UC001 and UC006 paragraphs are both on p. 29 with their figures on p. 30, and the same happens with UC009 and UC004 (pp. 33→34). The reader meets two descriptions, then two diagrams. This will matter more once real diagrams replace the 6 cm placeholders.
- Option: load `placeins` and put `\FloatBarrier` after each `\diagram{…}`, or give the `\diagram` macro an optional `[H]` placement for §3.3. The template places each activity diagram directly under its heading.

### P3 – Low priority (polish)

**15. §3.2 intro does not mention the added rows** (`03_analysis.tex`)
- Current: `Each use case is specified with the fields of the template.`
- Replace: `Each use case is specified with the fields of the template, extended with Alternative Flows and Business Rules rows.`

**16. "Use Case Name" wraps onto two lines in every header row** (`preamble.tex`)
Widen `\ucdoerw` from 2.6 cm to 2.9 cm (and shrink `\uclabelw` to 3.0 cm to compensate), or set the label in `\small`.

**17. §3.3 descriptions omit some required branches** (`03_analysis.tex`)
- UC001, current: `…both invalid data and a duplicate phone number loop back to the form, while a valid registration ends with the signed-in member area.` Append: `; the Guest may also leave the form, which ends the activity without an account.`
- UC004, current: `…and a valid code is saved with its eligible ranks.` Replace: `…and a valid code is saved with its eligible ranks or, when no rank is selected, without a rank restriction.` README §6.4 requires the `[có giới hạn hạng] / [không giới hạn hạng]` branch.
- UC008, current: `completed (with payment and points)`. Replace: `completed for pickup orders only (with payment and points)`.

**18. Error messages come from mixed sources**
UC003 E1 quotes the UI message translated ("Member not found"), while UC010 E2 quotes the backend message ("Customer not found"). Both appear for the same lookup failure. Either use the backend messages throughout, or write `the system reports that no member has this phone number` in both places.

**19. UC003 / UC010 actor naming**
UC003 says "Store Customer / Caller", UC010 says "Store Customer", and the §3.3 intro says "a lane for the customer at the counter". This is acceptable, but use the exact lane names in §3.3: `UC003 adds a "Store Customer / Caller" lane and UC010 a "Store Customer" lane.`

---

## Checks that passed (no action)
- The actors match README §3.2 / A1-01: 6 actors, Manager and Admin kept separate, no payment, OTP or GPS actors, and the boundary is stated. The Manager and Admin "may also use Staff functions" matches `require_staff`, and the UC004 Admin-only claim matches `require_system_admin`.
- UC001 has no OTP and ends at the member area (`/account/membership`); the duplicate-phone branch is present.
- UC002 and UC003 end at order creation with `preparing` / `unpaid`; there are no points, no payment and no delivery record (README §9, checklist).
- UC003 has the non-member branch and the lookup-not-found branch, and states the dine-in/delivery rule, "discount requires member", the independent source / fulfilment / serving attributes, and the creating employee.
- UC005 covers the empty list, the not-assigned case (403), invalid transitions, a failure reason of 1–255 characters, the shortened API path, points once, the 100/300/700 thresholds, and the exclusion of the delivery fee from points.
- UC008 transitions match `update_order_status` exactly; the delivery record is created as `pending_assignment` when the order becomes ready.
- UC009 checks (ready delivery order, active shipper, same branch, assigned/reassigned audit) match `assign_shipper`.
- UC010 checks (multiple of five, ≥5, active bottled reward, optional member, audit log) match `create_exchange`.
- The include/extend reasoning (points are awarded at completion, not at creation; Login is a precondition, not an include) agrees with README §4.3.
