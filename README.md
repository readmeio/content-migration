# Content Migration 📦

<a href="https://github.com/readmeio/rdme"><img src="https://img.shields.io/github/actions/workflow/status/readmeio/content-migration/ci.yml?branch=main&style=for-the-badge" alt="Build status"></a>
<a href="https://readme.com"><img src="https://raw.githubusercontent.com/readmeio/.github/main/oss-badge.svg" /></a>

<a href="https://unmaintained.tech/"><img src="https://unmaintained.tech/badge.svg" /></a>

This repository contains the scripts used as part of ReadMe's content migration in November 2022. This can be used to migrate pages within and across [project versions](https://docs.readme.com/main/docs/versions), as well as within and across ReadMe projects.

## Technical Overview

This script uses [TypeScript](https://www.typescriptlang.org/), [`node-fetch`](https://www.npmjs.com/package/node-fetch) and [the ReadMe API](https://docs.readme.com/main/reference). For each old/new slug pair in [`data.json`](./data.json), it migrates the title and body content from the page located at the old slug to the page located at the new slug.

## Setup

1. Install [Node.js](https://nodejs.org/) (at least v16) and then run the following command to install the dependencies:

```sh
npm install
```

2. Copy [`.env.sample`](./.env.sample) to `.env` with the following command:

```sh
cp .env.sample .env
```

3. Populate the `.env` file with the [ReadMe API key](https://docs.readme.com/main/reference/intro/authentication)(s) and [project version](https://docs.readme.com/main/docs/versions)(s) you wish to migrate to and from.

4. Populate [`data.json`](./data.json) with the slugs of the pages you wish to migrate.

5. If the new slugs (i.e. the slugs in the new project/version you're migrating to) don't all exist already, you can run the following to create placeholder pages (note that all pages will automatically be placed in the first guides category, so you'll need to rearrange them later):

```sh
npm run create
```

## Running the Migration Script

1. We recommend performing a dry run beforehand. This will confirm that every page in `data.json` exists. You can do so with the following:

```sh
npm run dry
```

2. You can run the migration script with the following:

```sh
npm run migrate
```

## Disclaimer

Feel free to contribute if you notice any glaring typos or issues, but this repository is not accepting feature requests. These scripts are intended to document our process for this one migration and may or may not fit all of your migration needs.
