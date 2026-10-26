import type { StorybookConfig } from '@storybook/react-vite';
import { buildUtilities } from '../tools/utilities/build.mjs';
import { buildRegistry } from '../tools/build/registry.mjs';

// src/styles/index.css imports the generated utilities.css; make it from the template and tokens first.
buildUtilities(new URL('..', import.meta.url).pathname);
// …and the export, style and label lists from the component folders (src/generated/).
buildRegistry(new URL('..', import.meta.url).pathname);

// Storybook is the system's documentation: npm run storybook (on your computer), npm run build-storybook (CI).
const config: StorybookConfig = {
  framework: { name: '@storybook/react-vite', options: {} },
  stories: ['../docs/**/*.mdx', '../src/**/*.mdx', '../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  core: { disableTelemetry: true },
  docs: { defaultName: 'Docs' },
  viteFinal: async (cfg) => {
    // The source reads the version from package.json at build time, as tsup does.
    const { readFileSync } = await import('node:fs');
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    cfg.define = { ...(cfg.define || {}), __VERSION__: JSON.stringify(version) };
    // Vite's CSS minifier (Lightning CSS) rewrites :dir(rtl) as a list of right-to-left :lang()s for older browsers,
    // so a page with dir="rtl" but no such lang wouldn't flip its chevrons and arrows. Keep :dir() as the package ships it.
    const { Features } = await import('lightningcss');
    cfg.css = { ...cfg.css, lightningcss: { ...cfg.css?.lightningcss, exclude: (cfg.css?.lightningcss?.exclude ?? 0) | Features.DirSelector } };
    return cfg;
  },
};
export default config;
