/* eslint-disable @typescript-eslint/no-require-imports */
// Run while measure.cjs's local server is active. Same browser prerequisites.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const fs=require('node:fs');
const origin=process.env.ORIGIN || 'http://127.0.0.1:3187';
const diagnosticFile=process.env.DIAGNOSTIC_FILE || 'diagnostic.json';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH || '/opt/brave.com/brave/brave',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
 await context.route('**/*',r=>r.request().method()==='POST'?r.abort():r.continue());
 await context.addInitScript(()=>sessionStorage.setItem('ox-intro','1'));
 const page=await context.newPage();const cdp=await context.newCDPSession(page);
 await cdp.send('Performance.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.goto(origin+'/',{waitUntil:'load'});await page.waitForTimeout(6000);
 const output={cpu:[],interactions:[]};
 const sample=async(name)=>{const before=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));await page.waitForTimeout(2000);const after=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));output.cpu.push({name,...Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration'].map(k=>[k+'Ms',(after[k]-before[k])*1000]))});};
 await sample('default');
 await page.addStyleTag({content:'*,*::before,*::after{animation-play-state:paused!important}'});
 await sample('CSS animations paused');
 await page.evaluate(()=>window.__oxLenis?.destroy());
 await sample('CSS paused and Lenis destroyed (ticker registration retained)');
 output.gsapGlobal=await page.evaluate(()=>!!window.gsap);
 if(output.gsapGlobal){await page.evaluate(()=>window.gsap.ticker.sleep());await sample('CSS paused and GSAP ticker asleep');await page.evaluate(()=>window.gsap.ticker.wake());}
 await page.screenshot({path:'output/performance-audit/home-mobile.png',fullPage:false});
 await page.evaluate(()=>{window.__events=[];new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.interactionId)window.__events.push({name:e.name,duration:e.duration,inputDelay:e.processingStart-e.startTime,processing:e.processingEnd-e.processingStart});}).observe({type:'event',buffered:true,durationThreshold:16});});
 await page.locator('.service-button').first().click();await page.waitForTimeout(500);
 output.interactions=await page.evaluate(()=>window.__events);
 output.accordionExpanded=await page.locator('.service-button').first().getAttribute('aria-expanded');
 fs.writeFileSync('output/performance-audit/'+diagnosticFile,JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output));
 await context.close();
 } finally {await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
