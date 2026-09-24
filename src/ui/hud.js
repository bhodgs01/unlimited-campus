/**
 * A lean HUD for the campus: a left rail (Home, Orbit, Day/Night, Help), the six
 * castle chips along the bottom, a card for whatever was clicked, and toasts. Built on the
 * colony's stylesheet (.hud .panel .btn .rail .chips .chip .toasts) plus a few rules of its
 * own, so the two apps stay visually related.
 */
import { CASTLES, BRAND } from '../data/castles.js'

const ICON = {
  home: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  orbit: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M20.2 6.4a9 9 0 1 1-3.6-2.4"/></svg>',
  sun: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  help: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.7M12 17h.01"/></svg>',
  vr: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="10" rx="3"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/></svg>',
  crew: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  bus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16"/><path d="M8 21v-4"/><path d="M16 21v-4"/><circle cx="8" cy="14" r="0.6" fill="currentColor"/><circle cx="16" cy="14" r="0.6" fill="currentColor"/></svg>',
  walk: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M11 21l1.5-5.5L9 13l1-5 4 2 2 3"/><path d="M10 8l-3 2-1 4"/><path d="M12.5 15.5L16 21"/></svg>',
  fly: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l18-8-8 18-2-7z"/></svg>',
}

const CSS = `
.uc-card h2,.uc-help h3{font-family:Helvetica,'Helvetica Neue',Arial,sans-serif}
.uc-card .btn.primary{color:#fff}
.uc-mantra{position:absolute;right:14px;bottom:max(14px,env(safe-area-inset-bottom));color:rgba(255,255,255,.55);font-size:12px;font-style:italic;pointer-events:none}
@media (max-width:900px){.uc-mantra{display:none}}
.uc-chips{position:absolute;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:6px;padding:6px;max-width:calc(100vw - 28px);flex-wrap:wrap;justify-content:center}
.uc-chips .chip{display:flex;align-items:center;gap:7px;color:var(--text);white-space:nowrap;flex:0 0 auto}
.uc-chips .chip i{width:8px;height:8px;border-radius:50%;display:inline-block}
.uc-chips .chip.active{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.3)}
.uc-card{position:absolute;right:14px;top:14px;width:min(340px,calc(100vw - 28px));padding:16px 16px 14px;display:none;flex-direction:column;gap:10px;pointer-events:auto}
.uc-card.open{display:flex}
.uc-card .kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.uc-card h2{margin:0;font-size:20px;line-height:1.15;font-weight:700}
.uc-card p{margin:0;color:var(--muted);font-size:13.5px;line-height:1.5}
.uc-card .badges{display:flex;flex-wrap:wrap;gap:5px}
.uc-card .badge{font-size:12px;padding:4px 9px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.05)}
.uc-card .badge.lit{border-color:transparent;color:#111;font-weight:600}
.uc-card .row{display:flex;gap:6px;justify-content:flex-end}
.uc-card img.art{display:block;width:100%;border-radius:12px;object-fit:cover;aspect-ratio:16/9;margin:4px 0 2px;border:1px solid var(--line)}
.uc-card img.art.square{width:132px;height:132px;aspect-ratio:1;object-fit:contain;border:0;margin:0 auto;filter:drop-shadow(0 6px 18px rgba(229,1,255,.35))}
/* display:block beats the hidden attribute, so an image-less card drew an empty frame */
.uc-card img.art[hidden]{display:none}
.uc-card .x{position:absolute;right:10px;top:8px;width:28px;height:28px;min-width:28px;padding:0;border-radius:8px}
.uc-help{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,calc(100vw - 28px));padding:18px 20px;display:none;flex-direction:column;gap:8px;pointer-events:auto}
.uc-help.open{display:flex}
.uc-help h3{margin:0 0 4px;font-size:16px}
.uc-help p{margin:0;color:var(--muted);font-size:13.5px;line-height:1.5}
.uc-help kbd{font:inherit;font-size:12px;padding:1px 6px;border:1px solid var(--line);border-radius:6px;background:rgba(255,255,255,.06)}
.uc-logo{position:absolute;left:14px;top:14px;width:44px;height:44px;border-radius:12px;background:#f7f7f7 url(${import.meta.env.BASE_URL}ua-mark.jpg) center/88% no-repeat;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:auto;display:block;cursor:pointer}
.uc-people{position:absolute;left:68px;top:14px;display:flex;gap:6px;padding:5px;pointer-events:auto}
.uc-people button{display:flex;align-items:center;gap:7px;height:34px;padding:0 11px 0 4px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.05);color:var(--text);font:inherit;font-size:12.5px;cursor:pointer}
.uc-people button img{width:26px;height:26px;border-radius:50%;object-fit:cover;object-position:50% 30%;background:#2a2f3a}
.uc-people button.active{background:rgba(229,1,255,.18);border-color:rgba(229,1,255,.55)}
.uc-people .facestack{display:flex;flex:none;padding-left:2px}
.uc-people .facestack img{width:24px;height:24px;margin-left:-9px;border:2px solid #15121c}
.uc-people .facestack img:first-child{margin-left:0}
.uc-people button .caret{opacity:.6;font-size:10px;margin-left:2px;transition:transform .2s}
.uc-people button.open .caret{transform:rotate(180deg)}
.uc-famous{position:absolute;left:14px;top:66px;width:min(430px,calc(100vw - 28px));max-height:min(60vh,520px);overflow:auto;padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:6px;pointer-events:auto;z-index:5}
.uc-famous[hidden]{display:none}
.uc-famous .head{grid-column:1/-1;font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.65;padding:2px 4px 4px}
.uc-famous button{display:flex;align-items:center;gap:8px;height:40px;padding:0 10px 0 4px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.05);color:var(--text);font:inherit;font-size:12.5px;cursor:pointer;text-align:left;white-space:nowrap;overflow:hidden}
.uc-famous button:hover{background:rgba(175,255,0,.1);border-color:rgba(175,255,0,.4)}
.uc-famous button.active{background:rgba(229,1,255,.18);border-color:rgba(229,1,255,.55)}
.uc-famous button img{width:32px;height:32px;border-radius:50%;object-fit:cover;background:#2a2f3a;flex:none}
.uc-toast{padding:9px 13px;border-radius:10px;font-size:12.5px;max-width:320px}
.uc-course{position:absolute;left:14px;top:66px;width:min(300px,calc(100vw - 28px));max-height:min(74vh,620px);padding:0;display:none;flex-direction:column;pointer-events:auto;overflow:hidden}
.uc-course.open{display:flex}
.uc-course .head{padding:13px 14px 11px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:3px}
.uc-course .head b{font-family:Helvetica,'Helvetica Neue',Arial,sans-serif;font-size:16px;letter-spacing:.01em}
.uc-course .head small{color:var(--muted);font-size:11.5px}
.uc-course .bar{height:5px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:7px}
.uc-course .bar i{display:block;height:100%;background:linear-gradient(90deg,#AFFF00,#E501FF);width:0;transition:width .6s ease}
.uc-course .mods{overflow-y:auto;padding:9px;display:flex;flex-direction:column;gap:6px}
.uc-course .mod{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:11px;border:1px solid var(--line);background:rgba(255,255,255,.04);cursor:pointer;text-align:left;color:var(--text);font:inherit}
.uc-course .mod:hover{border-color:rgba(175,255,0,.5);background:rgba(175,255,0,.08)}
.uc-course .mod.done{border-color:rgba(175,255,0,.45)}
.uc-course .mod.here{background:rgba(229,1,255,.16);border-color:rgba(229,1,255,.5)}
.uc-course .mod i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:11.5px;font-weight:700;background:rgba(255,255,255,.1);flex:none}
.uc-course .mod.done i{background:#AFFF00;color:#131610}
.uc-course .mod span{font-size:12.5px;line-height:1.35}
.uc-course .mod small{display:block;color:var(--muted);font-size:11px}
.uc-course .foot{padding:9px;border-top:1px solid var(--line);display:flex;gap:6px}
.uc-media{position:absolute;left:50%;bottom:96px;transform:translateX(-50%);display:none;flex-direction:column;gap:6px;padding:7px;pointer-events:auto;max-width:calc(100vw - 28px)}
.uc-media.open{display:flex}
.uc-media .items{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.uc-media .player{display:none;align-items:center;gap:6px;min-width:min(520px,calc(100vw - 42px))}
.uc-media .player.on{display:flex}
.uc-media .player .btn{min-width:38px;padding:0 9px}
.uc-media .player input[type=range]{flex:1;min-width:90px;accent-color:#E501FF;cursor:pointer}
.uc-media .player .t{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.hud.inside .rail,.hud.inside .uc-chips,.hud.inside .uc-people,.hud.inside .uc-famous,.hud.inside .uc-mantra,.hud.inside .uc-tidy,.hud.inside .uc-walkhint{display:none!important}
.hud.inside .uc-media{bottom:max(14px,env(safe-area-inset-bottom))}
.uc-course .head{cursor:pointer;position:relative;padding-right:34px!important}
.uc-course .head::after{content:'▾';position:absolute;right:14px;top:13px;opacity:.6;transition:transform .2s}
.uc-course.min .head::after{transform:rotate(-90deg)}
.uc-course.min .mods,.uc-course.min .head small{display:none}
/* phones: the quest card and the media bar both ran full width at the bottom, and the card sat on
   top of the play buttons. Inside a castle the card moves up under the folded course panel. */
@media (max-width:640px){.hud.inside .uc-course{z-index:7}.hud.inside .uc-course.min{width:auto;max-width:calc(100vw - 28px)}.hud.inside .uc-quest{top:170px;bottom:auto;left:14px;right:14px;width:auto}}
.uc-media .btn{white-space:nowrap}
.uc-media .now{font-size:12px;color:var(--muted);padding:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
.uc-media .now:empty{display:none}
.uc-quest{position:absolute;right:14px;bottom:96px;width:min(320px,calc(100vw - 28px));padding:13px 14px;display:none;flex-direction:column;gap:8px;pointer-events:auto}
.uc-quest.open{display:flex}
.uc-quest h4{margin:0;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#AFFF00}
.uc-quest p{margin:0;font-size:13px;line-height:1.45;color:var(--text)}
.uc-quest .row{display:flex;gap:6px;justify-content:flex-end}
.uc-quest .pips{display:flex;gap:4px;flex-wrap:wrap}
.uc-quest .pip{width:13px;height:13px;border-radius:50%;border:1px solid rgba(255,255,255,.25)}
.uc-quest .pip.on{background:#AFFF00;border-color:#AFFF00}
.uc-chat{position:absolute;right:14px;top:14px;width:min(380px,calc(100vw - 28px));max-height:min(70vh,560px);padding:0;display:none;flex-direction:column;pointer-events:auto;overflow:hidden}
.uc-chat.open{display:flex}
.uc-chat .head{display:flex;align-items:center;gap:10px;padding:12px 12px 10px;border-bottom:1px solid var(--line)}
.uc-chat .head img{width:38px;height:38px;border-radius:50%;object-fit:cover;background:#2a2f3a}
.uc-chat .head b{font-family:Helvetica,'Helvetica Neue',Arial,sans-serif;font-size:15px}
.uc-chat .head small{display:block;color:var(--muted);font-size:11.5px}
.uc-chat .head .btn{margin-left:auto}
.uc-chat .log{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:9px;min-height:120px}
.uc-chat .msg{font-size:13.5px;line-height:1.5;padding:9px 12px;border-radius:13px;max-width:86%}
.uc-chat .msg.them{background:rgba(229,1,255,.14);border:1px solid rgba(229,1,255,.34);align-self:flex-start;border-bottom-left-radius:4px}
.uc-chat .msg.you{background:rgba(255,255,255,.08);border:1px solid var(--line);align-self:flex-end;border-bottom-right-radius:4px}
.uc-chat .msg.wait{opacity:.6;font-style:italic}
.uc-chat form{display:flex;gap:6px;padding:10px;border-top:1px solid var(--line)}
.uc-chat input{flex:1;min-width:0;background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:999px;padding:9px 13px;color:var(--text);font:inherit;font-size:13.5px}
.uc-chat input:focus{outline:none;border-color:rgba(229,1,255,.6)}
.uc-chat .sound{font-size:11px;color:var(--muted);padding:0 12px 9px;display:flex;align-items:center;gap:6px}
.uc-chat .head .mute{margin-left:auto;font-size:14px;line-height:1}
.uc-chat .head .mute.active{color:#E501FF}
.btn.tiny{padding:1px 8px;font-size:10.5px;border-radius:999px;line-height:1.7}
.uc-chat .notify{display:flex;align-items:center;gap:8px;padding:8px 12px;margin:0 10px 8px;border-radius:10px;background:rgba(229,1,255,.10);border:1px solid rgba(229,1,255,.28);font-size:12.5px}
.uc-chat .notify span{flex:1;color:var(--text)}
.uc-chat .notify .btn{padding:5px 12px;font-size:12px}
.uc-chat .notify[hidden],.uc-chat .notify .btn[hidden]{display:none}
.uc-ride{position:absolute;left:50%;top:14px;transform:translateX(-50%);display:none;align-items:center;gap:12px;padding:8px 8px 8px 14px;pointer-events:auto;max-width:calc(100vw - 28px)}
.uc-ride.open{display:flex}
.uc-ride .where{font-size:13.5px;min-width:0}
.uc-ride .where small{display:block;color:var(--muted);font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.uc-ride .where span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.uc-ride .where em{display:block;font-style:normal;font-size:12px;color:#ef6bff;min-height:15px}
.uc-ride .btn{white-space:nowrap}
.rail .btn.active{background:rgba(229,1,255,.22);border-color:rgba(229,1,255,.6)}
.uc-people button{position:relative}
.uc-people button .badge{position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#E501FF;color:#fff;font-size:10.5px;font-weight:700;line-height:17px;text-align:center;box-shadow:0 0 0 2px rgba(12,15,23,.9),0 0 10px rgba(229,1,255,.7)}
.uc-prompt{position:absolute;left:50%;bottom:112px;transform:translateX(-50%);display:none;align-items:center;gap:9px;padding:9px 14px;border-radius:999px;pointer-events:auto;cursor:pointer;font-size:13.5px}
.uc-prompt.open{display:flex}
.uc-prompt kbd{background:rgba(255,255,255,.1);border:1px solid var(--line);border-radius:5px;padding:1px 6px;font:inherit;font-size:11.5px}
.uc-tidy{position:absolute;left:14px;bottom:max(14px,env(safe-area-inset-bottom));width:40px;height:40px;min-width:40px;padding:0;display:flex;align-items:center;justify-content:center;pointer-events:auto;z-index:6}
@media (max-width:640px){.uc-people{max-width:calc(100vw - 128px);overflow-x:auto;scrollbar-width:none}.uc-tidy{left:auto;right:14px;bottom:auto;top:max(14px,env(safe-area-inset-top))}}
.hud.tidy .rail,.hud.tidy .uc-chips,.hud.tidy .uc-people,.hud.tidy .uc-famous,.hud.tidy .uc-mantra{display:none!important}
.uc-walkhint{position:absolute;left:50%;bottom:64px;transform:translateX(-50%);color:rgba(255,255,255,.72);font-size:12.5px;display:none;pointer-events:none;text-align:center}
.uc-walkhint.open{display:block}
@media (max-width:640px){.uc-chat{top:auto;bottom:64px;right:14px;left:14px;width:auto;max-height:56vh}.uc-card{top:auto;bottom:64px;right:14px;left:14px;width:auto}}
`

