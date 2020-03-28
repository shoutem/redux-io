import { extractHeaders } from './headers';

export function extendMetaWithResponse(meta) {
  return (action, state, res) => {
    const response = {
      status: res && res.status,
      headers: extractHeaders(res),
    };

    return { ...meta, response };
  };
}
