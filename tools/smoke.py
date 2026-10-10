#!/usr/bin/env python3
"""Smoke test for the whole site. Serves the repo locally and opens every page in a headless browser.

Checks, in light and dark theme at phone width (400px):
  - no script errors (failed font or CDN loads in a sandbox are ignored)
  - every chart container actually drew a chart
  - no horizontal scroll
  - every internal link resolves
  - every chip and slider extreme in every lab runs without errors
  - home page: search works and the hero canvas is drawn

Usage:
  PLOTLY_JS=/path/to/plotly.min.js python3 tools/smoke.py [--shots DIR]

Get a local Plotly for sandboxes without CDN access:
  npm i plotly.js-dist-min@2.35.2 --prefix /tmp/plotly   ->  /tmp/plotly/node_modules/plotly.js-dist-min/plotly.min.js
Needs: pip install playwright (Chromium is preinstalled in the Claude Code sandbox).
"""
import asyncio, os, re, subprocess, sys, time, socket, json
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
PLOTLY = open(os.environ['PLOTLY_JS'], encoding='utf-8').read() if os.environ.get('PLOTLY_JS') else None

def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p

def article_ids():
    reg = open(os.path.join(ROOT, 'assets/registry.js'), encoding='utf-8').read()
    reg = reg[reg.index('const ARTICLES'):]
    return re.findall(r"\{id:'([^']+)'", reg)

def category_ids():
    reg = open(os.path.join(ROOT, 'assets/registry.js'), encoding='utf-8').read()
    reg = reg[:reg.index('const ARTICLES')]
    return re.findall(r"\{id:'([^']+)'", reg)

async def main():
    port = free_port()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    base = f'http://127.0.0.1:{port}/'
    problems = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            ctx = await browser.new_context(viewport={'width': 400, 'height': 900}, color_scheme='light')
            page = await ctx.new_page()
            errors = []
            page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
            page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))

            async def route(r):
                u = r.request.url
                if u.startswith(base): await r.continue_()
                elif 'plotly' in u and PLOTLY: await r.fulfill(status=200, content_type='application/javascript', body=PLOTLY)
                elif PLOTLY: await r.abort()           # offline sandbox: skip fonts and other CDNs
                else: await r.continue_()
            await ctx.route('**/*', route)

            pages = ['index.html'] + [f'category.html?c={c}' for c in category_ids()] + [f'articles/{a}.html' for a in article_ids()]
            for theme in ['light', 'dark']:
                await ctx.add_init_script(f"try{{localStorage.setItem('qa-theme','{theme}')}}catch(e){{}}")
                for path in pages:
                    errors.clear()
                    await page.goto(base + path)
                    await page.wait_for_timeout(900)
                    info = await page.evaluate("""() => {
                        const plots=[...document.querySelectorAll('.plot')];
                        const bad=plots.filter(p=>!p.querySelector('.main-svg')&&!p.querySelector('canvas')).map(p=>p.id);
                        return {plots:plots.length,bad,theme:document.documentElement.getAttribute('data-theme'),
                                sw:document.documentElement.scrollWidth,iw:window.innerWidth,title:document.title,
                                h1:(document.querySelector('h1')||{}).textContent||''};}""")
                    tag = f'[{theme}] {path}'
                    ok = not errors and not info['bad'] and info['sw'] <= info['iw'] and info['theme'] == theme and info['h1'].strip()
                    print(('PASS ' if ok else 'FAIL ') + tag, f"plots={info['plots']}", info['title'])
                    if not ok: problems.append((tag, errors[:3], info))

            # internal links resolve
            await ctx.add_init_script("try{localStorage.removeItem('qa-theme')}catch(e){}")
            for path in pages:
                await page.goto(base + path); await page.wait_for_timeout(300)
                links = await page.evaluate("""async () => {
                    const out=[]; for(const a of document.querySelectorAll('a[href]')){
                      const u=new URL(a.href, location.href); if(u.origin!==location.origin) continue;
                      try{const r=await fetch(u.pathname,{method:'HEAD'}); if(!r.ok) out.push(u.pathname+' '+r.status);}catch(e){out.push(u.pathname+' fetch failed');}
                    } return out;}""")
                if links: problems.append((path, 'broken links', links)); print('FAIL links', path, links)
            print('PASS internal links' if not any(x[1] == 'broken links' for x in problems) else 'FAIL internal links')

            # exercise every chip and slider extreme in every lab
            for a in article_ids():
                errors.clear()
                await page.goto(base + f'articles/{a}.html'); await page.wait_for_timeout(600)
                n = await page.evaluate("""async () => {
                    let acts=0;
                    for(const lab of document.querySelectorAll('.lab[data-lab]')){
                      for(const chip of lab.querySelectorAll('.presets .chip')){chip.click(); acts++; await new Promise(r=>setTimeout(r,25));}
                      for(const inp of lab.querySelectorAll('input[type=range]')){
                        const orig=inp.value;
                        for(const v of [inp.min,inp.max]){inp.value=v; inp.dispatchEvent(new Event('input',{bubbles:true})); acts++; await new Promise(r=>setTimeout(r,25));}
                        inp.value=orig; inp.dispatchEvent(new Event('input',{bubbles:true}));
                      }
                    }
                    for(const inp of document.querySelectorAll('article input[type=range]')){
                      if(inp.closest('.lab[data-lab]')) continue;
                      const orig=inp.value; for(const v of [inp.min,inp.max]){inp.value=v; inp.dispatchEvent(new Event('input',{bubbles:true})); acts++; await new Promise(r=>setTimeout(r,25));}
                      inp.value=orig; inp.dispatchEvent(new Event('input',{bubbles:true}));
                    }
                    return acts;}""")
                ok = not errors
                print(('PASS ' if ok else 'FAIL ') + f'exercise {a}: {n} actions')
                if not ok: problems.append((a, errors[:3]))

            # home page behaviour
            errors.clear()
            await page.goto(base + 'index.html'); await page.wait_for_timeout(800)
            hero = await page.evaluate("""() => {const c=document.getElementById('hero'); const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]>0) n++; return n;}""")
            await page.fill('#q', 'bootstrap'); await page.wait_for_timeout(200)
            found = await page.evaluate("document.querySelectorAll('#homeList a.art').length")
            await page.fill('#q', 'zzzz'); await page.wait_for_timeout(200)
            none = await page.evaluate("document.querySelectorAll('#homeList .empty-note').length")
            ok = hero > 100 and found >= 1 and none == 1 and not errors
            print(('PASS ' if ok else 'FAIL ') + f'home: hero pixels={hero}, search hits={found}, empty note={none}')
            if not ok: problems.append(('home', hero, found, none, errors[:3]))

            if SHOTS:
                os.makedirs(SHOTS, exist_ok=True)
                await page.set_viewport_size({'width': 1100, 'height': 900})
                for path in ['index.html'] + [f'articles/{a}.html' for a in article_ids()]:
                    await page.goto(base + path); await page.wait_for_timeout(1000)
                    await page.screenshot(path=os.path.join(SHOTS, path.replace('/', '_').replace('.html', '') + '.png'))
            await browser.close()
    finally:
        srv.terminate()
    print('\nRESULT:', 'all good' if not problems else json.dumps(problems, indent=1)[:3000])
    sys.exit(1 if problems else 0)

asyncio.run(main())
