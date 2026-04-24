# Technical Approach

**RFP #MC-2026-0417 — Inventory Dashboard Modernization**

---

We have reviewed the existing codebase (Vue 3 + FastAPI + flat JSON data layer), the previous vendor's handoff notes, and the known gaps described in the RFP. Our approach addresses each requirement in Meridian's stated priority order. Where the RFP or clarifying question responses identified ambiguity, we have documented our assumptions explicitly below.

---

## R1 — Reports Module Remediation

**Approach.** We will begin with a structured audit of the Reports module — reviewing `Reports.vue`, its supporting API endpoints (`/api/reports/quarterly`, `/api/reports/monthly-trends`), and the filter wiring between the frontend and backend. The previous vendor's handoff notes confirm that filters were not fully implemented and that some views remain on an older Options API pattern inconsistent with the rest of the codebase. We will identify all defects during a discovery sprint at engagement start and remediate them in full.

Known areas of investigation include: filter query parameter handling, i18n coverage gaps in report labels and date formatting, API response shape inconsistencies, and any console errors introduced by incomplete implementation.

**Assumption.** No issue log was provided by Meridian; all defects identified during discovery are in scope under this requirement. We will share the audit findings with Meridian's operations team before remediation begins so there are no surprises.

---

## R2 — Restocking Recommendations

**Approach.** We will deliver a new Restocking view as a first-class module in the dashboard, consistent with the existing navigation and layout patterns. The recommendation engine will draw on data already present in the system: current stock levels (inventory data), demand forecasts, and historical purchase order data for unit cost estimates.

The recommendation logic will: (1) identify items at or below a configurable reorder threshold, (2) rank candidates by demand urgency, (3) generate suggested order quantities, and (4) cap the total order value at an operator-supplied budget ceiling entered directly in the view. Output will be a prioritized list of recommended purchase orders showing item, suggested quantity, estimated unit cost, and line total.

The new view will require a new backend endpoint that accepts the budget ceiling as a parameter and returns ranked recommendations.

**Assumption.** No live supplier pricing feed is available. Unit cost estimates will be derived from historical purchase order data already in the system. If actual supplier pricing differs materially, Meridian should plan to integrate a pricing feed in a future phase.

---

## R3 — Automated Browser Testing

**Approach.** We will establish end-to-end browser test coverage using Playwright, which is already configured in the project. Tests will cover the critical flows confirmed in Meridian's response to our clarifying questions: browsing inventory by warehouse, filtering orders, and the new Restocking view delivered under R2.

Tests will be written to run against the local development environment and structured so Meridian IT can run them as part of any future change review. Coverage will be sufficient for IT sign-off per the stated requirement.

All tests will be delivered alongside the features they cover — not added at the end of the engagement.

---

## R4 — Architecture Documentation

**Approach.** We will deliver a current-state architecture overview as a self-contained HTML document, suitable for handoff to Meridian IT. It will cover: the Vue 3 frontend and its view/component structure, the FastAPI backend and all API endpoints, the JSON data layer, and the data flow between them. Each view will be mapped to its corresponding API endpoints.

This deliverable will be produced at the start of the engagement — it serves as our own onboarding artifact as much as a client deliverable, which means it will reflect the actual system rather than the previous vendor's incomplete notes.

---

## D1 — UI Modernization

**Approach.** We will deliver a clean, professional visual refresh of the existing interface, working within the established design token system (slate/gray palette, status colors, CSS Grid layouts). The refresh will improve spacing and typography consistency across views without introducing a new framework or changing interaction patterns. Meridian's operations team will not need retraining.

Scope will be calibrated to a meaningful improvement over the current state. We are not proposing a full redesign.

**Assumption.** No brand guide or reference design system was provided. Visual direction is at vendor's discretion, per Meridian's clarifying question response.

---

## D2 — Internationalization

**Approach.** We will extend i18n support to the remaining views currently served in English only. Priority will be given to views used by Tokyo warehouse staff, consistent with Meridian's clarifying question response. This work is complementary to R1 — i18n gaps in the Reports module will be addressed as part of remediation; remaining views will be covered here.

---

## D3 — Dark Mode

**Approach.** We will implement an operator-selectable dark theme using CSS custom properties, swapping the existing light token set for a dark equivalent. The toggle will be accessible from the main navigation. This is a genuine stretch item and will be scoped accordingly.

---

## Delivery Principles

Every deliverable in this engagement ships with documentation and test coverage. Handoff to Meridian IT is a first-class deliverable — not an afterthought. We will not leave Meridian in the same position they are in today: with a system that works but that no one can confidently change.
