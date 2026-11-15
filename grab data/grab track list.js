(async () => {
  const TITLE = 'FIRST TRACK NAME IN QUEUE';
  const WAIT = 200;   // milliseconds to let rows draw after each scroll
  const STEP = 4;   // fraction of the visible height to scroll each time, integer 
  const cp = typeof copy === 'function' ? copy : null;
  const hit = [...document.querySelectorAll('*')].reverse().find(e =>
    [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.toLowerCase().includes(TITLE.toLowerCase())));
  let sc = hit;
  while (sc && !(sc.scrollHeight > sc.clientHeight + 10 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
  sc = sc || document.scrollingElement;
  let out = '', stuck = 0;
  const t0 = Date.now();
  sc.scrollTop = 0;
  while (stuck < 3) {
    await new Promise(r => setTimeout(r, WAIT));
    out += sc.innerText + '\n';
    const before = sc.scrollTop;
    sc.scrollTop += sc.clientHeight * STEP;
    stuck = sc.scrollTop === before ? stuck + 1 : 0;
  }
  window.trackList = out;
  const secs = ((Date.now() - t0) / 1000).toFixed(3);
  // save as a file (goes to the browser's download folder)
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([out], { type: 'text/plain' }));
  a.download = 'messy track list.txt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);   // free it once the download has started
  if (cp) cp(out);
  console.log('Done in ' + secs + 's - saved "messy track list.txt" to your downloads' + (cp ? ' and copied to clipboard.' : '.'));
})();