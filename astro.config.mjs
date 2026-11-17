import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://cheekane.com',
  output: 'static',
  // Every page is built as /path/index.html. A CloudFront Function in
  // portfolio.yaml maps /path/ to that file, because a private S3 origin
  // does not do it by itself.
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react(), sitemap()],
});
