import * as cheerio from 'cheerio';
import { ContactProvider } from './ContactProvider.js';

// Zero-cost alternative to Apollo: reads the names/titles a company already publishes on
// its own "Team"/"Leadership" page (first-party data — not scraping LinkedIn, which would
// violate its Terms of Service), then guesses a work email from the common
// firstname.lastname@domain pattern. Unverified, so emailConfidence is deliberately low.

const TEAM_PATHS = [
  '/team',
  '/about/team',
  '/about-us/team',
  '/leadership',
  '/about/leadership',
  '/company/team',
  '/our-team',
  '/people',
  '/about',
  '/company',
];

const TITLE_KEYWORDS = [
  'ceo',
  'cto',
  'cfo',
  'coo',
  'cmo',
  'founder',
  'co-founder',
  'president',
  'vp ',
  'vice president',
  'head of',
  'director',
  'chief',
  'manager',
];

const DEFAULT_TITLES = ['VP Marketing', 'Head of Marketing', 'CMO', 'Director of Growth', 'VP Sales', 'CEO', 'Founder'];

function looksLikeTitle(text = '') {
  const lower = text.toLowerCase();
  return TITLE_KEYWORDS.some((kw) => lower.includes(kw));
}

function looksLikeName(text = '') {
  const trimmed = text.trim();
  return /^[A-Z][a-zA-Z'.-]+(\s[A-Z][a-zA-Z'.-]+){1,2}$/.test(trimmed) && trimmed.length < 40;
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'VisitorIQ-Enrichment/1.0 (+https://visitoriq.local)' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractPeopleFromHtml(html) {
  const $ = cheerio.load(html);
  const people = [];
  const seen = new Set();

  const addPerson = (name, title) => {
    const key = name.toLowerCase();
    if (!name || seen.has(key) || !looksLikeName(name)) return;
    seen.add(key);
    people.push({ name: name.trim(), title: title?.trim() || undefined });
  };

  // schema.org Person markup, when a site bothers to add it — most reliable signal.
  $('[itemtype*="Person"], [typeof*="Person"]').each((_, el) => {
    const name = $(el).find('[itemprop="name"]').first().text().trim();
    const title = $(el).find('[itemprop="jobTitle"]').first().text().trim();
    addPerson(name, title);
  });

  // Fallback heuristic: common "team card" containers pairing a heading (name) with
  // nearby text that reads like a title.
  if (people.length === 0) {
    $('.team-member, .team-card, .person, .staff-member, [class*="team-member"], [class*="person-card"], [class*="staff-card"]').each(
      (_, el) => {
        const heading = $(el).find('h1,h2,h3,h4,h5,strong').first().text().trim();
        if (!heading) return;
        const rest = $(el).text().replace(/\s+/g, ' ').replace(heading, '').trim();
        const titleCandidate = rest.split(/[.\n]/)[0].slice(0, 60);
        addPerson(heading, looksLikeTitle(titleCandidate) ? titleCandidate : undefined);
      }
    );
  }

  return people;
}

function guessEmail(name, domain) {
  const parts = name
    .toLowerCase()
    .split(/\s+/)
    .map((p) => p.replace(/[^a-z]/g, ''))
    .filter(Boolean);
  if (parts.length < 2) return undefined;
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!first || !last) return undefined;
  return `${first}.${last}@${domain}`;
}

export class OwnDatasetContactProvider extends ContactProvider {
  async findContacts({ domain, titles = DEFAULT_TITLES }) {
    console.log('[own-dataset-contacts] scanning team pages', { domain });
    let people = [];

    for (const path of TEAM_PATHS) {
      const html = await fetchPage(`https://${domain}${path}`);
      if (!html) continue;
      const found = extractPeopleFromHtml(html);
      if (found.length) {
        people = found;
        console.log('[own-dataset-contacts] found people on page', { domain, path, count: found.length });
        break;
      }
    }

    const withTitles = people.filter((p) => p.title);
    const titleMatched = withTitles.filter((p) => titles.some((t) => p.title.toLowerCase().includes(t.toLowerCase())));
    const finalList = (titleMatched.length ? titleMatched : withTitles.length ? withTitles : people).slice(0, 5);

    console.log('[own-dataset-contacts] final contacts', { domain, count: finalList.length });

    return finalList.map((p) => ({
      name: p.name,
      title: p.title || 'Unknown',
      email: guessEmail(p.name, domain),
      emailConfidence: p.title ? 35 : 20, // pattern-guessed, never verified — deliberately low
      linkedinUrl: undefined,
    }));
  }
}
