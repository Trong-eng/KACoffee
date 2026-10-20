# Review – Round 1 (Cover, TOC, §1 Introduction, §2 Planning)

Reviewed: `main.pdf` (14 pages, built 2026-10-20 17:02), `main.tex`, `preamble.tex`, `chapters/01_introduction.tex`, `chapters/02_planning.tex`
Compared against: `Example_Report.pdf` pp. 1–14, `KACoffee_Project_Description.pdf`, `KACoffee/KACoffee_UseCases.html`

## Scores

| Criterion | Score | Comment |
|---|---|---|
| (a) Template conformance | **7/10** | All template subsections 1.1–2.4.3 are present with the right titles and order. Problems: an extra 2.3.6, headings are not bold, the TOC title is black and section entries are not bold, and the cover has no logo or rule. |
| (b) Content fidelity | **7.5/10** | Every number checked is correct: 0/100/300/700 points, VND 1,000 per point, VND 20,000 fee, multiples of five bottles, eight weeks, five members, React 19, MySQL 8.4. Problems: some invented claims and examples ("view branches", "reserve an order", the team's domain expertise, CASE tools). The UC002/UC003/UC005 requirements also leave out important outcomes. |
| (c) Writing / layout | **7/10** | Clear academic English, and the "-"/"+" bullets and tables read well. Problems: three large blank areas caused by `[H]` tables, one overfull hbox, some repetition, and mixed tense. |

---

## Prioritised issues

### P1 – High priority (fix before next round)

**1. Extra subsection 2.3.6 breaks the template structure** (`02_planning.tex`, l.146)
The template has only 2.3.1–2.3.5. In the template, schedule and size feasibility sit inside *Technical Feasibility* as the "Project size" bullet. The content itself is justified: the Description has "Schedule and Resource Feasibility", "Initial Risks and Mitigation" and "Initial Feasibility Decision". The heading is not.
- Change: delete `\subsubsection{Schedule Feasibility and Initial Risks}`. Move the schedule paragraph into 2.3.1 as a new bullet:
  `\item \textbf{Project size and schedule:} The working estimate is eight weeks for a five-member team. This is a planning assumption to be aligned with the course timetable. ...`
- Move Table 3 and its lead-in sentence under the existing `\textbf{Technical risks:}` bullet. Alternatively, keep them at the end of 2.3 after an unnumbered bold run-in `\paragraph{Initial risks and feasibility decision:}`.
- Then start the closing paragraph with a bold run-in: `\textbf{Feasibility decision:} The team proposes proceeding ...`

**2. Large blank areas caused by `[H]` tables** (pages 4, 10 and 11 are about 25–45% empty)
- `02_planning.tex`: change `\begin{table}[H]` to `\begin{table}[!htbp]` for all five tables. If a table must stay at its spot, move it so that it follows a short lead-in sentence rather than a long list.
- Table 4 (schedule) leaves half of p.10 empty. Put it directly after the `Time estimate:` paragraph and allow it to float.
- Table 5 (staffing) leaves half of p.11 empty. The same fix applies.

**3. Invented feature: "view branches" on the public website** (`01_introduction.tex`, l.18)
Neither the Description nor UseCases.html lists branch browsing for Guests. The HTML's public pages are home, menu, promotions, register, login and cart.
- Text: `Visitors can browse the menu, view branches and create a customer account using a phone number.`
- Replace: `Visitors can browse the public menu and register as a customer with a phone number.`

**4. Invented scenario in Motivation: "reserve an order"** (`02_planning.tex`, l.5)
The system has no reservation feature. Telephone orders are staff-assisted orders.
- Text: `and call a branch to reserve an order in the evening.`
- Replace: `and place an order by telephone in the evening.`
- Text: `In many small and medium chains, however, these channels are handled by separate tools or by manual notes,`
- Replace (the source makes no market claim): `When these channels are handled by separate tools or manual notes,`

**5. Invented example in Problem Definition** (`01_introduction.tex`, l.7)
The source does not say that walk-in and online customers receive different discounts.
- Delete: `A walk-in customer may receive a discount that an online customer of the same membership rank cannot use, or a completed delivery may never be reflected in the customer's point balance.`
- If an example is wanted, use one that follows from the source, such as: `For example, points may be credited twice for one order, or not at all after a delivery is completed.`

**6. Unsupported paragraph in Problem Definition** (`01_introduction.tex`, l.9)
`These problems grow with the number of branches and channels. Without a single source of truth, the chain cannot ... cannot trace who changed an order and cannot reliably report revenue by branch.`
This paragraph is mostly reasonable, but it is new content and its three "cannot" clauses overstate the problem. Replace it with something closer to the source:
`These difficulties increase with the number of branches and channels, because policies, order updates and sales figures must stay consistent across all of them.`

**7. UC002 requirement omits delivery data and how the total is calculated** (`02_planning.tex`, l.23)
- Text: `... selects a branch and either store pickup or delivery, and may apply a discount code.`
- Replace: `... manages the cart, selects a branch and either store pickup or delivery (providing recipient and address information for delivery), and may apply a discount code. The system validates the code, calculates the final amount including any delivery fee and records the order with its items and initial status.`

**8. UC003 requirement omits branch and employee ownership, and status updates** (`02_planning.tex`, l.24)
- Append: ` The order belongs to the employee's branch and records the employee who created it, and authorised staff update its preparation and completion states.`
- Also add `product selection and drink customisation` to the opening sentence: `Staff create orders for walk-in customers and telephone callers, with product selection, drink customisation, optional member lookup by phone number and eligible discounts.`

**9. UC005 requirement omits the effects of the delivery outcome** (`02_planning.tex`, l.26). This is a core business rule.
- Text: `... and a successful or failed outcome, and the system retains a status history.`
- Replace: `... and a successful or failed outcome, and the system retains a status history. A successful delivery completes the related order, marks its offline payment as paid and triggers eligible loyalty points; a failed delivery remains available for management follow-up and reassignment.`

**10. UC004 requirement omits how codes are applied** (`02_planning.tex`, l.25)
- Append: ` Order processing checks these conditions before applying a code and records its use with the transaction.`

**11. Invented team-expertise claims in Technical Feasibility** (`02_planning.tex`, l.93–94)
The Description says nothing about how familiar the team is with the domain or the stack. The "Familiarity with the technology" bullet also does not describe familiarity.
- Text: `Familiarity with the application: The team understands the business domain of ordering, counter sales and delivery, and has organised it into five core use cases with clear owners.`
- Replace: `Familiarity with the application: The business domain of ordering, counter sales and delivery has been organised into five core use cases, each with a named owner.`
- Text: `Familiarity with the technology: Integrating authentication, pricing and order state changes is the main technical challenge; successful delivery depends on integrating these parts early.`
- Replace: `Familiarity with the technology: The selected stack is suitable for the planned web features. The main challenge is integrating authentication, pricing and order state changes, so these parts will be integrated early.` If the team confirms prior experience with React or FastAPI, state that explicitly.
- Also wrap the sub-bullet labels in `\textbf{...}` (`\textbf{Familiarity with the application:}`), as the template does.

**12. "mature, open-source" is not in the source** (`02_planning.tex`, l.90)
- Text: `The selected stack (Table~\ref{tab:tech-stack}) is mature, open-source and suitable for the planned web features.`
- Replace: `The selected stack (Table~\ref{tab:tech-stack}) is suitable for the planned web features.` "Widely used" is acceptable if the team wants a qualifier.

**13. CASE tools are not in the sources** (`02_planning.tex`, l.242–246)
The sources do not mention draw.io, MySQL Workbench or "swimlane activity diagrams". Only the GitHub task board, Git branches, Alembic and FastAPI are sourced. Confirm with the team, or phrase these as plans: `is planned for`, or `If the project makes use of CASE tools, these would include ...` (the template's own wording). Keep the sourced items as they are.

**14. Headings are not bold** (`preamble.tex`, titleformat lines)
Template headings are bold blue. Report headings use normal weight, and 2.2.1-level headings look weak.
- Text: `\titleformat{\section}{\color{headblue}\fontsize{20}{24}\selectfont}` (and likewise for subsection and subsubsection)
- Replace: `\titleformat{\section}{\color{headblue}\bfseries\fontsize{20}{24}\selectfont}`, with the same change for `\subsection` and `\subsubsection`.
- Optional: the template's blue is closer to `#1155CC` than `#2E74B5`.

### P2 – Medium priority

**15. TOC style differs from the template** (`preamble.tex`)
The template's TOC title is blue and bold, and its section entries are bold.
- Add `\renewcommand{\cfttoctitlefont}{\color{headblue}\bfseries\fontsize{20}{24}\selectfont}`.
- Change `\renewcommand{\cftsecfont}{\normalfont}` to `{\bfseries}`, and change `\cftsecpagefont` to match.
- Optional: `\renewcommand{\cftdotsep}{1}` gives the denser leaders used in the template.

**16. Cover page differs from the template** (`main.tex`)
- The template has a horizontal rule under the school name and the HUST logo. Add `\rule{\textwidth}{0.4pt}` and `\includegraphics[width=3.5cm]{figures/hust_logo}` if a logo is available.
- In the template, the title and project name are both bold and the same size. Make `\ProjectName` bold, e.g. `{\fontsize{22}{26}\selectfont\bfseries \ProjectName\par}`.
- Members' full names, student IDs and emails are placeholders, and the names are given names only. Course code, class code, supervisor and date are also placeholders. All of these must be filled in before submission; for reference, the template's course is "System Design - IT3120E".
- The member table is small. Use `{\large ...}` with left-aligned columns and wider spacing, as the template does.

**17. Overfull hbox (3.45pt)** (`02_planning.tex`, l.96, "Infrastructure needs" bullet)
- Text: `Docker Compose provides a consistent application and database setup for integration and demonstration.`
- Replace: `Docker Compose provides a consistent setup of the application and database for integration and demonstration.` (Any rewording that changes the line break works.)

**18. Bottle exchange rule drops the actor** (`02_planning.tex`, l.60)
- Text: `Each group of five earns one eligible bottled product, for a member or an unregistered customer.`
- Replace: `Each group of five earns one eligible bottled product. Staff can process an exchange for a member or an unregistered customer.`

**19. Discount rule drops the usage-record sentence** (`02_planning.tex`, l.59)
- Text: `The reduction does not exceed the item subtotal. A one-use-per-customer restriction is outside the initial rules.`
- Replace: `The reduction does not exceed the item subtotal. Usage records support transaction history; a one-use-per-customer restriction is outside the initial rules.`

**20. Role-specific sign-in pages are missing** (`02_planning.tex`, "Manage user accounts" bullet, l.20)
- Append: ` Staff, Shipper and Admin have role-specific sign-in pages and work areas, supported by a shared employee authentication service.`

**21. Quality review and final deliverables (Description §4) are missing**
The Description's §4 sections "Quality Review and Final Deliverables" and "Code and Change Management" (readiness criteria and new-requirement assessment) have no place in §2.4. Add two bullets to the "Shared work" list in 2.4.2:
- `\item \textbf{Quality review:} The planned review covers successful transactions, duplicate registration, invalid credentials, cross-account and cross-branch access, ineligible discounts, non-member counter orders and failed deliveries, and checks that completion awards points once and excludes delivery fees.`
- `\item \textbf{Final deliverables:} source code, database migrations and demonstration data, setup instructions, use case and design documentation, the test summary, user guidance and presentation slides.`
- Extend "Change management": `A feature is ready for integration when its main flow, validation behaviour, access rules and documentation have been reviewed. New requirements are assessed for their impact on the five core use cases and the remaining schedule.`

**22. Scope estimation lists only acceptance criteria and gives no scope boundaries** (`02_planning.tex`, l.181–189)
- Change the lead-in to make clear what the bullets are: `... as the shared foundation. Each use case is listed with its acceptance focus:`
- After the list, add the supporting functions and the exclusions, which are important scope facts: `Supporting functions (product, branch and employee management, bottle exchanges, delivery fees, reports, branch targets and the audit trail) are included to complete the order lifecycle, while external payment gateways, SMS verification, live GPS tracking and ingredient-level stock management are outside this release.`
- Rename `\paragraph{Scope size:}` to `\paragraph{Scope Size:}` to match the template.

**23. Time estimate does not state the total** (`02_planning.tex`, l.191)
The template states the overall duration up front.
- Text: `The schedule uses relative project weeks (Table~\ref{tab:schedule}).`
- Replace: `The project will span eight weeks, organised as short iterations and expressed in relative project weeks (Table~\ref{tab:schedule}).`
- Rename `Time estimate:` to `Time Estimate:`.

**24. Label does not match content: "Ease of use"** (`02_planning.tex`, l.120)
The bullet describes sample data and walkthroughs, not usability. Rename `\textbf{Ease of use:}` to `\textbf{Training and walkthroughs:}`.

**25. Redundant opening of 2.4** (`02_planning.tex`, l.170)
- Text: `The project will use short development iterations within the proposed eight-week plan, following an iterative and incremental approach.`
- Replace: `The project will follow an iterative and incremental approach, with short development iterations within the proposed eight-week plan.`
- The template puts the method name in bold, so consider `\textbf{iterative and incremental approach}`.
- `Key reasons for choosing this approach:` should be its own sentence, as the template has it: `Key reasons for choosing this approach are:`

**26. Repetition in Proposed Solution** (`01_introduction.tex`, l.25)
The Staff bullet already covers bottle exchanges, and the Administration bullet already covers reports.
- Text: `The system will also support bottle exchanges, operational reports and records of important business actions.`
- Replace: `The system will also keep records of important business actions for traceability.`

**27. Motivation partly duplicates Business Value and Problem Definition** (`02_planning.tex`, l.7)
The sentence `Shared order and customer records reduce repeated data entry; common pricing, discount and membership checks help staff apply policies consistently; and separate work areas ...` repeats 2.2.3 almost word for word. Shorten it to: `Our team is motivated to design a system in which every order, regardless of its source, follows one lifecycle from creation to completion, with each user group working in its own area.`

**28. Inconsistent capitalisation in the list** (`02_planning.tex`, l.27)
`\textbf{Provide supporting functions:} product and category management, ...`: capitalise the first word, `Product and category management, ...`, to match the other bullets.

### P3 – Low priority / polish

**29. Mixed tense.** Sections 2.2–2.4 mix "will" (from the source) with the present tense ("Each iteration has", "The project uses", "Development is organised"). Pick one: the present for requirements and rules, and "will" for plans in 2.3 and 2.4.

**30. Table 1 column width** (`02_planning.tex`, l.34): `|L{2.1cm}|L{4.0cm}|Y|`. "Provisioned account; username and password" wraps onto three lines in four rows. Use `|L{2.0cm}|L{4.6cm}|Y|`.

**31. Table 5 header wraps** (`02_planning.tex`, l.217): `|L{1.6cm}|L{3.6cm}|Y|` causes "Primary role and use case" to wrap. Use `L{4.0cm}`, or shorten the header to `Role / use case`.

**32. Problem Definition, last sentence of the first paragraph** (`01_introduction.tex`, l.5): `so that everyone knows who is responsible for the order at each moment` is an addition. It is acceptable, but `so that responsibility for the order is clear at each stage` is tighter.

**33. "operating scenario"** (`01_introduction.tex`, l.11): `addresses this operating scenario` is awkward. Use `addresses these problems`.

**34. Proposed Solution, Customer bullet** (`01_introduction.tex`, l.19): the source lists "membership points and notifications". "Membership rank, points" is fine because rank is in the source elsewhere, so no change is required.

**35. UC title** (`02_planning.tex`, l.186): the Description writes "Create Staff Assisted Order", while UseCases.html writes "Create Staff-Assisted Order (In-Store / Phone)". The hyphenated form is fine; use it consistently in later chapters.

**36. Caption numbering**: the template uses plain numbering, so "Table 1…5" is fine. Consider `\counterwithin{table}{section}` only if later chapters have many tables.

**37. Spelling consistency**: the report uses British spelling (fulfil, organise, authorised, practise), which matches the source. Keep it, and avoid "fulfillment" when copying field names from UseCases.html into prose.

---

### Verified correct (no action)
- Membership thresholds New 0 / Silver 100 / Gold 300 / Diamond 700; 1 point per VND 1,000 after discounts; delivery fees and free items excluded; points credited once.
- VND 20,000 default delivery fee, configurable, Hanoi only, no fee for pickup; offline payment; orders start as preparing and unpaid.
- Bottle exchange in positive multiples of five; discount types are percentage or fixed VND.
- Tech stack table, risk table (all leads), schedule table and staffing table all match the Description exactly.
- Eight weeks, five members, member/UC ownership and peer-review pairings are all correct.
