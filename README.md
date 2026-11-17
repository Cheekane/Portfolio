# cheekane.com

Brian Park's portfolio. A static site with a home page, one case study page per
job or project, and a playable Cell Growth Simulator demo.

## Stack

| Part       | What it uses                                                                |
| ---------- | --------------------------------------------------------------------------- |
| Site       | [Astro](https://astro.build) with TypeScript (strict), built to static HTML |
| Demo       | One React island, the only JavaScript sent to the browser                   |
| Content    | Typed Astro content collections, written in YAML                            |
| Fonts      | Inter, hosted with the site                                                 |
| Tests      | Vitest (unit), Playwright and axe (end to end and accessibility)            |
| Code style | ESLint, Prettier and `astro check`                                          |
| Hosting    | Private S3 bucket behind CloudFront, described in `portfolio.yaml`          |

## Run it

You need Node 22 or newer.

```bash
npm install
npm run dev
```

The site is then at http://localhost:4321.

## Change the content

Content is data. You should not need to touch a layout to update it.

| To change                        | Edit                          |
| -------------------------------- | ----------------------------- |
| Jobs and their case studies      | `src/content/experience.yaml` |
| Projects and their case studies  | `src/content/projects.yaml`   |
| Name, links, skills, about, etc. | `src/data/profile.ts`         |
| Case study and project images    | `src/assets/work/`            |

Three things worth knowing:

1. **Order is the order in the file.** The first entry in `experience.yaml` is
   the lead feature at the top of the home page. Add a newer job at the top and
   it becomes the lead.
2. **A case study page appears when an entry has a `caseStudy` block.** Its
   address is `/work/<id>/`. Jobs without one show as a single line.
3. **The resume is not in this repo.** The site links to a file in Google Drive
   and embeds Drive's own preview. Upload a new version of that same file in
   Drive and the site shows it, with no deploy.

The content schema lives in `src/content/schema.ts`. A typo or a missing field
fails the build with a message that names the field.

### Open TODOs

Search for `TODO(brian)` to find content that is still missing. A link with no
`href` and the `imageTodos` slots are hidden on the built site. They show as
dashed boxes in `npm run dev` so they are hard to forget.

## Test it

```bash
npm run lint       # ESLint and Prettier
npm run check      # TypeScript and Astro type check
npm test           # unit tests
npm run test:e2e   # builds the site, then runs Playwright and axe against it
```

The first time, install the test browser with `npx playwright install chromium`.

What the tests cover:

- The growth rules of the Cell Growth Simulator.
- The lead feature follows list order, so reordering the list changes the lead.
- Every content file matches the schema and points at images that exist.
- Navigation, every case study page, the 404 page, and the demo's buttons and keys.
- Light and dark themes, with an axe accessibility scan of every page in both.
- No page overflows sideways at 320 px, and only the demo page ships JavaScript.

GitHub Actions runs all of this on every pull request (`.github/workflows/ci.yml`).

Two helper scripts:

- `npm run og` redraws `public/og.png`, the card shown when the site is shared.
- `node scripts/shots.mjs <folder>` saves screenshots of every page at five
  widths in both themes, for a visual check. Run `npm run preview` first.

## Deploy it

The site is hosted on AWS in `ca-central-1`, using the AWS CLI profile
`cheekane`. Both scripts take `-e dev` or `-e prod` (default `prod`).

```bash
./deploy_stack.sh -f portfolio.yaml   # only when portfolio.yaml changes
./deploy_content.sh                   # builds the site and publishes dist/
```

`deploy_content.sh` runs `npm ci` and `npm run build`, syncs `dist/` to the
bucket, then clears the CloudFront cache. Files under `_astro/` have a hash in
their name and are cached for a year. Everything else is checked on each visit.

### Why there is a CloudFront Function

Astro builds each page as a folder with an `index.html` inside it, so the
address is a clean `/work/jitto/`. A private S3 bucket only serves exact file
names and does not know that `/work/jitto/` means `/work/jitto/index.html`.
The small function in `portfolio.yaml` adds `index.html` to those requests.
The same template sends missing pages to the site's own `404.html`.

Deploy the stack before the content the first time, or folder addresses will
not resolve.
