/* eslint-disable @typescript-eslint/no-require-imports */
// Functional and visual smoke checks for the performance-only changes.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const origin = 'http://127.0.0.1:3187';
const out = path.join(process.cwd(), 'output/performance-audit');

async function ready() {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(origin)).ok) return; } catch {}
    await delay(200);
  }
  throw new Error('Production server unavailable');
}

async function main() {
  const log = fs.openSync(path.join(out, 'verify-server.log'), 'w');
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3187', '-H', '127.0.0.1'], { stdio: ['ignore', log, log] });
  let browser;
  try {
    await ready();
    browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || '/opt/brave.com/brave/brave', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const result = { browser: browser.version(), checks: {}, metrics: {}, errors: [] };
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await context.route('**/*', route => route.request().method() === 'POST' ? route.abort() : route.continue());
    await context.addInitScript(() => sessionStorage.setItem('ox-intro', '1'));
    const page = await context.newPage();
    page.on('pageerror', error => result.errors.push(error.message));
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    result.checks.motionReady = await page.evaluate(() => !!window.__oxMotion && document.documentElement.classList.contains('lenis'));
    result.checks.cursorDisabledOnTouch = await page.locator('.ox-cursor').count() === 0;
    result.checks.transitionCanvasMounted = await page.locator('.ox-wipe').count() === 1;
    const source = await page.locator('.hero-background img').evaluate(img => img.currentSrc);
    result.checks.mobileHeroUsesPreparedSource = source.includes('hero-accueil-jardin-cotier-mobile') && !source.includes('/_next/image');
    await page.locator('.hero-background').screenshot({ path: path.join(out, 'hero-mobile-direct.png') });
    const oldUrl = `${origin}/_next/image?url=${encodeURIComponent(source)}&w=1200&q=92`;
    await page.locator('.hero-background').evaluate(async (picture, url) => {
      const sourceEl = picture.querySelector('source');
      const img = picture.querySelector('img');
      sourceEl.srcset = url;
      img.srcset = url;
      img.src = url;
      await img.decode();
    }, oldUrl);
    await page.locator('.hero-background').screenshot({ path: path.join(out, 'hero-mobile-previous-reencode.png') });

    const service = page.locator('.service-button').first();
    await service.click();
    result.checks.serviceAccordion = await service.getAttribute('aria-expanded') === 'true';
    const sound = page.locator('.ox-sound__fab').first();
    await sound.click();
    result.checks.soundPlayer = await page.locator('.ox-sound').evaluate(el => el.classList.contains('is-open'));
    await page.locator('.cta-big').scrollIntoViewIfNeeded();
    await page.locator('.cta-big').click();
    result.checks.contactDialog = await page.locator('.contact-dialog').evaluate(el => el.open);
    await page.locator('.dialog-link').click();
    await page.locator('.ox-modal').waitFor({ state: 'visible' });
    result.checks.bookingDialog = true;
    await context.close();

    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await desktopContext.addInitScript(() => sessionStorage.setItem('ox-intro', '1'));
    const desktop = await desktopContext.newPage();
    desktop.on('pageerror', error => result.errors.push(`desktop: ${error.message}`));
    await desktop.goto(origin, { waitUntil: 'networkidle' });
    await desktop.waitForTimeout(1200);
    result.checks.cursorMountedOnDesktop = await desktop.locator('.ox-cursor').count() === 2;
    await desktop.locator('a[href="/#expertise"]').first().click();
    await desktop.waitForTimeout(900);
    result.checks.smoothAnchorScroll = await desktop.evaluate(() => window.scrollY > 300);
    await desktop.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await desktop.waitForTimeout(1200);
    await desktop.mouse.wheel(0, 500);
    await desktop.waitForTimeout(800);
    result.checks.smoothScrollWakesFromIdle = await desktop.evaluate(() => window.scrollY > 100);
    await desktop.waitForTimeout(1200);
    result.metrics.lenisFramesAtIdle = await desktop.evaluate(() => new Promise((resolve) => {
      const lenis = window.__oxLenis;
      const original = lenis.raf;
      let frames = 0;
      lenis.raf = (...args) => { frames++; return original(...args); };
      setTimeout(() => { lenis.raf = original; resolve(frames); }, 1000);
    }));
    result.checks.lenisSleepsAtIdle = result.metrics.lenisFramesAtIdle <= 1;
    await desktop.locator('a[href="/realisations"]').first().evaluate(link => link.click());
    await desktop.waitForTimeout(250);
    result.checks.pageTransitionAnimates = await desktop.locator('.ox-wipe').evaluate(canvas => {
      const context = canvas.getContext('2d');
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      return pixels.some((value, index) => index % 4 === 3 && value > 0);
    });
    await desktop.waitForURL(`${origin}/realisations`);
    await desktopContext.close();

    const firstContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await firstContext.route('**/*', route => route.request().method() === 'POST' ? route.abort() : route.continue());
    const first = await firstContext.newPage();
    first.on('pageerror', error => result.errors.push(error.message));
    await first.goto(origin, { waitUntil: 'load' });
    result.metrics.introDurationMs = await first.evaluate(() => new Promise((resolve) => {
      const root = document.documentElement;
      const finish = () => {
        if (!root.classList.contains('intro')) {
          observer.disconnect();
          resolve(performance.now());
        }
      };
      const observer = new MutationObserver(finish);
      observer.observe(root, { attributes: true, attributeFilter: ['class'] });
      finish();
      setTimeout(() => { observer.disconnect(); resolve(null); }, 6000);
    }));
    result.checks.introCompletes = await first.evaluate(() => !document.documentElement.classList.contains('intro') && !!window.__oxMotion);
    result.checks.introKeepsFixedChoreography = result.metrics.introDurationMs >= 2200 && result.metrics.introDurationMs < 4000;
    await firstContext.close();

    for (const route of ['/realisations', '/mentions-legales']) {
      const routeContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      const p = await routeContext.newPage();
      p.on('pageerror', error => result.errors.push(`${route}: ${error.message}`));
      await p.goto(origin + route, { waitUntil: 'networkidle' });
      await p.waitForTimeout(1200);
      result.checks[`${route}Motion`] = await p.evaluate(() => !!window.__oxMotion && document.documentElement.classList.contains('lenis'));
      if (route === '/realisations') {
        const heroSource = await p.locator('.works-hero-art img').evaluate(img => img.currentSrc);
        result.checks.realisationsUsesPreparedMobileHero = heroSource.includes('oxmad_galerie_cotiere_mobile-7b8799b09d81.avif');
      }
      await routeContext.close();
    }
    result.ok = result.errors.length === 0 && Object.values(result.checks).every(Boolean);
    fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result));
    if (!result.ok) process.exitCode = 1;
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
    fs.closeSync(log);
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
