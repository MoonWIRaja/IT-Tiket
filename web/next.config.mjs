const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
export default { output: 'export', trailingSlash: true, basePath: base, images: { unoptimized: true } };
