<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Browser testing preference

- The user prefers to reload and visually check pages themselves. Make code changes and run appropriate static checks, then provide the local route and what to verify. Do not install or run browser automation unless the user explicitly requests it again.
- If browser automation is authorized later, treat it as temporary tooling and use a separate session for the local site. Do not reuse the user's personal Chrome profile or import personal logins. The user wants the option to uninstall the tooling afterward.
- If `agent-browser` is installed later and the user asks to remove it, uninstall the global package with `npm uninstall -g agent-browser`. Review any downloaded test browsers and saved test sessions separately before removing them.

## Work transition history

- The user asked to preserve the original transition in case they want to restore it. `src/content/work-transition.json` selects `review-only` (only reviews slide; keep the original centered button design) or `slide-all` (the original whole-caption slide from left to right). Keep both variants until the user asks otherwise. The gap-midpoint trigger is shared and should remain unchanged when switching variants. Do not change the center button's markup or typography for animation; the user explicitly asked to restore its original design.

## Animation preference

- Use Motion (motion.dev) for all existing and future animations. Import React APIs from `motion/react` and imperative animation APIs from `motion`. Keep timing defaults in `src/lib/motion.ts` and respect the user's reduced-motion setting.
- Page navigation animates incoming live content only: fade in and rise 32px over 300ms, including cached-page Back/Forward restores. Keep the navbar outside the animated content. Do not reintroduce page snapshots or navbar clipping masks.
- Keep CSS for layout and static states; do not add CSS keyframes, CSS transitions, or a separate animation library. Three.js remains the sphere renderer; Motion drives its animation progress.
