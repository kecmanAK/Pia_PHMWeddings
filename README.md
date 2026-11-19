# PHM Weddings

An interactive wedding photography portfolio built with Next.js, TypeScript, Tailwind CSS, and Sanity Studio. It includes a WebGL homepage gallery, a Work index, individual wedding galleries, an About page, and a contact form.

## Tech stack

- Next.js 16 with the App Router
- React 19
- Three.js WebGL rendering
- TypeScript in strict mode
- Tailwind CSS 4
- ESLint with Next.js Core Web Vitals rules

## Requirements

- Node.js 22.12 or newer. Use Node.js 24 LTS for deployment.
- npm 10 or newer

## Installation

Clone the repository, then install the locked dependency versions:

```bash
npm ci
```

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Quality checks

Run the linter:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run start
```

## Project structure

```text
src/
  app/
    globals.css              Global design tokens and motion styles
    layout.tsx               Root metadata and document layout
    page.tsx                 Homepage server component
  components/
    rotating-gallery.tsx     Interactive WebGL sphere client component
  studio/                    Sanity Studio components
```

Manage website photographs in Sanity Studio. The site renders the published homepage selections, wedding galleries, and About portrait.

## Environment and credential safety

- `.env*` is ignored by Git and must never be committed.
- Never place API tokens, passwords, private keys, or credentials in source files.
- The `SANITY_STUDIO_` prefix exposes values to the Studio browser bundle. Use it for public configuration only.

## Deploy the website to Vercel

1. In Vercel, import `kecmanAK/Pia_PHMWeddings` from GitHub. Use the repository root, the **Next.js** framework preset, Node.js **24.x**, and the default build settings. The build command in this repository is `npm run build`.
2. Add the following variables in **Settings → Environment Variables** for **Preview** and **Production** as needed. Redeploy after changing environment variables. [Vercel environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables)

   | Variable | Value |
   | --- | --- |
   | `SANITY_STUDIO_PROJECT_ID` | `7yjjpvrl` |
   | `SANITY_STUDIO_DATASET` | `production` |
   | `RESEND_API_KEY` | Server-side key for sending contact emails when delivery is enabled |
   | `RESEND_FROM_EMAIL` | Sender address on a verified Resend domain when delivery is enabled |
   | `SANITY_API_READ_TOKEN` | Server-side read token if the dataset is private. Omit for the public dataset. |

3. Keep `main` as the production branch. In **Deployments → Create Deployment**, select `feature/homepage-prototype` for the first preview. The initial commit on `main` contains only a README. Check the homepage sphere, Work and wedding galleries, About, and Privacy notice on desktop and mobile before merging. [Vercel Git deployments](https://vercel.com/docs/git)
4. Set the final domain after preview approval. If the chosen Vercel deployment has access protection, the About page preview embedded in Studio needs to be able to load that deployment. Use the final public website URL for the hosted Studio.

Vercel Hobby covers personal, non-commercial use. If the portfolio is used to attract paid photography bookings, Vercel classifies that use as commercial and requires Pro or Enterprise. [Vercel fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)

## Deploy Sanity Studio

Use the same Sanity project and dataset to keep the existing content. Run these commands from the repository root after the Vercel website URL is available:

```bash
npm ci
npx sanity login

export SANITY_STUDIO_PROJECT_ID=7yjjpvrl
export SANITY_STUDIO_DATASET=production
export SANITY_STUDIO_PREVIEW_URL=https://your-website.example

