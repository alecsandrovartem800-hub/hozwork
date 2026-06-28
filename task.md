# SPORT LOUNGE — Task Tracker (GitHub Pages Deployment & Compatibility)

## Phase 1: Next.js Configuration Updates
- [ ] Update `frontend/next.config.ts` (Dynamic basePath for GitHub Actions build)
- [ ] Update `frontend/src/lib/api.ts` (Dynamic API_URL for github.io domains)
- [ ] Update `frontend/src/app/login/page.tsx` (Dynamic Google OAuth redirect URI with subpath support)
- [ ] Update `frontend/src/app/create/page.tsx` (Dynamic Google OAuth redirect URI inside create page)

## Phase 2: Deployment Automation
- [ ] Create `.github/workflows/gh-pages.yml` (GitHub Pages deploy action for sport-lounge branch)

## Phase 3: Verification & Compilation Check
- [ ] Test Next.js build locally (`npm run build` in `frontend/`)
- [ ] Commit and Push changes to `sport-lounge` branch
- [ ] Monitor GitHub Pages deployment workflow
