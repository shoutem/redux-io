import { CONTEXT } from './context';
import { isValid as isValidStatus, isBusy as isBusyStatus} from './status';

export const isValid = obj => isValidStatus(obj[CONTEXT]);

export const isBusy = obj => isBusyStatus(obj[CONTEXT]);