npm run studio:build
npm run studio:deploy
```

Sign in with a Sanity account that has permission to deploy the Studio. At the first deploy, choose an available `*.sanity.studio` hostname. Save the resulting app ID as `SANITY_STUDIO_APP_ID` in your local `.env.local` to reuse that Studio for later releases. Sanity-hosted Studio URLs work without extra CORS origins. The website reads Sanity on the server. [Sanity Studio deployment](https://www.sanity.io/docs/studio/deployment), [Sanity CORS](https://www.sanity.io/docs/content-lake/cors)

Open the hosted Studio, sign in, and confirm that the About page preview loads from the website URL. Under **Privacy notice**, publish the edited notice. The **Hide privacy notice** switch controls both the footer link and access to `/privacy` after publishing.

## About biography in Sanity

The About page shows its built-in biography until a Sanity project is connected and the About document is published.

1. Create a project and dataset in [Sanity Manage](https://www.sanity.io/manage). Set `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` in `.env.local` and in the website’s deployment environment. For a private dataset, also set the server-only `SANITY_API_READ_TOKEN` to a read-only token.
2. Run `npm ci`, then `npx sanity dev`. Open the Studio at [localhost:3333](http://localhost:3333) and sign in with your Sanity account.
3. Open **About page → Biography**. The existing copy is prefilled. Leave a blank line between paragraphs and select **Publish**. The website rechecks for published changes after one minute.

In **About page**, open **Page preview** to see edits to the biography and portrait before publishing. Switch between **Desktop** and **Mobile** in the preview. Keep the local Next.js server running at `http://localhost:3000` when using the local Studio. For hosted Studio, set `SANITY_STUDIO_PREVIEW_URL` to the origin serving the website's `/about/preview` route.

## Contact form

In Sanity Studio, open **Contact**, enter the public **Contact email**, and publish. The website displays this address and sends enquiries to it. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env.local` and in the deployment environment to enable delivery. Use a sender on a [verified Resend domain](https://resend.com/docs/dashboard/domains/introduction). Replies go to the visitor’s email address.

Set **Instagram username** in the same document to update the links in the footer and contact bar. You can publish the username while leaving the email blank. The site uses `@phmweddings` when the Instagram field is blank.

## Weddings in the future Sanity CMS

- The editor selects exactly four highlight photos from each wedding’s gallery and can edit its quote. The website chooses the layout from the photos’ original aspect ratios.
- Make the review optional. A blank review is hidden on Work and in the wedding gallery. Default **Show review on Work** to on (`showReviewOnWork`). Turning it off keeps the review in the gallery only, which gives longer names more room on Work. Whenever Work has no review to display, center the couple’s name and gallery link on desktop and mobile.
- Display the four highlights as two pairs. Use the five Figma variations as a reference for portrait and landscape pairings, changes in photo size and emphasis, and staggered placement for similarly shaped photos. Favor a different arrangement from the previous wedding when several patterns fit. Keep the layout stable across reloads. [Photo pair variations](https://www.figma.com/design/aHCPZmWkc66eO6vZ5IAFeb/Untitled?node-id=544-345)
- Place the couple’s name, “view gallery” link, and quote in the white gap between the two pairs. Alternate the link and quote sides between weddings. Make the whole name and link block tappable and let the gap grow for longer quotes. For implementation, try a slightly larger, darker quote and a subtle underline on “view gallery.” [Mobile Work mockup](https://www.figma.com/design/aHCPZmWkc66eO6vZ5IAFeb/Untitled?node-id=544-404)

## Git workflow

- Keep `main` deployable and stable.
- Develop changes on focused branches such as `feature/homepage-prototype`.
- Use clear commit messages, for example `feat: add rotating homepage gallery`.
- Open a pull request for review before merging into `main`.
- Do not push, merge, or deploy without explicit approval.

## Launch checkpoint

Commit `30741d3` is on `feature/homepage-prototype` on GitHub. The website and Studio production builds passed locally. The Vercel site is online. Sanity project `7yjjpvrl` has three published wedding galleries and a published privacy notice in the public `production` dataset.

1. Verify the two Sanity environment variables are set for the active Vercel environment, redeploy, and check that Tara & Matej appears on Work and that the gallery opens. The Vercel-to-Sanity connection is still unverified.
2. Review the requested website edits and identify which additional fields Pia needs in Sanity Studio. Make the website and schema changes on the development branch, then commit the reviewed changes.
3. Deploy Sanity Studio for Pia using the existing project and the Vercel website URL for the About preview. Check editor access for both accounts. Pia’s local sign-in worked, and the other member’s sign-in still needs checking.
4. Review and publish the content edits in Sanity. Publish Pia’s contact email, configure Resend, and verify delivery with a test enquiry. Confirm the controller’s legal name and contact details, enquiry retention, and the production providers before finalizing the privacy notice.

To resume local editing, start `phm-sanity-studio` in Docker Desktop and open [Sanity Studio](http://localhost:3333/). Start the Next.js preview separately.
