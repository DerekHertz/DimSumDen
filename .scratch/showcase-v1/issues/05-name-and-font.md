# 05: Dim Sum Den name and Long Cang

**Type:** feature

**Priority:** P1

**What to build:** Title the app Dim Sum Den (page title and header). Load Long Cang from Google Fonts for display text only (scene labels, the header title, board heading); UI copy stays Nunito. Station labels over the grove sit on a rice-paper pill.

**Blocked by:** None

**Status:** in-review

- [ ] Page title and header read Dim Sum Den; tests updated
- [ ] CSP still allows the font load (bridge CSP test updated if needed)
- [ ] No UI copy or numbers use Long Cang

## Comments
- **Showcase sprint (user, 2026-09-29):** ship a demoable v1 tonight. Relay is developer then qa verify; risk-check decides security. Mockups: https://claude.ai/artifact/LQjpimx1jfX5bjZEoTo3za
- **qa, 2026-09-29:** QA pass. Risk: smoke.mjs fails on a failed Google Fonts request offline (smoke.mjs:91-97); consider self-hosting or allowlisting. Fonts and pills need user eye.