const TIDY_ICON = {
  hide: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.1 6.1C3.6 7.8 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 5.9-2.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
}

export class Hud {
  constructor(root, settings, actions) {
    this.settings = settings
    this.actions = actions
    const style = document.createElement('style')
    style.textContent = CSS
    document.head.appendChild(style)

    this.el = document.createElement('div')
    this.el.className = 'hud'
    this.el.innerHTML = `
      <a class="uc-logo" href="/" title="Back to your dashboard" aria-label="Unlimited Awesome: back to your dashboard"></a>
      <div class="panel uc-people"></div>
      <div class="panel uc-famous" hidden></div>
      <div class="panel rail">
        <button class="btn" data-act="home" title="Home view (hold to save this view as home)">${ICON.home}</button>
        <button class="btn" data-act="orbit" title="Orbit the campus">${ICON.orbit}</button>
        <button class="btn" data-act="night" title="Day / night">${ICON.moon}</button>
        <button class="btn" data-act="crew" title="Show / hide students">${ICON.crew}</button>
        <button class="btn" data-act="walk" title="Drop in and walk (Esc to fly again)">${ICON.walk}</button>
        <button class="btn" data-act="bus" title="Ride the bus round every school and castle (Esc to get off)">${ICON.bus}</button>
        <button class="btn" data-act="vr" title="Enter VR" hidden>${ICON.vr}</button>
        <button class="btn" data-act="help" title="Help">${ICON.help}</button>
      </div>
      <div class="panel uc-ride"><div class="where"><small></small><span></span><em></em></div><button class="btn" data-act="getoff">Get off</button></div>
      <div class="panel uc-chips"></div>
      <div class="panel uc-card"><button class="btn x" data-act="close">✕</button><img class="art" alt="" hidden><div class="kicker"></div><h2></h2><p></p><div class="badges"></div><div class="row"></div></div>
      <div class="panel uc-help">
        <h3>Walking the campus</h3>
        <p><kbd>Drag</kbd> to pan, <kbd>Wheel</kbd> or pinch to zoom, <kbd>Right-drag</kbd> to orbit.</p>
        <p>Click a castle for its badges, a badge kiosk for the badge, a student to meet them.</p>
        <p>The chips along the bottom fly to each castle. Home returns to the plaza.</p>
        <p>On a Quest, open this page in the headset browser and press Enter VR.</p>
        <h3 style="margin-top:12px">Inside a castle</h3>
        <p>Each castle holds a course. Click one and choose <b>Enter</b>.</p>
        <p><b>Walk onto the glowing circle in the middle</b> and it takes you to your next module. Or walk onto the lit pad in front of any numbered gate to go straight to that one.</p>
        <p>In a module: the wall plays the video, the stand holds the podcast, the board shows the infographic. <b>← Hall</b> brings you back, <b>Leave the castle</b> takes you outside.</p>
        <div class="row"><button class="btn primary" data-act="closehelp">Got it</button></div>
      </div>
      <div class="panel uc-chat">
        <div class="head"><img alt=""><div><b></b><small></small></div><button class="btn x mute" data-act="mute" type="button" title="Mute the voice" aria-pressed="false">🔊</button><button class="btn x" data-act="closechat">✕</button></div>
        <div class="log"></div>
        <div class="sound"></div>
        <div class="notify" hidden><span></span><button class="btn" type="button">Turn on</button></div>
        <form><input type="text" placeholder="Ask them something…" autocomplete="off" maxlength="300"><button class="btn primary" type="submit">Ask</button></form>
      </div>
      <div class="panel uc-course">
        <div class="head"><b></b><small></small><div class="bar"><i></i></div></div>
        <div class="mods"></div>
        <div class="foot"><button class="btn" data-act="leavecastle">Leave the castle</button><button class="btn primary" data-act="askguide">Ask your guide</button></div>
      </div>
      <div class="panel uc-media"><div class="now"></div><div class="player"><button class="btn" type="button" data-p="back" title="Back 10 seconds">&#8634; 10</button><button class="btn primary" type="button" data-p="toggle" title="Play / pause">&#9208;</button><button class="btn" type="button" data-p="fwd" title="Forward 10 seconds">10 &#8635;</button><input type="range" min="0" max="1000" value="0" aria-label="Seek"><span class="t">0:00 / 0:00</span><button class="btn" type="button" data-p="mute" title="Mute">&#128266;</button></div><div class="items"></div></div>
      <div class="panel uc-quest"><h4></h4><p></p><div class="pips"></div><div class="row"></div></div>
      <div class="panel uc-prompt"></div>
      <div class="uc-walkhint"><kbd>W A S D</kbd> to walk · drag to look · <kbd>Shift</kbd> to jog · <kbd>Esc</kbd> to fly again</div>
      <div class="uc-mantra">The Universe is conspiring to help me.</div>
      <button class="panel btn uc-tidy" type="button" data-act="tidy"></button>
      <div class="toasts"></div>`
    root.appendChild(this.el)
    this.$ = (s) => this.el.querySelector(s)
    this.card = this.$('.uc-card')
    this.chat = this.$('.uc-chat')
    this.chatLog = this.$('.uc-chat .log')
    this.prompt = this.$('.uc-prompt')
    this.walkHint = this.$('.uc-walkhint')
    this.course = this.$('.uc-course')
    this.$('.uc-course .head').addEventListener('click', () => this.course.classList.toggle('min'))
    this.media = this.$('.uc-media')
    this.quest = this.$('.uc-quest')
    this.$('.uc-chat form').addEventListener('submit', (ev) => {
      ev.preventDefault()
      const input = this.$('.uc-chat input')
      const text = input.value.trim()
      if (!text) return
      input.value = ''
      this.actions.ask?.(text)
    })
    this.prompt.addEventListener('click', () => this.actions.talk?.())
    this.help = this.$('.uc-help')
    // One button hides the menus so a phone screen is just the campus. Phones start tidy;
    // whatever the person picks is remembered (storage can throw in private windows).
    let saved = null
    try { saved = localStorage.getItem('uc.tidy') } catch {}
    this.setTidy(saved != null ? saved === '1' : matchMedia('(max-width: 640px)').matches, false)
    this.chips = this.$('.uc-chips')

    for (const c of CASTLES) {
      const b = document.createElement('button')
      b.className = 'chip'
      b.dataset.castle = c.id
      b.innerHTML = `<i style="background:${c.accent};box-shadow:0 0 8px ${c.accent}"></i>${c.short}`
      b.title = c.name
      b.addEventListener('click', () => actions.flyTo?.(c.id))
      this.chips.appendChild(b)
    }
    this.el.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-act]')
      if (!b) return
      const act = b.dataset.act
      if (act === 'close') this.closeCard()
      else if (act === 'closehelp') this.toggleHelp(false)
      else if (act === 'closechat') this.closeChat()
      else if (act === 'leavecastle') this.actions.leaveCastle?.()
      else if (act === 'askguide') this.actions.askGuide?.()
      else if (act === 'help') this.toggleHelp()
      else if (act === 'tidy') this.setTidy(!this.el.classList.contains('tidy'), true)
      else actions[act]?.()
    })
    // hold Home to save the view
    const home = this.$('[data-act="home"]')
    let holdT = 0
    home.addEventListener('pointerdown', () => {
      this._saved = false
      holdT = setTimeout(() => {
        actions.saveHome?.()
        navigator.vibrate?.(18)
        this.toast('Home view saved: position, angle and zoom')
        holdT = 0
        this._saved = true
      }, 650)
    })
    const cancel = () => {
      if (holdT) clearTimeout(holdT)
      holdT = 0
    }
    home.addEventListener('pointerup', cancel)
    home.addEventListener('pointerleave', cancel)
    // the click fires after pointerup; a completed hold must not also fly home
    home.addEventListener('click', (ev) => {
      if (this._saved) {
        this._saved = false
        ev.stopPropagation()
      }
    }, true)
  }

  setPeople(list, onClick) {
    const wrap = this.$('.uc-people')
    wrap.innerHTML = ''
    for (const p of list) {
      const b = document.createElement('button')
      b.dataset.person = p.id
      b.title = `Find ${p.name}`
      b.innerHTML = `<img src="${p.face}" alt="">${p.name}`
      b.addEventListener('click', () => onClick(p.id))
      wrap.appendChild(b)
    }
  }
  /**
   * One chip for a whole group (the famous teachers, the mentors) that opens a dropdown of face
   * chips. Each group gets its own dropdown; opening one closes the others.
   */
  setPeopleGroup(label, list, onClick) {
    const wrap = this.$('.uc-people')
    let menu = this.$('.uc-famous')
    if (menu.dataset.group) {
      const next = document.createElement('div')
      next.className = 'panel uc-famous'
      next.hidden = true
      menu.after(next)
      menu = next
    }
    menu.dataset.group = label
    const b = document.createElement('button')
    b.dataset.group = label
    b.title = `Find one of the ${list.length} ${label.toLowerCase()}`
    b.innerHTML = `<span class="facestack">${list.slice(0, 3).map((p) => `<img src="${p.face}" alt="">`).join('')}</span>${label}<span class="caret">▼</span>`
    const close = () => {
      menu.hidden = true
      b.classList.remove('open')
    }
    b.addEventListener('click', (e) => {
      e.stopPropagation()
      const opening = menu.hidden
      for (const other of this.el.querySelectorAll('.uc-famous')) other.hidden = true
      for (const other of wrap.querySelectorAll('[data-group]')) other.classList.remove('open')
      menu.hidden = !opening
      b.classList.toggle('open', opening)
    })
    wrap.appendChild(b)
    menu.innerHTML = `<div class="head">${label} on campus</div>`
    for (const p of list) {
      const c = document.createElement('button')
      c.dataset.person = p.id
      c.title = p.known || p.name
      c.innerHTML = `<img src="${p.face}" alt="" loading="lazy">${p.name}`
      c.addEventListener('click', (e) => {
        e.stopPropagation()
        close()
        onClick(p.id)
      })
      menu.appendChild(c)
    }
    menu.addEventListener('click', (e) => e.stopPropagation())
    document.addEventListener('click', close)
    this._groups = this._groups || new Map()
    this._groups.set(label, new Set(list.map((p) => p.id)))
  }
  setActivePerson(id) {
    for (const b of this.$('.uc-people').children) {
      if (b.dataset.group) b.classList.toggle('active', Boolean(id && this._groups?.get(b.dataset.group)?.has(id)))
      else b.classList.toggle('active', b.dataset.person === id)
    }
    for (const menu of this.el.querySelectorAll('.uc-famous')) for (const b of menu.children) if (b.dataset.person) b.classList.toggle('active', b.dataset.person === id)
  }
  setActiveChip(id) {
    for (const b of this.chips.children) b.classList.toggle('active', b.dataset.castle === id)
  }
  setOrbit(on) {
    this.$('[data-act="orbit"]').classList.toggle('active', on)
  }
  setNight(on) {
    const b = this.$('[data-act="night"]')
    b.innerHTML = on ? ICON.sun : ICON.moon
    b.classList.toggle('active', on)
  }
  setCrew(on) {
    this.$('[data-act="crew"]').classList.toggle('active', on)
  }
  setVrAvailable(on) {
    this.$('[data-act="vr"]').hidden = !on
  }
  setVrActive(on) {
    this.$('[data-act="vr"]').classList.toggle('active', on)
  }
  setTidy(on, remember) {
    this.el.classList.toggle('tidy', on)
    const b = this.$('.uc-tidy')
    b.innerHTML = on ? TIDY_ICON.menu : TIDY_ICON.hide
    b.title = on ? 'Show the menus' : 'Hide the menus'
    b.setAttribute('aria-pressed', String(on))
    if (remember) try { localStorage.setItem('uc.tidy', on ? '1' : '0') } catch {}
  }

  toggleHelp(force) {
    this.help.classList.toggle('open', force)
  }

  /** card = { kicker, title, text, badges?: [{name, lit, color}], accent, actions?: [{label, fn, primary}] } */
  showCard(card) {
    const c = this.card
    const img = c.querySelector('img.art')
    img.hidden = !card.image
    if (card.image) {
      img.src = card.image
      img.classList.toggle('square', Boolean(card.square))
    }
    c.querySelector('.kicker').textContent = card.kicker || ''
    c.querySelector('h2').textContent = card.title || ''
    c.querySelector('p').textContent = card.text || ''
    const badges = c.querySelector('.badges')
    badges.innerHTML = ''
    for (const b of card.badges || []) {
      const s = document.createElement('span')
      s.className = `badge${b.lit ? ' lit' : ''}`
      s.textContent = b.name
      if (b.lit) s.style.background = b.color || card.accent || BRAND.lime
      badges.appendChild(s)
    }
    const row = c.querySelector('.row')
    row.innerHTML = ''
    for (const a of card.actions || []) {
      const b = document.createElement('button')
      b.className = `btn${a.primary ? ' primary' : ''}`
      b.textContent = a.label
      b.addEventListener('click', a.fn)
      row.appendChild(b)
    }
    c.style.borderColor = card.accent ? `${card.accent}66` : ''
    c.classList.add('open')
  }
  closeCard() {
    this.card.classList.remove('open')
    this.actions.cardClosed?.()
  }

  /**
   * The course panel down the left: every module, which are finished, and where you are.
   * `onPick` is called with a module number.
   */
  showCourse(course, { done = [], here = null, onPick } = {}) {
    if (!course) {
      this.course.classList.remove('open')
      return
    }
    this.course.classList.add('open')
    // in a module the list folds away to its title; tap the title to see every module again
    this.course.classList.toggle('min', here != null)
    this.$('.uc-course .head b').textContent = course.name
    this.$('.uc-course .head small').textContent = course.tagline
    const pct = Math.round((done.length / course.modules.length) * 100)
    this.$('.uc-course .bar i').style.width = `${pct}%`
    const list = this.$('.uc-course .mods')
    list.innerHTML = ''
    for (const m of course.modules) {
      const b = document.createElement('button')
      b.className = `mod${done.includes(m.n) ? ' done' : ''}${here === m.n ? ' here' : ''}`
      b.innerHTML = `<i>${done.includes(m.n) ? '✓' : m.n}</i><span>${m.title}<small>${m.goal}</small></span>`
      b.addEventListener('click', () => onPick?.(m.n))
      list.appendChild(b)
    }
  }

  /** The media bar: what is playing, and the buttons for this module's five things. */
  showMedia(items) {
    if (!items || !items.length) {
      this.media.classList.remove('open')
      return
    }
    this.media.classList.add('open')
    const row = this.media.querySelector('.items')
    row.innerHTML = ''
    for (const it of items) {
      const b = document.createElement('button')
      b.className = `btn${it.primary ? ' primary' : ''}`
      b.textContent = it.label
      b.addEventListener('click', it.fn)
      row.appendChild(b)
    }
  }

  /**
   * Transport for whatever is playing (the wall video or the podcast): play/pause, 10 s back and
   * forward, a seek bar with the time, mute. `null` hides it.
   */
  setPlayer(el) {
    this._unbindPlayer?.()
    const pl = this.media.querySelector('.player')
    pl.classList.toggle('on', Boolean(el))
    if (!el) return
    const [toggle, mute] = ['toggle', 'mute'].map((k) => pl.querySelector(`[data-p=${k}]`))
    const range = pl.querySelector('input')
    const time = pl.querySelector('.t')
    const fmt = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00')
    let seeking = false
    const sync = () => {
      toggle.innerHTML = el.paused ? '&#9654;' : '&#9208;'
      mute.innerHTML = el.muted ? '&#128263;' : '&#128266;'
      if (!seeking && el.duration) range.value = String(Math.round((el.currentTime / el.duration) * 1000))
      time.textContent = `${fmt(el.currentTime)} / ${fmt(el.duration)}`
    }
    const acts = {
      back: () => (el.currentTime = Math.max(0, el.currentTime - 10)),
      fwd: () => (el.currentTime = Math.min(el.duration || 0, el.currentTime + 10)),
      toggle: () => (el.paused ? el.play().catch(() => {}) : el.pause()),
      mute: () => (el.muted = !el.muted),
    }
    const click = (ev) => acts[ev.target.closest('[data-p]')?.dataset.p]?.()
    const input = () => {
      seeking = true
      if (el.duration) time.textContent = `${fmt((range.value / 1000) * el.duration)} / ${fmt(el.duration)}`
    }
    const change = () => {
      if (el.duration) el.currentTime = (range.value / 1000) * el.duration
      seeking = false
    }
    const events = ['timeupdate', 'play', 'pause', 'loadedmetadata', 'durationchange', 'volumechange', 'ended']
    pl.addEventListener('click', click)
    range.addEventListener('input', input)
    range.addEventListener('change', change)
    events.forEach((e) => el.addEventListener(e, sync))
    sync()
    this._unbindPlayer = () => {
      pl.removeEventListener('click', click)
      range.removeEventListener('input', input)
      range.removeEventListener('change', change)
      events.forEach((e) => el.removeEventListener(e, sync))
      this._unbindPlayer = null
    }
  }

  /** Inside a castle the outdoor chrome (castle chips, people, the rail) goes: it is a classroom. */
  setInside(on) {
    this.el.classList.toggle('inside', Boolean(on))
  }

  nowPlaying(text) {
    const el = this.media.querySelector('.now')
    if (el) el.textContent = text || ''
  }

  /** The quest card: what this module asks you to do, and how far along you are. */
  showQuest(quest) {
    if (!quest) {
      this.quest.classList.remove('open')
      return
    }
    this.quest.classList.add('open')
    this.quest.querySelector('h4').textContent = quest.kicker || 'Your quest'
    this.quest.querySelector('p').textContent = quest.text
    const pips = this.quest.querySelector('.pips')
    pips.innerHTML = ''
    if (quest.of) {
      for (let i = 0; i < quest.of; i++) {
        const d = document.createElement('div')
        d.className = `pip${i < (quest.at || 0) ? ' on' : ''}`
        pips.appendChild(d)
      }
    }
    const row = this.quest.querySelector('.row')
    row.innerHTML = ''
    for (const a of quest.actions || []) {
      const b = document.createElement('button')
      b.className = `btn${a.primary ? ' primary' : ''}`
      b.textContent = a.label
      b.addEventListener('click', a.fn)
      row.appendChild(b)
    }
  }

  /** The rail's walk button, and the controls hint along the bottom. */
  setWalk(on) {
    const b = this.$('[data-act="walk"]')
    if (b) {
      b.classList.toggle('on', on)
      b.innerHTML = on ? ICON.fly : ICON.walk
      b.title = on ? 'Fly again (Esc)' : 'Drop in and walk (Esc to fly again)'
    }
    this.walkHint.classList.toggle('open', Boolean(on))
    if (!on) this.showPrompt(null)
  }

  /** "Talk to Socrates" over the bottom of the screen, when you are standing by someone. */
  showPrompt(name) {
    if (!name) {
      this.prompt.classList.remove('open')
      return
    }
    this.prompt.innerHTML = `💬 Talk to <b style="margin:0 2px">${name}</b> <kbd>E</kbd>`
    this.prompt.classList.add('open')
  }

  /** A plain instruction in the same place as the talk prompt (no name, no key hint). */
  showHint(text) {
    if (!text) {
      this.prompt.classList.remove('open')
      return
    }
    this.prompt.innerHTML = text
    this.prompt.classList.add('open')
  }

  openChat({ name, known, face, message = false }) {
    this.showPrompt(null)
    this.closeCard()
    this.chat.classList.add('open')
    const img = this.$('.uc-chat .head img')
    img.src = face || ''
    img.style.display = face ? '' : 'none'
    this.$('.uc-chat .head b').textContent = name
    this.$('.uc-chat .head small').textContent = known || ''
    // you ask a teacher a question; you send a person a message
    const input = this.$('.uc-chat input')
    const first = String(name || '').split(' ')[0]
    input.placeholder = message ? `Message ${first}…` : 'Ask them something…'
    input.maxLength = message ? 2000 : 300
    this.$('.uc-chat button[type="submit"]').textContent = message ? 'Send' : 'Ask'
    this.chatLog.innerHTML = ''
    this.$('.uc-chat .sound').textContent = ''
    this.showNotifyOffer(null)
    setTimeout(() => this.$('.uc-chat input')?.focus({ preventScroll: true }), 50)
  }

  /** Empty the thread without closing the panel (a person chat reloads from the server). */
  clearChat() {
    this.chatLog.innerHTML = ''
  }

  /** The purple dot on someone's find-me chip: how many messages are waiting from them. */
  setPersonBadge(id, count) {
    const b = this.$(`.uc-people button[data-person="${id}"]`)
    if (!b) return
    let dot = b.querySelector('.badge')
    if (!count) {
      dot?.remove()
      return
    }
    if (!dot) {
      dot = document.createElement('span')
      dot.className = 'badge'
      b.appendChild(dot)
    }
    dot.textContent = count > 9 ? '9+' : String(count)
  }

  /** The "get notified" offer on a person thread. Pass null to hide it. */
  showNotifyOffer(text, onClick) {
    const row = this.$('.uc-chat .notify')
    if (!text) {
      row.hidden = true
      return
    }
    row.querySelector('span').textContent = text
    const btn = row.querySelector('button')
    btn.onclick = onClick
    btn.hidden = !onClick
    row.hidden = false
  }

  /** The ride bar: { label, text, sight } while riding, null to put it away. */
  setRide(info) {
    const bar = this.$('.uc-ride')
    bar.classList.toggle('open', Boolean(info))
    this.$('[data-act="bus"]')?.classList.toggle('active', Boolean(info))
    if (!info) return
    bar.querySelector('small').textContent = info.label
    bar.querySelector('span').textContent = info.text
    bar.querySelector('em').textContent = info.sight || ''
  }

  get chatOpen() {
    return this.chat.classList.contains('open')
  }

  closeChat() {
    this.chat.classList.remove('open')
    this.actions.chatClosed?.()
  }

  /** Add a line to the chat. `who` is 'them', 'you' or 'wait'; returns the element. */
  say(who, text) {
    const el = document.createElement('div')
    el.className = `msg ${who}`
    el.textContent = text
    this.chatLog.appendChild(el)
    this.chatLog.scrollTop = this.chatLog.scrollHeight
    return el
  }

  /**
   * The line under the chat log. With `stoppable`, it carries a Stop button, because a teacher
   * who is mid-sentence is the one time you most want the voice to end and cannot wait for it.
   */
  chatNote(text, stoppable = false) {
    const el = this.$('.uc-chat .sound')
    el.textContent = text || ''
    if (!text || !stoppable) return
    const b = document.createElement('button')
    b.className = 'btn tiny'
    b.type = 'button'
    b.dataset.act = 'stopVoice'
    b.textContent = 'Stop'
    el.appendChild(b)
  }

  /** The speaker toggle: off means no voice at all until it is turned back on. */
  setMuted(on) {
    const b = this.$('.uc-chat .mute')
    if (!b) return
    b.textContent = on ? '\u{1F507}' : '\u{1F50A}'
    b.title = on ? 'The voice is off. Turn it back on' : 'Mute the voice'
    b.setAttribute('aria-pressed', on ? 'true' : 'false')
    b.classList.toggle('active', on)
  }

  toast(message, kind = '') {
    const wrap = this.$('.toasts')
    const t = document.createElement('div')
    t.className = `panel toast uc-toast ${kind}`
    t.textContent = message
    wrap.appendChild(t)
    setTimeout(() => t.remove(), 4200)
  }
  removeBoot() {
    const boot = document.querySelector('.boot')
    if (!boot) return
    boot.style.opacity = '0'
    setTimeout(() => boot.remove(), 520)
  }
}
