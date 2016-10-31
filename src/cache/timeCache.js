import { getStatus } from '../status';

export function isCacheValid(reference) {
  const { cacheLifetime, modificationTimestamp } = getStatus(reference);
  if (!cacheLifetime) {
    console.warn('You are validating Cache reference without configured cacheLifetime.', reference);
    return true;
  }
  const referenceLifetime = Date.now() - modificationTimestamp;
  return cacheLifetime >= referenceLifetime;
}

export function createCacheSettings(cacheLifetime) {
  return { cacheLifetime };
}
