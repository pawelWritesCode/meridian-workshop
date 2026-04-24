# Timeline

**RFP #MC-2026-0417 — Inventory Dashboard Modernization**

---

We are proposing a six-week phased delivery. The sequence is deliberate: we establish the foundation (architecture docs, test infrastructure) before building new features, so every change is made safely and Meridian IT can approve work as it ships.

---

## Phase 1 — Onboarding & Foundation (Weeks 1–2)

**Deliverables:**
- Architecture documentation (R4) — produced during onboarding; shared with Meridian IT by end of Week 1
- Reports module audit — full defect inventory shared with operations team for review before remediation begins
- Playwright test infrastructure established; initial smoke tests running against the existing application

**Milestone:** Meridian IT has architecture overview; Meridian operations team has confirmed the Reports defect list.

---

## Phase 2 — Remediation & Testing (Weeks 3–4)

**Deliverables:**
- Reports module remediation complete (R1) — all defects identified in Phase 1 resolved
- Browser test coverage for existing critical flows: inventory by warehouse, order filtering (R3, partial)
- i18n gaps in Reports module addressed (feeds into D2)

**Milestone:** Reports module is clean and covered by tests. IT can review and approve the remediation.

---

## Phase 3 — Restocking Feature (Weeks 5–6)

**Deliverables:**
- Restocking recommendations view, live and integrated (R2)
- Browser tests extended to cover the Restocking flow (R3, complete)
- UI refresh applied across all views (D1) — delivered alongside R2 so the new view ships consistently with the rest of the dashboard
- Full i18n pass for remaining views, priority on Tokyo warehouse screens (D2)

**Milestone:** All required deliverables (R1–R4) complete. Desired items D1 and D2 complete. Full test suite passing. Handoff package ready for Meridian IT.

---

## Stretch (Post-Week 6, if in scope)

- Dark mode (D3) — can be added in a short follow-on sprint if Meridian elects to include it at contract signature

---

## Summary

| Phase | Weeks | Key Deliverables |
|---|---|---|
| 1 — Foundation | 1–2 | Architecture docs (R4), Reports audit, test infrastructure |
| 2 — Remediation | 3–4 | Reports fixes (R1), initial test coverage (R3) |
| 3 — New Feature | 5–6 | Restocking view (R2), full tests (R3), UI refresh (D1), i18n (D2) |
| Stretch | TBD | Dark mode (D3) |

---

**Assumption.** Timeline assumes prompt access to the codebase and a single round of feedback per phase milestone. Delays in client review will shift subsequent phases by equivalent duration. Timeline begins at contract signature.
