/* eslint-disable import/first */
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

import fetch, { Headers } from 'node-fetch';

import data from './data.json';

const DRY_RUN = Boolean(process.env.DRY_RUN);

const README_API_URL = 'https://dash.readme.com/api/v1';

const CURRENT_README_API_KEY = process.env.CURRENT_README_API_KEY;
const NEW_README_API_KEY = process.env.NEW_README_API_KEY || CURRENT_README_API_KEY;

const CURRENT_VERSION = process.env.CURRENT_VERSION;
const NEW_VERSION = process.env.NEW_VERSION || CURRENT_VERSION;

interface Project {
  baseUrl: string;
}

interface Category {
  reference: boolean;
  id: string;
}

interface Doc {
  body: string;
  slug: string;
  title: string;
}

/**
 * Base64-encodes API key and adds any additional headers
 * @param key ReadMe API key
 * @param inputHeaders any additional headers
 * @returns constructed headers object
 */
function constructHeaders(key, inputHeaders = new Headers()) {
  const encodedKey = Buffer.from(`${key}:`).toString('base64');
  const headers = new Headers({
    Accept: 'application/json',
    Authorization: `Basic ${encodedKey}`,
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const header of inputHeaders.entries()) {
    // If you supply `undefined` or `null` to the `Headers` API it'll convert that those to a
    // string.
    if (header[1] !== 'null' && header[1] !== 'undefined' && header[1].length > 0) {
      headers.set(header[0], header[1]);
    }
  }

  return headers;
}

/**
 * Validate that both current and new page exist, and then migrate current body over to new body
 */
export async function migrate() {
  // eslint-disable-next-line no-console
  console.log('⏳ Attempting to migrate docs... ⏳\n');

  try {
    // Fetch current project metadata
    const currentProject: Project = await fetch(README_API_URL, {
      method: 'get',
      headers: constructHeaders(CURRENT_README_API_KEY),
    }).then(res => {
      if (!res.ok) {
        throw new Error(
          `Received a ${res.status} when attempting to fetch project metadata. Double-check the API key in your .env (CURRENT_README_API_KEY)!`
        );
      }
      return res.json();
    });

    let newProject = currentProject;

    // Fetch new project metadata (if project is different)
    if (CURRENT_README_API_KEY !== NEW_README_API_KEY) {
      newProject = await fetch(README_API_URL, {
        method: 'get',
        headers: constructHeaders(NEW_README_API_KEY),
      }).then(res => {
        if (!res.ok) {
          throw new Error(
            `Received a ${res.status} when attempting to fetch project metadata. Double-check the API key in your .env (NEW_README_API_KEY)!`
          );
        }
        return res.json();
      });
    }

    const rawResults = data.map(async page => {
      // Validate that current page exists, return JSON body
      const currentPage: Doc = await fetch(`${README_API_URL}/docs/${page.oldSlug}`, {
        method: 'get',
        headers: constructHeaders(
          CURRENT_README_API_KEY,
          new Headers({
            'x-readme-version': CURRENT_VERSION,
          })
        ),
      }).then(res => {
        if (!res.ok) {
          throw new Error(
            `Received a ${res.status} when attempting to fetch data for ${currentProject.baseUrl}/v${CURRENT_VERSION}/docs/${page.oldSlug}. Double-check that this page exists in ReadMe!`
          );
        }
        return res.json();
      });

      // Validate that new page exists, return JSON body
      const newPage: Doc = await fetch(`${README_API_URL}/docs/${page.newSlug}`, {
        method: 'get',
        headers: constructHeaders(
          NEW_README_API_KEY,
          new Headers({
            'x-readme-version': NEW_VERSION,
          })
        ),
      }).then(res => {
        if (!res.ok) {
          throw new Error(
            `Received a ${res.status} when attempting to fetch data for ${newProject.baseUrl}/v${NEW_VERSION}/docs/${page.newSlug}. Try running 'npm run create' to create this page!`
          );
        }
        return res.json();
      });

      if (DRY_RUN) {
        // eslint-disable-next-line no-console
        console.log(`🎭 dry run! this would update ${page.newSlug} with the contents from ${page.oldSlug}`);
        return false;
      }

      // Update page
      await fetch(`${README_API_URL}/docs/${newPage.slug}`, {
        method: 'put',
        headers: constructHeaders(
          NEW_README_API_KEY,
          new Headers({
            'x-readme-version': NEW_VERSION,
            'Content-Type': 'application/json',
          })
        ),
        body: JSON.stringify({
          body: currentPage.body,
          // Comment out this line below if you don't want to update the page title
          title: currentPage.title,
        }),
      }).then(res => {
        if (!res.ok) {
          throw new Error(
            `Received a ${res.status} when attempting to update ${newProject.baseUrl}/v${NEW_VERSION}/docs/${newPage.slug}`
          );
        }
      });

      // eslint-disable-next-line no-console
      console.log(
        `✍️  Successfully updated page title and body for ${newProject.baseUrl}/v${NEW_VERSION}/docs/${newPage.slug}`
      );

      return true;
    });

    // Resolve and filter results
    const results = (await Promise.all(rawResults)).filter(Boolean);

    // eslint-disable-next-line no-console
    console.log(`\n🚀 Successfully migrated ${results.length} docs! 🚀\n`);
    process.exit(0);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('🚨 Error migrating docs! 🚨\n');
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  }
}

export async function create() {
  // eslint-disable-next-line no-console
  console.log('⏳ Attempting to create placeholder pages... ⏳\n');

  try {
    // fetch project metadata
    const newProject: Project = await fetch(README_API_URL, {
      method: 'get',
      headers: constructHeaders(NEW_README_API_KEY),
    }).then(res => {
      if (!res.ok) {
        throw new Error(
          `Received a ${res.status} when attempting to fetch project metadata. Double-check the API key(s) in your .env!`
        );
      }
      return res.json();
    });

    // fetch list of categories for current version
    const categories: Category[] = await fetch(`${README_API_URL}/categories`, {
      method: 'get',
      headers: constructHeaders(
        NEW_README_API_KEY,
        new Headers({
          'x-readme-version': NEW_VERSION,
        })
      ),
    }).then(res => {
      if (!res.ok) {
        throw new Error(
          `Received a ${res.status} when attempting to fetch list of categories. Double check the version(s) in your .env!`
        );
      }
      return res.json();
    });

    // grab first guides category and use that
    const firstGuidesCategory = categories.find(category => !category.reference);

    if (!firstGuidesCategory) {
      throw new Error(
        'No guides categories found, please create one in the ReadMe dashboard and then run this script again!'
      );
    }

    const results = await Promise.all(
      data.map(async page => {
        // Validate that new page exists before attempting to create one
        const pageExists: boolean = await fetch(`${README_API_URL}/docs/${page.newSlug}`, {
          method: 'get',
          headers: constructHeaders(
            NEW_README_API_KEY,
            new Headers({
              'x-readme-version': NEW_VERSION,
            })
          ),
        }).then(res => res.ok);

        if (pageExists)
          return `Page already exists, not creating it: ${newProject.baseUrl}/v${NEW_VERSION}/docs/${page.newSlug}`;

        // page doesn't exist, let's create it!
        return fetch(`${README_API_URL}/docs`, {
          method: 'post',
          headers: constructHeaders(
            NEW_README_API_KEY,
            new Headers({
              'x-readme-version': NEW_VERSION,
              'Content-Type': 'application/json',
            })
          ),
          body: JSON.stringify({
            category: firstGuidesCategory.id,
            slug: page.newSlug,
            body: `placeholder body, created at ${new Date().toISOString()}`,
            title: `${page.newSlug} (placeholder)`,
          }),
        }).then(async res => {
          if (!res.ok) {
            throw new Error(
              `Received a ${res.status} when attempting to create page located at ${newProject.baseUrl}/v${NEW_VERSION}/docs/${page.newSlug}`
            );
          }
          return `Created placeholder for ${newProject.baseUrl}/v${NEW_VERSION}/docs/${page.newSlug}`;
        });
      })
    );

    // eslint-disable-next-line no-console
    console.log(results.join('\n'));

    // eslint-disable-next-line no-console
    console.log('\n✨ Finished backfilling placeholder pages ✨\n');
    process.exit(0);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('🚨 Error creating placeholder pages! 🚨\n');
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  }
}
