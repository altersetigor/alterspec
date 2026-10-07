/**
 * Pinned design-system files, loaded from the CDN with subresource integrity. Checked on 2026-10-07; when bumping a
 * version, recompute the hash: curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
 */
export const CDN = {
  bootstrap: {
    url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css',
    integrity: 'sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB',
  },
  tabler: {
    url: 'https://cdn.jsdelivr.net/npm/@tabler/core@1.6.1/dist/css/tabler.min.css',
    integrity: 'sha384-tT2UAGE9hxG/p5d0iGIvZ/s8El3nWWG3tfG02i8iOY5Pbf8cZZRVmcrrVs+JG5Vw',
  },
  tailwind: {
    url: 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3/dist/index.global.js',
    integrity: 'sha384-2ql948lIdLcGEE0/qxNiudyTjgauA3RDJERu5xW75kFCvSl5a9odyQYCb6tEjnmB',
  },
} as const;

export const stylesheet = (f: { url: string; integrity: string }) =>
  `<link rel="stylesheet" href="${f.url}" integrity="${f.integrity}" crossorigin="anonymous">`;
export const script = (f: { url: string; integrity: string }) =>
  `<script src="${f.url}" integrity="${f.integrity}" crossorigin="anonymous"></script>`;

export const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');
