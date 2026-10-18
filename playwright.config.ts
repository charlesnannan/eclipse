import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: true,
    retries: 0,
    // Workers are not assigned per browser engine; it is an arbitrary concurrency limit,
    // chosen to balance speed against CPU and memory usage.
    workers: 3,
    reporter: 'dot',
    use: {
        baseURL: 'http://127.0.0.1:8765',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        video: 'off',
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']}
        },
        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                launchOptions: {
                    // Both preferences enable the customizable select in Gecko.
                    // https://github.com/mdn/browser-compat-data/blob/main/css/properties/appearance.json
                    firefoxUserPrefs: {
                        'dom.select.customizable_select.enabled': true,
                        'layout.css.appearance-base.enabled': true,
                    },
                },
            },
        },
        {
            name: 'webkit',
            use: {...devices['Desktop Safari']}
        },
    ],
    webServer: {
        command: 'node tests/server.mjs',
        url: 'http://127.0.0.1:8765/tests/page.html',
        reuseExistingServer: false,
    },
});
