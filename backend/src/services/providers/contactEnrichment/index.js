import { env } from '../../../config/env.js';
import { OwnDatasetContactProvider } from './ownDatasetProvider.js';
import { MockContactProvider } from './mockProvider.js';

let instance;

export function getContactProvider() {
  if (instance) return instance;
  instance = env.contactProvider === 'mock' ? new MockContactProvider() : new OwnDatasetContactProvider();
  return instance;
}
