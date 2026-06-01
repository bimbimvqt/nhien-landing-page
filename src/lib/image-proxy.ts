export function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // If it's a URL belonging to our S3 MinIO CDN, proxy it
  const baseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://cdn.skytruong.com';
  if (url.startsWith(baseUrl)) {
    const path = url.substring(baseUrl.length).replace(/^\//, '');
    return `/api/images/${path}`;
  }
  
  return url;
}
