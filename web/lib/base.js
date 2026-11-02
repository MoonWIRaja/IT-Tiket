export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const go = (path) => location.assign(`${BASE}${path}`);
