# Blended Works

Blended Works is the digital home and growing multidisciplinary business of **Robin + Laura™**—engaged partners building a blended family, a flexible livelihood, and a portfolio of practical products and services together.

The platform brings faith, family, lived experience, technology, creativity, entrepreneurship, outdoor life, and continual learning into one expanding ecosystem. It is intentionally broader than a travel blog or a software company: each new piece should answer a real need encountered by the family, its community, or the businesses it serves.

## Brand structure

- **Blended Works** is the public umbrella and operating manager for content, services, applications, collaborations, and future ventures.
- **Robin + Laura™** is the founders' public identity. The mark is used as an unregistered trademark; it is not represented as federally registered.
- **Cornett Industries** is a mostly behind-the-scenes organizational container for future companies and ventures. It is not currently the primary public brand.

The name “Blended Works” reflects three ideas: a blended family, complementary skills and business opportunities, and a healthier blend of work and life.

## Mission

Blended Works exists to help people and organizations build forward through useful knowledge, affordable tools, ethical services, and honest storytelling.

Its guiding standard is that every product, service, recommendation, or partnership should:

- solve a real problem;
- remain as affordable and accessible as a sustainable business allows;
- save people time, money, or avoidable difficulty;
- reflect Christian values through conduct rather than pressure;
- grow from credible experience, careful research, or transparent collaboration;
- protect clients and the business through sound ethics and business practices; and
- create opportunities to learn, teach, and empower others.

## Current content

- **Field Notes** — faith, family, rebuilding, art, gardening, work, outdoor life, travel, and the journey of building Blended Works.
- **From Homeless to Hero** — a developing content series about moving from instability toward housing, purpose, restored relationships, remote or minimalist living, financial independence, and service to others. Future guest stories require clear consent and privacy safeguards.
- **Daily Devotionals** — Scripture, reflection, and prayer shaped by faith, family, mission service, and everyday life.
- **News** — practical reporting and commentary across technology, shelter, power, camping equipment, transportation, and other topics connected to the platform.

## Service directions

Blended Works is building an early portfolio and remains open to aligned opportunities. Current service directions include:

- web and application development;
- business planning, operations, workflows, and documentation;
- design, written content, and digital creative work;
- accounting-oriented support and organization;
- construction and technical consulting; and
- research and document support.

Legal content and tools are limited to general information, research, technology, and document support unless a qualified licensed professional is formally involved. The website does not represent Blended Works as a law firm.

## Product horizon

Future applications may serve business and contractor workflows, general legal research and self-help, devotionals and faith, travel and outdoor life, and family or household organization. Potential access models include free resources, one-time purchases, optional subscriptions, paid services, sponsored access, and selective sliding-scale support.

Future offerings are described as plans or directions until they are actually available. The site should never imply that Blended Works already has clients, contracts, endorsements, products, or credentials that it does not possess.

## Repository architecture

This is a Turborepo monorepo using npm workspaces.

```text
apps/
  web/                Public Blended Works site and custom admin dashboard
  business-composer/ Internal content-management application
  docs/               Supporting Next.js application
packages/
  platform/           Shared platform domain types and helpers
  ui/                 Shared React components and styles
  eslint-config/      Shared lint configuration
  tailwind-config/    Shared Tailwind/PostCSS configuration
  typescript-config/  Shared TypeScript configuration
```

The public site uses Next.js, React, TypeScript, Tailwind CSS, Clerk authentication, and Sanity as a headless content database. Content administration occurs through the first-party `/admin` dashboard; the Sanity write token remains server-only.

## Local development

Requirements:

- Node.js compatible with the repository's current Next.js version
- npm
- environment variables copied from the relevant app's `.env.example`

Install dependencies and start the monorepo:

```bash
npm install
npm run dev
```

Common verification commands:

```bash
npx prettier --check "**/*.{ts,tsx,md}"
npm run lint
npm run check-types
npm run build
```

Run a single workspace when needed:

```bash
npm run dev --workspace=web
npm run build --workspace=web
```

## Content and privacy principles

- The family is described generally; children's names, ages, schools, custody details, and routine locations are not published.
- Public location is limited to Washington State unless Robin and Laura intentionally update that boundary.
- Difficult experiences may be discussed honestly, but active legal strategy, identifying allegations, and private third-party information do not belong in general biography content.
- Faith should be visible through values, personal stories, and invitations without pressure.
- Partnerships and endorsements must be reviewed for ethical and moral alignment.

## Status

Blended Works is in active development. Its content, service portfolio, applications, partnerships, travel plans, and future ventures will expand as Robin and Laura build, test, document, and learn.

© Blended Works. Robin + Laura™ is an unregistered brand mark.
