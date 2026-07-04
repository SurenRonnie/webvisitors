import { ContactProvider } from './ContactProvider.js';

const FIRST_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey'];
const LAST_NAMES = ['Rivera', 'Chen', 'Patel', 'Novak', 'Owusu'];
const TITLES = ['VP Marketing', 'Head of Growth', 'CMO', 'Director of Demand Gen'];

export class MockContactProvider extends ContactProvider {
  async findContacts({ domain }) {
    return TITLES.slice(0, 3).map((title, i) => {
      const first = FIRST_NAMES[i % FIRST_NAMES.length];
      const last = LAST_NAMES[i % LAST_NAMES.length];
      return {
        name: `${first} ${last}`,
        title,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
        emailConfidence: 65,
        linkedinUrl: `https://linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}`,
      };
    });
  }
}
