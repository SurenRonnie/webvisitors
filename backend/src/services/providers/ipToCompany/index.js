import { env } from '../../../config/env.js';
import { IpinfoProvider } from './ipinfoProvider.js';
import { CymruProvider } from './cymruProvider.js';
import { MockIpToCompanyProvider } from './mockProvider.js';

const PROVIDERS = {
  ipinfo: IpinfoProvider,
  cymru: CymruProvider,
};

let instance;

export function getIpToCompanyProvider() {
  if (instance) return instance;
  const ProviderClass = PROVIDERS[env.ipToCompanyProvider] || MockIpToCompanyProvider;
  instance = new ProviderClass();
  return instance;
}
