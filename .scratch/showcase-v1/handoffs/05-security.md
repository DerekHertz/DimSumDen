# Handoff: showcase-v1/05-name-and-font: security

```json
{"ticket": "showcase-v1/05-name-and-font", "cell": "security", "current_step": "security pass; two low notes on the Google Fonts load",
 "artifacts": [],
 "decisions": ["Security pass: CSP (server.mjs:19) adds only fonts.googleapis.com and fonts.gstatic.com, tested, LOW", "index.html:8-10 third-party CSS without SRI, IP leak to Google, LOW; self-hosting is a follow-up for the user"],
 "failures": ["gitleaks not installed; pattern grep and git pickaxe used, no hits"],
 "pending": [{"item": "decide whether to self-host Long Cang", "owner": "user"}]}
```

Batch review with full detail: handoffs/batch-security.md.
