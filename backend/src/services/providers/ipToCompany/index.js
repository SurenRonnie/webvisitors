import { env } from '../../../config/env.js';
import { IpinfoProvider } from './ipinfoProvider.js';
import { MockIpToCompanyProvider } from './mockProvider.js';

let instance;

export function getIpToCompanyProvider() {
  if (instance) return instance;
  instance = env.ipToCompanyProvider === 'ipinfo' ? new IpinfoProvider() : new MockIpToCompanyProvider();
  return instance;
}
