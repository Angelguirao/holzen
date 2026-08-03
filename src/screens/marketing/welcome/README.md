# Welcome landing (SPA)

Port of Figma Make [Animated Background Colors](https://www.figma.com/make/58fanoTVfFFzMrgx4a8jyh/Animated-Background-Colors) into Holzen.

- Route: `/` (`PublicOnlyRoute`); legacy `/welcome` redirects here
- Authenticated Home: `/home`
- Waitlist: `waitlist-api.ts` → edge `waitlist-signup` + `landing-ping`
- How it works visual: `PhoneShowcase` (Make-ported pause UI) — not a static phone PNG
- Legal links: Astro `/privacy`, `/terms`

When the product opens for signups, swap waitlist CTAs for `/auth` — keep this page as the acquisition front door.
