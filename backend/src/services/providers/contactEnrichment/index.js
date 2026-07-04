import { env } from '../../../config/env.js';
import { ApolloProvider } from './apolloProvider.js';
import { MockContactProvider } from './mockProvider.js';

let instance;

export function getContactProvider() {
  if (instance) return instance;
  instance = env.contactProvider === 'apollo' ? new ApolloProvider() : new MockContactProvider();
  return instance;
}
