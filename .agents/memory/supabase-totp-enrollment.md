---
name: Supabase TOTP enrollment guard
description: Prevent duplicate authenticator factors and keep enrollment separate from sign-in.
---

Treat authenticator verification and enrollment as separate flows. Route accounts with a verified TOTP factor to challenge and verify that factor. Call `mfa.enroll()` only after an explicit setup action and after checking all factor statuses, including unverified factors.

**Why:** A pending factor may not appear in the verified-factor list. Automatically enrolling again can trigger Supabase's duplicate friendly-name error and create confusing recovery work.

**How to apply:** Before enrollment, inspect `mfa.listFactors().all` for any TOTP factor. During sign-in, challenge the existing verified factor by its ID; never attempt enrollment as a fallback. If reset is offered, revalidate the selected factor against the signed-in user's factor list and permit removal only for an unverified TOTP factor; keep verified factors protected.
