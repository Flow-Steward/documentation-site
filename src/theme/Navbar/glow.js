export function mountGlow(root){
var disposers=[];
function listen(type,handler){root.addEventListener(type,handler);disposers.push(function(){root.removeEventListener(type,handler);});}
var st = document.createElement('style');
st.textContent = '@keyframes fs-nudge{0%,100%{transform:translateX(0)}30%{transform:translateX(4px)}55%{transform:translateX(-1px)}75%{transform:translateX(2px)}}[data-fs-nudge]{width:fit-content;justify-self:start;flex:none}[data-fs-nudge] svg{transition:transform .3s ease}[data-fs-nudge]:hover svg,[data-fs-nudge]:focus-visible svg{animation:fs-nudge 1.4s cubic-bezier(.45,0,.55,1) infinite}[data-fs-glow]{will-change:scale;backface-visibility:hidden;transform:translateZ(0)}@media (prefers-reduced-motion:reduce){[data-fs-nudge] svg{animation:none!important}[data-fs-glow]{scale:1!important}}';
document.head.appendChild(st);
var HOVER = 1.04, PRESS = 0.97;
function set(el, on){ el._on = on; el.style.setProperty('--btn-bg', on ? 'var(--primary-hover)' : 'var(--primary)'); el.style.scale = on ? HOVER : 1; }
function find(t){ return t && t.closest ? t.closest('[data-fs-glow]') : null; }
listen('mouseover', function(e){ var el = find(e.target); if (el && !el.contains(e.relatedTarget)) set(el, true); });
listen('mouseout', function(e){ var el = find(e.target); if (el && !el.contains(e.relatedTarget)) set(el, false); });
listen('focusin', function(e){ var el = find(e.target); if (el) set(el, true); });
listen('focusout', function(e){ var el = find(e.target); if (el) set(el, false); });
listen('pointerdown', function(e){ var el = find(e.target); if (el) el.style.scale = (el._on ? HOVER : 1) * PRESS; });
listen('pointerup', function(e){ var el = find(e.target); if (el) el.style.scale = el._on ? HOVER : 1; });
return function(){disposers.forEach(function(dispose){dispose();});st.remove();};
}
