// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env['CI'];
const port = process.env['PORT'] ?? 3080;

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /** global timeout https://playwright.dev/docs/test-timeouts#global-timeout */
  globalTimeout: 20 * 60 * 1000,
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!isCI,
  /* Retry on CI only */
  retries: isCI ? 5 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: `http://localhost:${port}/`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /** Configuration for the `expect` assertion library. */
  expect: {
    /** Configuration for the `pageAssertions.toHaveScreenshot` method. */
    toHaveScreenshot: {
      /** An acceptable ratio of pixels that are different to the total amount of pixels, between 0 and 1.*/
      maxDiffPixelRatio: 0,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'webkit',
      use: { ...devices['iPhone 12 Pro'] }, // 390
    },
    {
      name: 'chromium',
      use: {
        ...devices['Pixel 5'], // 393,
        launchOptions: {
          ignoreDefaultArgs: ['--headless'],
          args: [
            '--headless=new',
            '--browser-ui-tests-verify-pixels',
            '--browser-test',
            '--font-render-hinting=none',
            '--disable-skia-runtime-opts',
            '--disable-font-subpixel-positioning',
            '--disable-lcd-text',
            '--disable-composited-antialiasing',
            '--disable-system-font-check',
            '--force-device-scale-factor=1',
            '--touch-slop-distance=5',
            '--disable-low-res-tiling',
            '--disable-smooth-scrolling',
          ],
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox HiDPI'],
      },
    },
  ].filter((e) => e),

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm serve',
    reuseExistingServer: !isCI,
  },
});
