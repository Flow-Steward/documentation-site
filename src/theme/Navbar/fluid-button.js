// Verified promo flood renderer: simulation retained; React owns scoped mount/disposal.
// Elements with data-fs-fluid="flood|trail|idle" are enhanced in place.
// Canvas is hidden at rest — the element's own background shows; it only paints while the water moves.
export function mountFluid(root) {
  var instances = [], observers = [], disposers = [], restorations = [], disposed = false;
  function listen(el, type, handler) { el.addEventListener(type, handler); disposers.push(function(){el.removeEventListener(type, handler);}); }
  function observeText(tn, fill) { var observer = new MutationObserver(fill); observers.push(observer); observer.observe(tn, {characterData:true}); }
  var RM = matchMedia('(prefers-reduced-motion: reduce)');
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function parse(s) {
    s = (s || '').trim(); var m;
    if (/^#[0-9a-f]{6}$/i.test(s)) return [1, 3, 5].map(function (i) { return parseInt(s.substr(i, 2), 16) / 255; });
    if (/^#[0-9a-f]{3}$/i.test(s)) return [1, 2, 3].map(function (i) { return parseInt(s[i] + s[i], 16) / 255; });
    if ((m = s.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?/i))) { if (m[4] !== undefined && +m[4] === 0) return null; return [m[1] / 255, m[2] / 255, m[3] / 255]; }
    return null;
  }
  function ab(c) { return c.map(function (v) { return -Math.log(Math.max(v, 0.004)); }); }
  function lum(c) { return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  var P = {
    trail: { dyes: ['#3FB0DE'], cap: .86, inject: 12, relaxOn: .35, relaxOff: .45, eps: 3.2, drag: 1, swirl: 0, idle: 0, ripple: 1, enter: .9, damp: .9 },
    flood: { dyes: ['#1268C9', '#2BA38C', '#57C79E'], cap: .88, inject: 6, relaxOn: .04, relaxOff: .8, eps: 4.5, drag: .9, swirl: 90, idle: 0, ripple: .7, enter: 1.3, damp: .7 },
    idle: { dyes: ['#1268C9', '#3FB0DE'], cap: .8, inject: 7, relaxOn: .3, relaxOff: .3, eps: 2.8, drag: .85, swirl: 0, idle: 1, ripple: .6, enter: .7, damp: .9 }
  };
  Object.keys(P).forEach(function (k) { P[k].ab = P[k].dyes.map(function (h) { return ab(parse(h)); }); });
  var HV = 3, HD = 1.5;
  var LH = (function () { var x = -.287, y = -.493, z = 1.821, l = Math.sqrt(x * x + y * y + z * z); return [x / l, y / l, z / l]; })();

  function samp(f, nx, ny, h, x, y) {
    var gx = x / h - .5, gy = y / h - .5;
    if (gx < 0) gx = 0; else if (gx > nx - 1) gx = nx - 1;
    if (gy < 0) gy = 0; else if (gy > ny - 1) gy = ny - 1;
    var i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j, i1 = i < nx - 1 ? i + 1 : i, j1 = j < ny - 1 ? j + 1 : j;
    var a = f[j * nx + i], b = f[j * nx + i1], c = f[j1 * nx + i], d = f[j1 * nx + i1];
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  }
  function samp3(f, nx, ny, h, x, y, o, k) {
    var gx = x / h - .5, gy = y / h - .5;
    if (gx < 0) gx = 0; else if (gx > nx - 1) gx = nx - 1;
    if (gy < 0) gy = 0; else if (gy > ny - 1) gy = ny - 1;
    var i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j, i1 = i < nx - 1 ? i + 1 : i, j1 = j < ny - 1 ? j + 1 : j;
    var a = (j * nx + i) * 3, b = (j * nx + i1) * 3, c = (j1 * nx + i) * 3, d = (j1 * nx + i1) * 3;
    for (var n = 0; n < 3; n++) o[k + n] = (f[a + n] + (f[b + n] - f[a + n]) * fx) * (1 - fy) + (f[c + n] + (f[d + n] - f[c + n]) * fx) * fy;
  }

  function Fluid(el, opt) {
    instances.push(this);
    this.el = el; this.s = opt.s || 1; this.p = P[opt.variant] || P.flood;
    this.tick = this.tick.bind(this); this.raf = 0; this.spin = 1; this.t = 0; this.visible = true; this.hover = false; this.ptr = null; this.auto = null;
    this.maxV = this.maxH = this.dev = 0; this.lm = false; this.ls = []; this.W = this.H = 0; this.shown = false;
    var cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';
    if (cs.isolation !== 'isolate') el.style.isolation = 'isolate';
    var cv = this.cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true'); cv.setAttribute('data-fs-fluid-canvas', '');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;opacity:0;border-radius:inherit';
    el.insertBefore(cv, el.firstChild);
    this.ctx = cv.getContext('2d');
    if (!el.hasAttribute('aria-label')) { var t = (el.textContent || '').replace(/\s+/g, ' ').trim(); if (t) el.setAttribute('aria-label', t); }
    this.split(el); this.colors(); this.bind();
    var self = this;
    this.ro = new ResizeObserver(function () { self.layout(); }); this.ro.observe(el);
    if (this.p.idle) { this.io = new IntersectionObserver(function (es) { self.visible = es[es.length - 1].isIntersecting; if (self.visible) self.start(); }); this.io.observe(el); }
    if (document.fonts) document.fonts.ready.then(function () { if(!disposed) self.measure(); });
    this.layout();
  }
  var F = Fluid.prototype;

  F.split = function (root) {
    var self = this;
    Array.prototype.slice.call(root.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { if (/\S/.test(n.nodeValue)) self.wrap(n); }
      else if (n.nodeType === 1 && n !== self.cv && n.tagName !== 'svg' && n.tagName !== 'SVG' && n.getAttribute('aria-hidden') !== 'true') self.split(n);
    });
  };
  F.wrap = function (tn) {
    var self = this, w = document.createElement('span');
    w.setAttribute('data-fs-fluid-text', ''); w.style.cssText = 'display:inline-flex;transition:text-shadow .3s ease';
    tn.parentNode.replaceChild(w, tn);
    function fill() {
      self.ls = self.ls.filter(function (L) { return L.w !== w; }); w.textContent = '';
      Array.prototype.forEach.call(tn.nodeValue, function (ch) {
        var e = document.createElement('span'); e.textContent = ch; e.style.cssText = 'display:inline-block;white-space:pre';
        w.appendChild(e); var i = self.ls.length;
        self.ls.push({ el: e, w: w, x: 0, px: 0, py: 0, pr: 0, vx: 0, vy: 0, vr: 0, k: 190 * (1 + .24 * Math.sin(i * 2.17 + .6)) });
      });
      self.measure();
    }
    fill();
    observeText(tn, fill);
    restorations.push(function(){ if(w.parentNode) w.parentNode.replaceChild(tn,w); });
    (this.ws || (this.ws = [])).push(w);
  };

  F.colors = function () {
    var cs = getComputedStyle(this.el);
    var c = parse(cs.getPropertyValue('--primary')) || parse(cs.backgroundColor) || parse('#1E6251');
    this.B = ab(c);
    var tc = parse(cs.color) || [1, 1, 1];
    this.shadow = lum(tc) > .4
      ? '0 ' + this.s + 'px ' + 3 * this.s + 'px rgba(4,20,15,.5),0 0 1px rgba(4,20,15,.4)'
      : '0 0 ' + 3 * this.s + 'px rgba(255,255,255,.4)';
  };
  F.show = function (on) {
    if (this.shown === on) return; this.shown = on;
    this.cv.style.opacity = on ? '1' : '0';
    var sh = on ? this.shadow : '';
    (this.ws || []).forEach(function (w) { w.style.textShadow = sh; });
  };

  F.sdf = function (x, y) {
    var R = this.rad, hx = this.wu / 2, hy = this.hu / 2, qx = Math.abs(x - hx) - (hx - R), qy = Math.abs(y - hy) - (hy - R);
    var ox = Math.max(qx, 0), oy = Math.max(qy, 0);
    return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - R;
  };

  F.layout = function () {
    var el = this.el, s = this.s, W = el.offsetWidth, H = el.offsetHeight; if (!W || !H) return;
    if (W === this.W && H === this.H) { this.measure(); return; }
    this.W = W; this.H = H;
    var wu = this.wu = W / s, hu = this.hu = H / s, i, j, k, d;
    this.rad = Math.min(hu / 2, (parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0) / s);
    this.cv.width = Math.round(W); this.cv.height = Math.round(H);
    this.img = this.ctx.createImageData(this.cv.width, this.cv.height);
    var nx = this.nx = Math.ceil(wu / HV), ny = this.ny = Math.ceil(hu / HV), n = nx * ny;
    this.u = new Float32Array(n); this.v = new Float32Array(n); this.u2 = new Float32Array(n); this.v2 = new Float32Array(n);
    this.pr = new Float32Array(n); this.dv = new Float32Array(n); this.cu = new Float32Array(n); this.sv = new Uint8Array(n);
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) this.sv[j * nx + i] = this.sdf((i + .5) * HV, (j + .5) * HV) > -HV * .25 ? 1 : 0;
    var mx = this.mx = Math.ceil(wu / HD), my = this.my = Math.ceil(hu / HD), m = mx * my;
    this.A = new Float32Array(m * 3); this.A2 = new Float32Array(m * 3);
    this.h = new Float32Array(m); this.hp = new Float32Array(m); this.hn = new Float32Array(m);
    this.gx = new Float32Array(m); this.gy = new Float32Array(m); this.lp = new Float32Array(m);
    this.sd = new Uint8Array(m); this.pf = new Float32Array(m);
    for (j = 0; j < my; j++) for (i = 0; i < mx; i++) { k = j * mx + i; d = this.sdf((i + .5) * HD, (j + .5) * HD); this.sd[k] = d > 0 ? 1 : 0; this.pf[k] = .95 + .07 * Math.sqrt(clamp(-d / 10, 0, 1)); }
    this.rest(); this.measure();
    if (this.p.idle) this.start();
  };
  F.measure = function () {
    var el = this.el, r = el.getBoundingClientRect(); if (!r.width) return;
    var k = this.W / r.width / this.s;
    this.ls.forEach(function (L) { var q = L.el.getBoundingClientRect(); L.x = (q.left + q.width / 2 - r.left) * k; });
  };

  F.rest = function () {
    var A = this.A, B = this.B; if (!A) return;
    for (var k = 0; k < A.length; k += 3) { A[k] = B[0]; A[k + 1] = B[1]; A[k + 2] = B[2]; }
    [this.u, this.v, this.pr, this.h, this.hp, this.hn, this.gx, this.gy, this.lp].forEach(function (f) { f.fill(0); });
    this.ls.forEach(function (L) { L.px = L.py = L.pr = L.vx = L.vy = L.vr = 0; L.el.style.transform = ''; });
    this.maxV = this.maxH = this.dev = 0; this.lm = false;
  };
  F.wake = function () { if (!this.raf && !this.shown) { this.colors(); this.rest(); } };

  F.bind = function () {
    var self = this, el = this.el;
    function pos(e) { var r = el.getBoundingClientRect(); return { x: (e.clientX - r.left) * self.W / r.width / self.s, y: (e.clientY - r.top) * self.H / r.height / self.s }; }
    listen(el,'pointerenter', function (e) {
      if (e.pointerType === 'touch' || !self.img || RM.matches) return;
      self.wake(); self.measure();
      var q = pos(e); self.hover = true; self.spin = -self.spin;
      self.ptr = { x: q.x, y: q.y, lx: q.x, ly: q.y, vx: 0, vy: 0, t: e.timeStamp, dist: self.ptr ? self.ptr.dist : 0 };
      self.drop(q.x, q.y, 5, self.p.enter * .45); self.kick(q.x, 1); self.start();
    });
    listen(el,'pointermove', function (e) {
      var c = self.ptr; if (!self.hover || !c || e.pointerType === 'touch') return;
      var q = pos(e), dt = Math.max(4, e.timeStamp - c.t) / 1000;
      c.vx = c.vx * .4 + (q.x - c.x) / dt * .6; c.vy = c.vy * .4 + (q.y - c.y) / dt * .6;
      c.x = q.x; c.y = q.y; c.t = e.timeStamp; self.start();
    });
    listen(el,'pointerleave', function (e) { if (e.pointerType !== 'touch') self.hover = false; });
    listen(el,'pointerdown', function (e) {
      if (RM.matches || !self.img) return;
      self.wake();
      var q = pos(e); self.drop(q.x, q.y, 6, .75); self.kick(q.x, 1.6);
      if (e.pointerType === 'touch') self.stroke(q.x, q.y);
      self.start();
    });
    listen(el,'focus', function () {
      if (el.matches(':focus-visible') && !RM.matches && self.img) { self.wake(); self.stroke(self.wu * .15, self.hu / 2); self.start(); }
    });
  };

  F.start = function () {
    if (this.raf || !this.img || RM.matches || !this.el.isConnected) return;
    this.show(true); this.last = performance.now(); this.raf = requestAnimationFrame(this.tick);
  };
  F.stroke = function (x, y) { this.auto = { t: 0, x0: x, y0: y, x: x, y: y, dx: x < this.wu / 2 ? 1 : -1, dist: 0 }; this.drop(x, y, 5, this.p.enter * .45); this.kick(x, 1); };

  F.tick = function (now) {
    this.raf = 0; if (!this.img || !this.el.isConnected) return;
    var dt = clamp((now - this.last) / 1000, 0, 1 / 30) || 1 / 60; this.last = now; this.t += dt;
    var p = this.p, c = this.ptr, idleOn = p.idle && this.visible && !document.hidden;
    if (c) { var dk = Math.exp(-dt * 10); c.vx *= dk; c.vy *= dk; }
    this.forces(dt, idleOn); this.fluid(dt); this.dye(dt); this.ripples(); this.letters(dt); this.render();
    if (this.hover || this.auto || idleOn || this.maxV > 2 || this.maxH > .004 || this.dev > .012 || this.lm) this.raf = requestAnimationFrame(this.tick);
    else { this.rest(); this.show(false); }
  };

  F.forces = function (dt, idleOn) {
    var p = this.p, c = this.ptr, sp, hu = this.hu;
    if (this.hover && c) {
      sp = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
      this.drag(c.x, c.y, c.vx, c.vy, 8, p.drag * Math.min(1, sp / 60), dt);
      if (p.swirl) this.swirl(c.x, c.y, 18, p.swirl * this.spin, dt);
      c.dist += Math.hypot(c.x - c.lx, c.y - c.ly) + (p.swirl ? 45 * dt : 0);
      this.ink(c.lx, c.ly, c.x, c.y, p.swirl ? 13 : 7, this.dyeAt(c.dist), p.cap, p.inject * dt * (p.swirl ? 1 : Math.min(1, sp / 140)));
      if (sp > 80) this.drop(c.x, c.y, 4.5, p.ripple * Math.min(1, sp / 600) * .035);
      c.lx = c.x; c.ly = c.y;
    }
    var au = this.auto;
    if (au) {
      au.t += dt;
      var e = Math.min(1, au.t / .55), ee = e * (2 - e);
      var x = au.x0 + au.dx * this.wu * .55 * ee, y = clamp(au.y0 + Math.sin(e * Math.PI * 2) * hu * .14, 8, hu - 8);
      this.drag(x, y, (x - au.x) / dt, (y - au.y) / dt, 8, p.drag, dt);
      if (p.swirl) this.swirl(x, y, 15, p.swirl * this.spin, dt);
      au.dist += Math.hypot(x - au.x, y - au.y);
      this.ink(au.x, au.y, x, y, 7, this.dyeAt(au.dist), p.cap, p.inject * dt * (p.swirl ? 1.4 : 1));
      au.x = x; au.y = y;
      if (e >= 1) this.auto = null;
    }
    if (idleOn) {
      for (var k = 0; k < 2; k++) {
        var ph = this.t * .32 + k * 3.1, wu = this.wu, am = hu * .2;
        var ix = wu * (.5 + .34 * Math.sin(ph + k)), iy = hu / 2 + am * Math.sin(ph * 1.6 + k * 2);
        var vx = wu * .34 * Math.cos(ph + k) * .32, vy = am * 1.6 * Math.cos(ph * 1.6 + k * 2) * .32;
        this.drag(ix, iy, vx * 2.5, vy * 2.5, 10, .18, dt);
        this.ink(ix, iy, ix, iy, 8, p.ab[k % p.ab.length], .62, dt * 1.6);
      }
    }
  };

  F.drag = function (x, y, vx, vy, r, str, dt) {
    if (str <= 0) return;
    var nx = this.nx, ny = this.ny, u = this.u, v = this.v, sv = this.sv, a = Math.min(1, dt * 20) * str, R2 = r * r, ext = r * 2;
    var i0 = Math.max(0, Math.floor((x - ext) / HV)), i1 = Math.min(nx - 1, Math.floor((x + ext) / HV));
    var j0 = Math.max(0, Math.floor((y - ext) / HV)), j1 = Math.min(ny - 1, Math.floor((y + ext) / HV));
    vx = clamp(vx, -900, 900); vy = clamp(vy, -900, 900);
    for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
      var k = j * nx + i; if (sv[k]) continue;
      var dx = (i + .5) * HV - x, dy = (j + .5) * HV - y, w = a * Math.exp(-(dx * dx + dy * dy) / R2);
      u[k] += (vx - u[k]) * w; v[k] += (vy - v[k]) * w;
    }
  };
  F.swirl = function (x, y, r, om, dt) {
    var nx = this.nx, ny = this.ny, u = this.u, v = this.v, sv = this.sv, R2 = r * r, ext = r * 2, f = om * dt * 3 / r;
    var i0 = Math.max(0, Math.floor((x - ext) / HV)), i1 = Math.min(nx - 1, Math.floor((x + ext) / HV));
    var j0 = Math.max(0, Math.floor((y - ext) / HV)), j1 = Math.min(ny - 1, Math.floor((y + ext) / HV));
    for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
      var k = j * nx + i; if (sv[k]) continue;
      var dx = (i + .5) * HV - x, dy = (j + .5) * HV - y, w = Math.exp(-(dx * dx + dy * dy) / R2) * f;
      u[k] -= dy * w; v[k] += dx * w;
    }
  };
  F.ink = function (x0, y0, x1, y1, r, D, cap, amt) {
    if (amt <= 0) return;
    var mx = this.mx, my = this.my, A = this.A, sd = this.sd, B = this.B, a = Math.min(1, amt), R2 = r * r, ext = r * 2;
    var t0 = B[0] + (D[0] - B[0]) * cap, t1 = B[1] + (D[1] - B[1]) * cap, t2 = B[2] + (D[2] - B[2]) * cap;
    var n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (var s = 1; s <= n; s++) {
      var x = x0 + (x1 - x0) * s / n, y = y0 + (y1 - y0) * s / n;
      var i0 = Math.max(0, Math.floor((x - ext) / HD)), i1 = Math.min(mx - 1, Math.floor((x + ext) / HD));
      var j0 = Math.max(0, Math.floor((y - ext) / HD)), j1 = Math.min(my - 1, Math.floor((y + ext) / HD));
      for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
        var k = j * mx + i; if (sd[k]) continue;
        var dx = (i + .5) * HD - x, dy = (j + .5) * HD - y, w = a * Math.exp(-(dx * dx + dy * dy) / R2), k3 = k * 3;
        A[k3] += (t0 - A[k3]) * w; A[k3 + 1] += (t1 - A[k3 + 1]) * w; A[k3 + 2] += (t2 - A[k3 + 2]) * w;
      }
    }
  };
  F.dyeAt = function (dist) {
    var L = this.p.ab, n = L.length; if (n === 1) return L[0];
    var t = (dist / 150) % n, i = Math.floor(t), f = t - i; f = f * f * (3 - 2 * f);
    var a = L[i], b = L[(i + 1) % n];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  };
  F.drop = function (x, y, r, amp) {
    if (!this.h || amp <= 0) return;
    var mx = this.mx, my = this.my, h = this.h, sd = this.sd, R2 = r * r, ext = r * 2.5;
    var i0 = Math.max(0, Math.floor((x - ext) / HD)), i1 = Math.min(mx - 1, Math.floor((x + ext) / HD));
    var j0 = Math.max(0, Math.floor((y - ext) / HD)), j1 = Math.min(my - 1, Math.floor((y + ext) / HD));
    for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
      var k = j * mx + i; if (sd[k]) continue;
      var dx = (i + .5) * HD - x, dy = (j + .5) * HD - y; h[k] -= amp * Math.exp(-(dx * dx + dy * dy) / R2);
    }
    this.dropped = true;
  };
  F.kick = function (x, amp) {
    this.ls.forEach(function (L) { var w = Math.exp(-Math.pow((L.x - x) / 18, 2)); L.vy -= amp * 14 * w; L.vr += amp * 16 * w * (L.x < x ? -1 : 1); });
    this.lm = true;
  };

  F.fluid = function (dt) {
    var nx = this.nx, ny = this.ny, u = this.u, v = this.v, u2 = this.u2, v2 = this.v2, sv = this.sv, cu = this.cu, pr = this.pr, dv = this.dv, p = this.p, i, j, k, it;
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      k = j * nx + i;
      cu[k] = (sv[k] || i === 0 || j === 0 || i === nx - 1 || j === ny - 1) ? 0 : ((v[k + 1] - v[k - 1]) - (u[k + nx] - u[k - nx])) / (2 * HV);
    }
    var f = p.eps * HV;
    for (j = 1; j < ny - 1; j++) for (i = 1; i < nx - 1; i++) {
      k = j * nx + i; if (sv[k]) continue;
      var gx = Math.abs(cu[k + 1]) - Math.abs(cu[k - 1]), gy = Math.abs(cu[k + nx]) - Math.abs(cu[k - nx]), l = Math.sqrt(gx * gx + gy * gy) + 1e-5, w = cu[k];
      u[k] += dt * f * (gy / l) * w; v[k] -= dt * f * (gx / l) * w;
    }
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      k = j * nx + i; if (sv[k]) { u2[k] = 0; v2[k] = 0; continue; }
      var bx = (i + .5) * HV - dt * u[k], by = (j + .5) * HV - dt * v[k];
      u2[k] = samp(u, nx, ny, HV, bx, by); v2[k] = samp(v, nx, ny, HV, bx, by);
    }
    this.u2 = u; this.v2 = v; this.u = u = u2; this.v = v = v2;
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      k = j * nx + i; if (sv[k]) { dv[k] = 0; continue; }
      var uL = (i > 0 && !sv[k - 1]) ? u[k - 1] : 0, uR = (i < nx - 1 && !sv[k + 1]) ? u[k + 1] : 0;
      var vD = (j > 0 && !sv[k - nx]) ? v[k - nx] : 0, vU = (j < ny - 1 && !sv[k + nx]) ? v[k + nx] : 0;
      dv[k] = (uR - uL + vU - vD) / (2 * HV);
    }
    for (k = 0; k < pr.length; k++) pr[k] *= .8;
    var h2 = HV * HV, pc, pL, pR, pD, pU;
    for (it = 0; it < 20; it++) for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      k = j * nx + i; if (sv[k]) continue; pc = pr[k];
      pL = (i > 0 && !sv[k - 1]) ? pr[k - 1] : pc; pR = (i < nx - 1 && !sv[k + 1]) ? pr[k + 1] : pc;
      pD = (j > 0 && !sv[k - nx]) ? pr[k - nx] : pc; pU = (j < ny - 1 && !sv[k + nx]) ? pr[k + nx] : pc;
      pr[k] = (pL + pR + pD + pU - h2 * dv[k]) * .25;
    }
    var dm = Math.exp(-p.damp * dt), mv = 0;
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      k = j * nx + i; if (sv[k]) { u[k] = v[k] = 0; continue; } pc = pr[k];
      pL = (i > 0 && !sv[k - 1]) ? pr[k - 1] : pc; pR = (i < nx - 1 && !sv[k + 1]) ? pr[k + 1] : pc;
      pD = (j > 0 && !sv[k - nx]) ? pr[k - nx] : pc; pU = (j < ny - 1 && !sv[k + nx]) ? pr[k + nx] : pc;
      u[k] = clamp((u[k] - (pR - pL) / (2 * HV)) * dm, -700, 700); v[k] = clamp((v[k] - (pU - pD) / (2 * HV)) * dm, -700, 700);
      var a = Math.abs(u[k]) + Math.abs(v[k]); if (a > mv) mv = a;
    }
    this.maxV = mv;
  };

  F.dye = function (dt) {
    var mx = this.mx, my = this.my, nx = this.nx, ny = this.ny, A = this.A, A2 = this.A2, sd = this.sd, B = this.B, u = this.u, v = this.v, p = this.p, i, j, k, k3;
    if (this.maxV > .5) {
      for (j = 0; j < my; j++) for (i = 0; i < mx; i++) {
        k = j * mx + i; k3 = k * 3;
        if (sd[k]) { A2[k3] = B[0]; A2[k3 + 1] = B[1]; A2[k3 + 2] = B[2]; continue; }
        var x = (i + .5) * HD, y = (j + .5) * HD;
        samp3(A, mx, my, HD, x - dt * samp(u, nx, ny, HV, x, y), y - dt * samp(v, nx, ny, HV, x, y), A2, k3);
      }
      this.A = A2; this.A2 = A; A = this.A;
    }
    var r = 1 - Math.exp(-((this.hover || this.auto) ? p.relaxOn : p.relaxOff) * dt), dev = 0;
    for (k3 = 0; k3 < A.length; k3 += 3) for (var c = 0; c < 3; c++) {
      var d = A[k3 + c] - B[c]; A[k3 + c] -= d * r; if (d < 0) d = -d; if (d > dev) dev = d;
    }
    this.dev = dev;
  };

  F.ripples = function () {
    if (this.maxH < 1e-5 && !this.dropped) { this.maxH = 0; return; }
    var mx = this.mx, my = this.my, h = this.h, hp = this.hp, hn = this.hn, sd = this.sd, i, j, k, c, L, R, D, U, s, t, mh = 0;
    for (s = 0; s < 2; s++) {
      for (j = 0; j < my; j++) for (i = 0; i < mx; i++) {
        k = j * mx + i; if (sd[k]) { hn[k] = 0; continue; }
        c = h[k]; L = i > 0 ? h[k - 1] : 0; R = i < mx - 1 ? h[k + 1] : 0; D = j > 0 ? h[k - mx] : 0; U = j < my - 1 ? h[k + mx] : 0;
        hn[k] = c + (c - hp[k]) * .978 + .24 * (L + R + D + U - 4 * c);
      }
      t = hp; hp = h; h = hn; hn = t;
    }
    this.h = h; this.hp = hp; this.hn = hn;
    var gx = this.gx, gy = this.gy, lp = this.lp;
    for (j = 0; j < my; j++) for (i = 0; i < mx; i++) {
      k = j * mx + i; c = h[k];
      L = i > 0 ? h[k - 1] : 0; R = i < mx - 1 ? h[k + 1] : 0; D = j > 0 ? h[k - mx] : 0; U = j < my - 1 ? h[k + mx] : 0;
      gx[k] = (R - L) / (2 * HD); gy[k] = (U - D) / (2 * HD); lp[k] = (L + R + D + U - 4 * c) / (HD * HD);
      if (c < 0) c = -c; if (c > mh) mh = c;
    }
    this.maxH = mh; this.dropped = false;
  };

  F.letters = function (dt) {
    var s = this.s, moving = false, self = this, y = this.hu / 2, fl = this.maxV > .5, rp = this.maxH > 1e-4;
    this.ls.forEach(function (L) {
      var ux = fl ? samp(self.u, self.nx, self.ny, HV, L.x, y) : 0, vy = fl ? samp(self.v, self.nx, self.ny, HV, L.x, y) : 0;
      var hh = rp ? samp(self.h, self.mx, self.my, HD, L.x, y) : 0;
      var tx = clamp(ux * .006, -1.2, 1.2), ty = clamp(vy * .006 - hh * 1.2, -1.4, 1.4), tr = clamp(ux * .016, -3.5, 3.5);
      var k = L.k, c = 2 * Math.sqrt(k) * .2, h = dt / 2;
      for (var n = 0; n < 2; n++) {
        L.vx += (-k * (L.px - tx) - c * L.vx) * h; L.px += L.vx * h;
        L.vy += (-k * (L.py - ty) - c * L.vy) * h; L.py += L.vy * h;
        L.vr += (-k * .8 * (L.pr - tr) - c * L.vr) * h; L.pr += L.vr * h;
      }
      if (Math.abs(L.px - tx) + Math.abs(L.py - ty) + Math.abs(L.vx) + Math.abs(L.vy) > .02 || Math.abs(L.vr) + Math.abs(L.pr - tr) > .05) moving = true;
      L.el.style.transform = 'translate(' + (L.px * s).toFixed(2) + 'px,' + (L.py * s).toFixed(2) + 'px) rotate(' + L.pr.toFixed(2) + 'deg)';
    });
    this.lm = moving;
  };

  F.render = function () {
    var img = this.img; if (!img) return;
    var d = img.data, cw = this.cv.width, ch = this.cv.height, s = this.s, mx = this.mx, my = this.my, A = this.A, pf = this.pf;
    var rip = this.maxH > 1e-4, h = this.h, GX = this.gx, GY = this.gy, LP = this.lp, o = this.o3 || (this.o3 = new Float32Array(3));
    var Hx = LH[0], Hy = LH[1], Hz = LH[2], sx = this.wu / cw, sy = this.hu / ch;
    for (var py = 0; py < ch; py++) {
      var y = (py + .5) * sy;
      for (var px = 0; px < cw; px++) {
        var x = (px + .5) * sx, hh = 0, gx = 0, gy = 0, lp = 0;
        if (rip) { hh = samp(h, mx, my, HD, x, y); gx = samp(GX, mx, my, HD, x, y); gy = samp(GY, mx, my, HD, x, y); lp = samp(LP, mx, my, HD, x, y); }
        samp3(A, mx, my, HD, x + gx * 5, y + gy * 5, o, 0);
        var T = samp(pf, mx, my, HD, x, y) * (1 + clamp(.12 * hh, -.05, .05));
        var r = Math.exp(-o[0] * T), g = Math.exp(-o[1] * T), b = Math.exp(-o[2] * T);
        if (rip) {
          var cau = 1 + clamp(-lp * .5, -.06, .08); r *= cau; g *= cau; b *= cau;
          var nxn = -gx * 2.6, nyn = -gy * 2.6, dot = (nxn * Hx + nyn * Hy + Hz) / Math.sqrt(nxn * nxn + nyn * nyn + 1);
          if (dot > .985) { var sp = Math.pow((dot - .985) / .015, 8) * .12; r += r * sp; g += g * sp; b += b * sp; }
        }
        var q = (py * cw + px) * 4; d[q] = r * 255; d[q + 1] = g * 255; d[q + 2] = b * 255; d[q + 3] = 255;
      }
    }
    this.ctx.putImageData(img, 0, 0);
  };

  root.querySelectorAll('[data-fs-fluid]').forEach(function(el){
    if(!el.__fsFluid) el.__fsFluid = new Fluid(el,{variant:el.getAttribute('data-fs-fluid') || 'flood'});
  });
  return function(){
    disposed = true;
    disposers.forEach(function(dispose){dispose();});
    observers.forEach(function(observer){observer.disconnect();});
    instances.forEach(function(fx){cancelAnimationFrame(fx.raf);fx.ro.disconnect();if(fx.io)fx.io.disconnect();fx.cv.remove();delete fx.el.__fsFluid;});
    restorations.reverse().forEach(function(restore){restore();});
  };
}
