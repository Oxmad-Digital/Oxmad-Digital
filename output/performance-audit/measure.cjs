/* eslint-disable @typescript-eslint/no-require-imports */
/* Usage: PLAYWRIGHT_MODULE=/path/to/playwright-core BROWSER_PATH=/path/to/chromium node output/performance-audit/measure.cjs
 * Run npm run build first. Starts an isolated local production server; never submits forms.
 * No authentication, DB writes or load tests. Results are laboratory observations, not Lighthouse scores.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const { gzipSync } = require('node:zlib');
const path = require('node:path');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const out = path.join(process.cwd(), 'output/performance-audit');
const measurementFile = process.env.MEASUREMENT_FILE || 'measurements.json';
const origin = 'http://127.0.0.1:3187';

async function main() {
  const log = fs.openSync(path.join(out, 'server.log'), 'w');
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3187', '-H', '127.0.0.1'], { stdio: ['ignore', log, log] });
  let browser;
  try {
    for (let i = 0; ; i++) {
      try { if ((await fetch(origin)).ok) break; } catch {}
      if (i > 100) throw new Error('Production server unavailable');
      await delay(200);
    }
    browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || '/opt/brave.com/brave/brave', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const results = { date: '2026-10-27', browser: browser.version(), origin, note: 'Local production; cold browser cache, warmed server image cache; no POST allowed; 150 ms latency, 1.6 Mbps down, 750 Kbps up, CPU x4 for mobile.', runs: [], http: [], bundles: [] };
    for (const route of ['/', '/realisations', '/mentions-legales', '/admin/login', '/espace-client/connexion']) {
      const response = await fetch(origin + route);
      const html = await response.text();
      const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
      const styles = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^\"]*)"/g)].map(m => m[1]);
      const assets = [];
      for (const asset of [...new Set([...scripts, ...styles])]) {
        const data = await (await fetch(origin + asset)).arrayBuffer();
        const buffer = Buffer.from(data);
        assets.push({ asset, bytes: buffer.length, gzipBytes: gzipSync(buffer).length });
      }
      results.bundles.push({ route, htmlBytes: Buffer.byteLength(html), htmlGzipBytes: gzipSync(html).length, assets });
      results.http.push({ route, status: response.status, cacheControl: response.headers.get('cache-control'), assets: scripts.length });
    }
    const scenarios = [
      ...Array.from({length:3}, (_,i) => ({route:'/', name:'home-mobile-first', mobile:true, repeat:i+1})),
      ...Array.from({length:3}, (_,i) => ({route:'/', name:'home-desktop-first', mobile:false, repeat:i+1})),
      {route:'/', name:'home-mobile-return', mobile:true, returning:true},
      {route:'/', name:'home-mobile-reduced', mobile:true, reduced:true},
      {route:'/realisations', name:'works-mobile', mobile:true},
      {route:'/mentions-legales', name:'legal-mobile', mobile:true},
      {route:'/admin/login', name:'admin-login-mobile', mobile:true},
      {route:'/espace-client/connexion', name:'client-login-mobile', mobile:true},
    ];
    for (const scenario of scenarios) {
      const context = await browser.newContext({viewport:scenario.mobile ? {width:390,height:844} : {width:1440,height:900}, deviceScaleFactor:scenario.mobile ? 3 : 1, isMobile:scenario.mobile, hasTouch:scenario.mobile, reducedMotion:scenario.reduced ? 'reduce' : 'no-preference'});
      await context.route('**/*', route => route.request().method() === 'POST' ? route.abort() : route.continue());
      await context.addInitScript(({returning}) => {
        if (returning) sessionStorage.setItem('ox-intro','1');
        window.__audit = {lcp:[], cls:[], tasks:[], states:[]};
        for(const type of ['largest-contentful-paint','layout-shift','longtask']) {
          new PerformanceObserver(list => {
            for(const e of list.getEntries()) {
              if(type === 'largest-contentful-paint') window.__audit.lcp.push({time:e.startTime, size:e.size, tag:e.element?.tagName, id:e.element?.id, url:e.url});
              if(type === 'layout-shift' && !e.hadRecentInput) window.__audit.cls.push({time:e.startTime, value:e.value});
              if(type === 'longtask') window.__audit.tasks.push({time:e.startTime,duration:e.duration});
            }
          }).observe({type,buffered:true});
        }
        document.addEventListener('DOMContentLoaded', () => {
          const record=()=>window.__audit.states.push({time:performance.now(),classes:document.documentElement.className});
          new MutationObserver(record).observe(document.documentElement,{attributes:true,attributeFilter:['class']});record();
        });
      }, {returning:!!scenario.returning});
      const page = await context.newPage();
      const errors = [], responses = [], failed = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {if(response.status()>=400) responses.push({url:response.url(),status:response.status()});});
      page.on('requestfailed', request => failed.push({url:request.url(),error:request.failure()?.errorText}));
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
      await cdp.send('Performance.enable');
      if(scenario.mobile) {
        await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
        await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});
      }
      await page.goto(origin+scenario.route,{waitUntil:'load',timeout:60000});
      await page.waitForTimeout(8000);
      const before = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
      await page.waitForTimeout(2000);
      const after = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
      const data = await page.evaluate(() => {
        const n=performance.getEntriesByType('navigation')[0];
        const a=window.__audit;
        let cls=0, sum=0, start=0, last=0;
        for(const e of a.cls) {if(e.time-last>1000 || e.time-start>5000){sum=0;start=e.time;}sum+=e.value;last=e.time;cls=Math.max(cls,sum);}
        return {...a, fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime, ttfb:n.responseStart-n.startTime, domContentLoaded:n.domContentLoadedEventEnd, clsValue:cls, blockingTime10s:a.tasks.filter(t=>t.time<10000).reduce((s,t)=>s+Math.max(0,t.duration-50),0), nodes:document.querySelectorAll('*').length, canvases:document.querySelectorAll('canvas').length, hero:document.querySelector('.hero-background img')?.currentSrc, resources:performance.getEntriesByType('resource').map(r=>({url:r.name,type:r.initiatorType,bytes:r.transferSize,decoded:r.decodedBodySize,duration:r.duration,start:r.startTime})), finalClasses:document.documentElement.className};
      });
      const run={...scenario,...data,idleTaskMs:(after.TaskDuration-before.TaskDuration)*1000,heapBytes:after.JSHeapUsedSize,errors,responses,failed};
      results.runs.push(run);
      fs.writeFileSync(path.join(out,measurementFile),JSON.stringify(results,null,2)+'\n');
      console.log(JSON.stringify({name:scenario.name,repeat:scenario.repeat,fcp:data.fcp,lcp:data.lcp.at(-1)?.time,cls:data.clsValue,blocking:data.blockingTime10s,errors:errors.length,failed:failed.length}));
      await context.close();
    }
  } finally { await browser?.close(); server.kill('SIGTERM'); fs.closeSync(log); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
