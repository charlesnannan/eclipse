import { defineConfig } from 'rolldown';

export default defineConfig({
    // Lit is defined as a peer dependency, as it would lead to duplicate third-party code
    // if the consumer were to import multiple components that depend on it.
    external: /^lit/,
    input: 'src/main.ts',
    // TypeScript's experimental decorators are used over standard ones for optimal compiler output.
    // See https://lit.dev/docs/components/decorators/#compiler-output-considerations.
    tsconfig: true,
    output: {
        file: 'dist/eclipse.js',
    },
});
