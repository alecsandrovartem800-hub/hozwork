# SPORT LOUNGE — Task Tracker (Unified Service, Google Auth & Ultra-Premium Icons)

## Phase 1: Dynamic Client Configuration
- [ ] Update `frontend/src/lib/api.ts` (Dynamic API_URL depending on client location)
- [ ] Update `frontend/src/app/login/page.tsx` (Fix OAuth redirect URI with trailing slash)

## Phase 2: Express Server - Single Domain Setup
- [ ] Update `server/src/index.ts` (Serve Next.js static output from `frontend/out/` and add SPA routing fallback)

## Phase 3: Ultra-Premium SVG Icons Redesign
- [ ] Redesign `frontend/src/components/ui/Icons.tsx` (Implement double-stroke thin line art for Hookah, Leaf, Sparkles, and Liquids)

## Phase 4: Order Logic & Profile Optimizations
- [ ] Update `frontend/src/app/create/page.tsx` (Pre-fill client data from db, send user_id, enhance mix builder layout)
- [ ] Update `frontend/src/app/profile/page.tsx` (Fallback UI when profile db trigger is not yet fully executed)

## Phase 5: Verification & Deploy
- [ ] Compile and export Frontend (`npm run build` in `frontend/`)
- [ ] Verify build artifacts in `frontend/out/`
- [ ] Typecheck Backend (`npx tsc --noEmit` in `server/`)
- [ ] Commit and Push changes to `sport-lounge` branch
- [ ] Audit application and verify endpoints
