import { CHECK_EXPIRATION } from '../consts';

export default function checkExpiration() {
  return { type: CHECK_EXPIRATION };
}
