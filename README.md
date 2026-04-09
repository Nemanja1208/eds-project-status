# EDS Platform — Project Status Site

Customer-facing project dashboard published via GitHub Pages.

## How to Update

All project data lives in **`data/status.json`**. Edit that file, commit, push — the site updates automatically.

### Common Updates

| What changed | Where to edit in status.json |
|-------------|-------------------------------|
| Feature completed | `progress.categories[].items[]` — set `"done": true` |
| New deliverable | Add entry to `deliverables[]` array (newest first) |
| Phase progress | `timeline.phases[].percentComplete` — update the number |
| Phase completed | `timeline.phases[].status` — change to `"complete"` |
| New team member | Add entry to `team[]` array |
| Meeting changed | Edit `process.meetings[]` |
| New ADR | Add entry to `decisions[]` array |
| KPI updated | Edit `kpis[]` current/target values |

Always update `lastUpdated` at the top of the file.

## Viewing Locally

The site uses `fetch()` to load JSON, which doesn't work over `file://`. To preview locally:

```bash
cd docs/
python -m http.server 8000
# Open http://localhost:8000
```

## GitHub Pages Setup

1. Go to repo **Settings > Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` (or `development`), folder: `/docs`
4. Save — site will be available at the Pages URL

**Note:** GitHub Pages on private repos requires a paid GitHub plan (Team or Enterprise). Alternatives: make a separate public repo for the site, or use Cloudflare Pages / Netlify (free for private repos).

---

Provided By Nemo Sensei and his SamurAI army
