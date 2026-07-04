import { ContactProvider } from './ContactProvider.js';
import { env } from '../../../config/env.js';

const DEFAULT_TITLES = ['VP Marketing', 'Head of Marketing', 'CMO', 'Director of Growth', 'VP Sales'];

export class ApolloProvider extends ContactProvider {
  async findContacts({ domain, titles = DEFAULT_TITLES }) {
    const requestBody = { q_organization_domains: domain, person_titles: titles, page: 1, per_page: 5 };
    console.log('[apollo] request', { domain, titles, keySet: Boolean(env.apolloApiKey) });

    const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': env.apolloApiKey },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      console.error('[apollo] request failed', { domain, status: res.status, body: bodyText });
      throw new Error(`Apollo lookup failed with status ${res.status}`);
    }
    const data = await res.json();
    console.log('[apollo] raw response', { domain, peopleCount: data.people?.length ?? 0, data });

    const contacts = (data.people || []).map((person) => ({
      name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
      title: person.title,
      email: person.email && person.email !== 'email_not_unlocked@domain.com' ? person.email : undefined,
      emailConfidence: person.email_status === 'verified' ? 90 : 50,
      linkedinUrl: person.linkedin_url,
    }));
    console.log('[apollo] mapped contacts', { domain, contacts });
    return contacts;
  }
}
