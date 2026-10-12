/**
 * Game-card widget for ChatGPT (Apps SDK, "text/html+skybridge").
 * Reads the tool's structuredContent from window.openai.toolOutput: { games: [...] } or { game: {...} }.
 * Plain HTML/JS, no build step; other MCP clients simply ignore it and use the text content.
 */
export const WIDGET_URI = "ui://widget/aunomay-games-v1.html";

export const WIDGET_HTML = /* html */ `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{--bg:#fff;--card:#fff;--line:#e3e5e8;--text:#1d1f23;--muted:#646b75;--accent:#7a5af8;--accent-text:#fff}
:root[data-theme=dark]{--bg:#212121;--card:#2a2a2a;--line:#3a3a3a;--text:#f2f2f2;--muted:#a4a8ae;--accent:#9a82ff;--accent-text:#111}
*{box-sizing:border-box}
body{margin:0;background:transparent;color:var(--text);font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{padding:4px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px}
.card{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;min-width:0}
.thumb{aspect-ratio:16/10;background:var(--line);overflow:hidden}
.thumb img{width:100%;height:100%;object-fit:cover;display:block}
.body{padding:10px 12px 12px;display:flex;flex-direction:column;gap:6px;flex:1}
.title{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.desc{color:var(--muted);font-size:12.5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.meta{color:var(--muted);font-size:12px;display:flex;gap:8px;flex-wrap:wrap}
.play{margin-top:auto;display:inline-flex;justify-content:center;align-items:center;min-height:36px;border-radius:8px;background:var(--accent);color:var(--accent-text);font-weight:600;text-decoration:none;border:0;cursor:pointer;font:inherit}
.play:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.foot{margin-top:10px;color:var(--muted);font-size:12px}
.foot a{color:inherit}
.empty{color:var(--muted);padding:8px 0}
</style></head>
<body><div class="wrap"><div id="root" class="grid"></div><div class="foot">Games from <a id="site" href="https://play.aunomay.com" target="_blank" rel="noopener">Aunomay Play</a></div></div>
<script>
(function(){
  var root=document.getElementById('root');
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function fmt(n){try{return new Intl.NumberFormat(undefined,{notation:'compact'}).format(n||0);}catch(e){return String(n||0);}}
  function open(href){var o=window.openai;if(o&&typeof o.openExternal==='function'){o.openExternal({href:href});return true;}return false;}
  function render(){
    var o=window.openai||{};
    document.documentElement.setAttribute('data-theme',o.theme==='dark'?'dark':'light');
    var out=o.toolOutput||{};
    var games=Array.isArray(out.games)?out.games:(out.game?[out.game]:[]);
    if(!games.length){root.className='';root.innerHTML='<div class="empty">No games found.</div>';return;}
    root.className='grid';
    root.innerHTML=games.slice(0,12).map(function(g){
      return '<article class="card">'+
        '<div class="thumb">'+(g.thumbnail?'<img loading="lazy" alt="" src="'+esc(g.thumbnail)+'">':'')+'</div>'+
        '<div class="body"><div class="title" title="'+esc(g.title)+'">'+esc(g.title)+'</div>'+
        '<div class="desc">'+esc(g.description)+'</div>'+
        '<div class="meta"><span>'+fmt(g.plays)+' plays</span>'+(g.mobile?'<span>Mobile ready</span>':'<span>Best on desktop</span>')+'</div>'+
        '<a class="play" href="'+esc(g.url)+'" target="_blank" rel="noopener" aria-label="Play '+esc(g.title)+' on Aunomay Play">Play now</a></div></article>';
    }).join('');
  }
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(a&&open(a.href))e.preventDefault();});
  window.addEventListener('openai:set_globals',render,{passive:true});
  render();
})();
</script></body></html>`;
