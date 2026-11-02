# kamyar-site

The personal site of Kamyar Kazemi: frontend developer, editor and motion designer. Persian at `/`, English at `/en`.

It wears the look of his intro reel: a concrete paper wall, a ruled floor, extruded sticker titles, prints on red blocks. The motion is paper, moving at twelve poses a second the way the reel does: titles under a red strip that gets torn off, work that hangs in black and red until colour bleeds through it, buttons that stamp, a red sheet pulled across the page when the language changes.

## Stack

React 19, TypeScript (strict), Vite, React Router, GSAP with `@gsap/react`. No CSS framework: one stylesheet with design tokens.

## Run it

```bash
npm install
npm run dev        # http://localhost:5199
npm run build      # type-checks, then builds to dist/
npm run preview    # serves dist/ on http://localhost:5199
```

`npm test` drives the running dev server with Playwright: navigation, the work viewer and the language switch on desktop and phone, then each animation caught mid-action and the reduced-motion version. The scripts load Playwright and `sharp` from a local video-pipeline workspace, so they run on the author's machine.

## Where things live

| Path | What |
|---|---|
| `src/content/site.ts` | every word on the site, in both languages, typed so neither can fall behind |
| `src/router.tsx` | the routes: `/`, `/en`, and a 404 |
| `src/lib/language.tsx` | the language comes from the address; the switch pulls the red sheet across |
| `src/lib/paper.ts` | the paper rules: twelve poses a second, seeded torn edges |
| `src/timelines/` | the authored motion: intro, the tear, the ink, the stamp, scroll |
| `src/components/` | header, sections, the work viewer, the sticker title |
| `public/` | textures from his concrete scan, the work, fonts, the cursor |
| `scripts/` | asset generation (`make-textures`, `make-paper-assets`, `prep-assets`) and the tests |

Reduced motion is a complete version of the site: nothing is covered, the prints are in colour, the language switch is instant.

## Deploy

Built for Vercel. `vercel.json` sets the Vite build, sends every route to the app, and caches the hashed assets for a year. Import the repository in Vercel and deploy; no environment variables are needed.
