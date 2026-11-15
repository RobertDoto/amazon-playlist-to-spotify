(async () => {
  const TITLE = 'FIRST TRACK IN QUEUE';
  const OVERLAP = 100;     // px of already-copied rows to keep in view after each jump
  const QUIET = 50;        // ms with no changes before a stop counts as finished drawing
  const MIN = 300;         // ms to wait if nothing changes at all
  const MAX = 1500;        // never wait longer than this at one stop
  const END_WAIT = 600;    // at the bottom, ms to wait for more tracks to load before finishing
  const cp = typeof copy === 'function' ? copy : null;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const hit = [...document.querySelectorAll('*')].reverse().find(e =>
    [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.toLowerCase().includes(TITLE.toLowerCase())));
  let sc = hit;
  while (sc && !(sc.scrollHeight > sc.clientHeight + 10 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
  sc = sc || document.scrollingElement;

  // Resolves once the list has finished redrawing after a scroll
  const settled = () => new Promise(resolve => {
    const start = performance.now();
    let last = start, changed = false;
    const obs = new MutationObserver(() => { changed = true; last = performance.now(); });
    obs.observe(sc, { childList: true, subtree: true, characterData: true });
    const check = () => {
      const now = performance.now();
      if ((changed && now - last >= QUIET) || (!changed && now - start >= MIN) || now - start >= MAX) {
        obs.disconnect(); resolve();
      } else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });

  // How far below the top of the visible area the lowest drawn text sits, in px
  const drawnBelow = () => {
    const top = sc === document.scrollingElement ? 0 : sc.getBoundingClientRect().top;
    const walker = document.createTreeWalker(sc, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let max = 0;
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (!n.textContent.trim()) continue;
      range.selectNodeContents(n);
      const r = range.getBoundingClientRect();
      if (r.height && r.bottom - top > max) max = r.bottom - top;
    }
    return max;
  };

  // At the bottom: wait for the list to grow (more tracks loading); false if it never does
  const grew = async () => {
    const h = sc.scrollHeight, start = performance.now();
    while (performance.now() - start < END_WAIT) {
      await sleep(50);
      if (sc.scrollHeight > h + 5) return true;
    }
    return false;
  };

  let out = '', stops = 0;
  const t0 = performance.now();
  if (sc.scrollTop !== 0) { sc.scrollTop = 0; await settled(); }
  while (true) {
    out += sc.innerText + '\n'; stops++;
    // jump to just above the lowest row already drawn, so nothing is skipped
    const jump = Math.max(sc.clientHeight * 0.5, drawnBelow() - OVERLAP);
    const before = sc.scrollTop;
    sc.scrollTop += jump;
    if (sc.scrollTop === before) {
      if (!(await grew())) break;
      sc.scrollTop += jump;
    }
    await settled();
  }
  window.trackList = out;
  const secs = ((performance.now() - t0) / 1000).toFixed(1);
  const msg = 'Done in ' + secs + 's (' + stops + ' stops)';
  // save as a file (goes to the browser's download folder)
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([out], { type: 'text/plain' }));
  a.download = 'messy track list.txt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);   // free it once the download has started
  if (cp) cp(out);
  console.log(msg + ' - saved "messy track list.txt" to your downloads' + (cp ? ' and copied to clipboard.' : '.'));
})();