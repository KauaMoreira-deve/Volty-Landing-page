(function () {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
    const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t) };
    const fmt = n => Math.round(n).toLocaleString('pt-BR');
    const scenes = $$('.scene'); const S = scenes.length;

    /* ---------------- rail + counter ---------------- */
    const rail = $('#rail');
    scenes.forEach((s, i) => { const li = document.createElement('li'); li.innerHTML = `<button type="button" data-i="${i}" aria-current="${i === 0}"><span>${String(i).padStart(2, '0')} ${s.dataset.name}</span></button>`; rail.appendChild(li) });
    // smooth wheel scroll with inertia; driven from the frame loop below
    const lenis = !reduce && window.Lenis ? new Lenis({ lerp: .085, wheelMultiplier: .9, smoothWheel: true }) : null;
    const go = i => { i = clamp(i, 0, S - 1); const y = scenes[i].offsetTop + (i ? innerHeight * .05 : 0); if (lenis) lenis.scrollTo(y, { duration: 1.6 }); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }) };
    rail.addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(+b.dataset.i) });
    $$('a[href^="#c"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(+a.getAttribute('href').slice(2)) }));

    /* ---------------- text scramble ---------------- */
    const G = 'VOLTY/<>01+';
    function scramble(el) {
        if (reduce || el.dataset.d) return; el.dataset.d = 1; const o = el.textContent, L = o.length, t0 = performance.now();
        (function f(n) { const p = Math.min(1, (n - t0) / 1100); let s = ''; for (let i = 0; i < L; i++) { const c = o[i]; s += (i < p * L || c === ' ') ? c : G[Math.random() * G.length | 0] } el.textContent = s; if (p < 1) requestAnimationFrame(f); else el.textContent = o })(t0)
    }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { scramble(e.target); io.unobserve(e.target) } }), { threshold: .6 });
    $$('.scr').forEach(e => io.observe(e));

    /* ---------------- cursor ---------------- */
    let mx = 0, my = 0, px = innerWidth / 2, py = innerHeight / 2;
    addEventListener('pointermove', e => { mx = e.clientX / innerWidth * 2 - 1; my = -(e.clientY / innerHeight * 2 - 1); px = e.clientX; py = e.clientY });
    if (fine && !reduce) {
        const c = $('.cur'), d = $('.cur-dot'); let cx = px, cy = py;
        (function l() { cx += (px - cx) * .16; cy += (py - cy) * .16; c.style.transform = `translate(${cx}px,${cy}px)`; d.style.transform = `translate(${px}px,${py}px)`; requestAnimationFrame(l) })();
        document.addEventListener('pointerover', e => c.classList.toggle('big', !!e.target.closest('a,button,input')))
    }
    else { $('.cur').hidden = true; $('.cur-dot').hidden = true }

    /* ---------------- owl companion ---------------- */
    const owl = $('#owl'), owlImgs = [...owl.querySelectorAll('img')], bubble = $('#bubble'), bT = $('#bubbleT'), bK = $('#bubbleK');
    const tips = ['Oi! Eu fico de olho nos seus clientes. Role comigo pelo sistema.', 'Agenda todo mundo tem. A gente vende cliente de volta.', 'Cada ponto que acende é uma etapa que roda sozinha.', 'Tá vendo os pontos se afastando? Eu chamo eles de volta.', 'Se a Volty devolve milhares de reais, dá para cobrar mais.', 'Comece com 5 a 10 empresas usando de verdade.', 'Um parceiro pode trazer dezenas de negócios de uma vez.', 'Mexa no churn e veja quanta gente escapa da nuvem.', 'Primeiro prove que recupera clientes. Depois acelere.', 'Até a próxima visita!'];
    let owlView = 'frente', lastScroll = scrollY, idle = 0, cur = -1;
    const setOwl = v => { if (v === owlView) return; owlView = v; owlImgs.forEach(i => i.classList.toggle('on', i.dataset.v === v)) };
    owl.addEventListener('click', () => go(cur + 1 >= S ? 0 : cur + 1));
    let bt = 0; const say = () => { bubble.classList.remove('hide'); clearTimeout(bt); bt = setTimeout(() => bubble.classList.add('hide'), 5200) };
    owl.addEventListener('pointerenter', say); owl.addEventListener('focus', say);

    /* ---------------- particle targets ---------------- */
    const small = innerWidth < 760;
    const N = small ? 6000 : 11000;
    const DPR = Math.min(2, devicePixelRatio || 1);
    const BLUE = [.10, .49, 1], ION = [.37, .83, 1], WHITE = [.93, .95, 1], DIM = [.16, .22, .40], GHOST = [.32, .38, .56];
    const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647 })();
    const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) };
    const T = [], Cc = []; for (let s = 0; s < S; s++) { T.push(new Float32Array(N * 3)); Cc.push(new Float32Array(N * 3)) }
    const seed = new Float32Array(N), size = new Float32Array(N), stag = new Float32Array(N);
    for (let i = 0; i < N; i++) { seed[i] = rnd(); size[i] = .6 + Math.pow(rnd(), 3) * 2.6; stag[i] = rnd() }
    const put = (s, i, x, y, z, c, k = 1) => { T[s][i * 3] = x; T[s][i * 3 + 1] = y; T[s][i * 3 + 2] = z; Cc[s][i * 3] = c[0] * k; Cc[s][i * 3 + 1] = c[1] * k; Cc[s][i * 3 + 2] = c[2] * k };
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const rotX = (x, y, z, a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
    const ox = small ? 0 : 2.2; // shift scenes to the right of the text column

    // 0 · sphere placeholder, replaced by the Volty mark once the image loads
    for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963, R = 3; put(0, i, ox + Math.cos(th) * r * R, y * R, Math.sin(th) * r * R, mix(BLUE, ION, rnd()), .9) }
    function buildLogo(img) {
        const w = 220, h = Math.round(img.height * w / img.width); const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
        let d; try { d = x.getImageData(0, 0, w, h).data } catch (e) { return } const pts = []; for (let yy = 0; yy < h; yy++)for (let xx = 0; xx < w; xx++) { const k = (yy * w + xx) * 4; if (d[k + 3] > 110) pts.push([xx, yy, d[k] / 255, d[k + 1] / 255, d[k + 2] / 255]) }
        if (pts.length < 50) return; const sc = (small ? 5 : 6.4) / w; paintDirty = true;
        for (let i = 0; i < N; i++) { const p = pts[(rnd() * pts.length) | 0]; put(0, i, ox + (small ? 0 : .9) + (p[0] - w / 2) * sc + (rnd() - .5) * sc, -(p[1] - h / 2) * sc + (rnd() - .5) * sc + (small ? 1.2 : .2), gauss() * .12, [Math.max(p[2], .05), Math.max(p[3], .25), Math.max(p[4], .7)], 1.15) }
    }
    // 1 · calendar grid, a few busy days, some cells drifting off
    (function () {
        const cols = 7, rows = 5, cs = .9, g = .14, W = cols * cs + (cols - 1) * g, H = rows * cs + (rows - 1) * g; const busy = new Set([2, 8, 9, 15, 19, 23, 26, 31]);
        for (let i = 0; i < N; i++) {
            const cell = (rnd() * cols * rows) | 0, cx = cell % cols, cy = (cell / cols) | 0; const x0 = -W / 2 + cx * (cs + g), y0 = H / 2 - cy * (cs + g); let x, y; const b = busy.has(cell);
            if (b && rnd() < .6) { x = x0 + rnd() * cs; y = y0 - rnd() * cs } else { const e = rnd() * 4, t = rnd() * cs; if (e < 1) { x = x0 + t; y = y0 } else if (e < 2) { x = x0 + t; y = y0 - cs } else if (e < 3) { x = x0; y = y0 - t } else { x = x0 + cs; y = y0 - t } }
            const drift = rnd() < .12; const [X, Y, Z] = rotX(x + (drift ? gauss() * .7 : 0), y, drift ? gauss() * 1.6 : gauss() * .03, -.55); put(1, i, ox + X, Y, Z, b ? mix(BLUE, ION, rnd()) : (drift ? DIM : GHOST), b ? 1 : .8)
        }
    })();
    // 2 · orbit with 9 nodes
    const ringR = 3.2, ringNodes = []; for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 - Math.PI / 2; ringNodes.push([ox + Math.cos(a) * ringR, 0, Math.sin(a) * ringR]) }
    const nodeOf = new Int8Array(N).fill(-1);
    for (let i = 0; i < N; i++) {
        if (rnd() < .42) { const k = (rnd() * 9) | 0; nodeOf[i] = k; const n = ringNodes[k]; put(2, i, n[0] + gauss() * .16, n[1] + gauss() * .16, n[2] + gauss() * .16, BLUE, .8) }
        else { const a = rnd() * Math.PI * 2, r = ringR + gauss() * .07; put(2, i, ox + Math.cos(a) * r, gauss() * .05, Math.sin(a) * r, GHOST, .55) }
    }
    let paintDirty = true;
    function paintNodes(active) { paintDirty = true; for (let i = 0; i < N; i++) { const k = nodeOf[i]; if (k < 0) continue; const c = k === active ? WHITE : (k < active ? ION : BLUE), m = k === active ? 1.3 : (k < active ? .95 : .5); Cc[2][i * 3] = c[0] * m; Cc[2][i * 3 + 1] = c[1] * m; Cc[2][i * 3 + 2] = c[2] * m } }
    paintNodes(0);
    // 3 · client cloud; 32.7% drifted away, 9.5% of those come back (327 → 31)
    const lost = new Uint8Array(N), home = new Float32Array(N * 3), away = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
        const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), r = 2 * Math.cbrt(rnd()); const x = r * Math.sin(ph) * Math.cos(th), y = r * Math.sin(ph) * Math.sin(th), z = r * Math.cos(ph);
        home[i * 3] = ox + x; home[i * 3 + 1] = y; home[i * 3 + 2] = z; const isL = rnd() < .327; if (isL) { lost[i] = rnd() < .095 ? 2 : 1; const d = Math.hypot(x, y, z) || 1, R = 4.4 + rnd() * 5; away[i * 3] = ox + x / d * R; away[i * 3 + 1] = y / d * R * .7; away[i * 3 + 2] = z / d * R }
        put(3, i, isL ? away[i * 3] : home[i * 3], isL ? away[i * 3 + 1] : y, isL ? away[i * 3 + 2] : z, isL ? DIM : mix(BLUE, ION, rnd()), isL ? .8 : .85)
    }
    // 4 · MRR columns, heights to scale
    const mrr = [[100, 99, 9900], [500, 99, 49500], [1000, 120, 120000], [5000, 120, 600000]]; const barX = [-3, -1, 1, 3].map(v => v + ox), base = -2.6, maxH = 5.4;
    (function () {
        const hs = mrr.map(m => m[2] / 600000 * maxH); for (let i = 0; i < N; i++) {
            const r = rnd(); if (r < .2) { put(4, i, ox + (rnd() - .5) * 9, base, (rnd() - .5) * 4, GHOST, .3); continue }
            const k = r < .25 ? 0 : r < .33 ? 1 : r < .47 ? 2 : 3; const h = Math.max(hs[k], .05); const x = barX[k] + (rnd() - .5) * .9, y = base + rnd() * h, z = (rnd() - .5) * .9; const top = y > base + h - .07; put(4, i, x, y, z, top ? WHITE : mix(BLUE, ION, (y - base) / maxH), top ? 1.15 : .85)
        }
    })();
    // 5 · scale rings
    const ringRad = [1, 2, 3.1, 4.3]; const ringOf = new Int8Array(N);
    for (let i = 0; i < N; i++) { const r = rnd(); const k = r < .08 ? 0 : r < .24 ? 1 : r < .55 ? 2 : 3; ringOf[i] = k; const a = rnd() * Math.PI * 2, R = ringRad[k] + gauss() * .05 * (k + 1); const [X, Y, Z] = rotX(Math.cos(a) * R, Math.sin(a) * R, gauss() * .05, 1.5708); put(5, i, ox + X, Y, Z, BLUE, .6) }
    function paintRings(active) { paintDirty = true; for (let i = 0; i < N; i++) { const k = ringOf[i], c = k === active ? WHITE : (k < active ? ION : BLUE), m = k === active ? 1.25 : (k < active ? .7 : .42); Cc[5][i * 3] = c[0] * m; Cc[5][i * 3 + 1] = c[1] * m; Cc[5][i * 3 + 2] = c[2] * m } }
    // 6 · Volty core + four channel satellites on an orbit
    const sats = []; for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + .4; const [x, y, z] = rotX(Math.cos(a) * 3.5, Math.sin(a) * 3.5, 0, 1.0); sats.push([ox + x, y, z]) }
    for (let i = 0; i < N; i++) {
        const r = rnd(); if (r < .34) { const th = rnd() * 6.283, ph = Math.acos(2 * rnd() - 1), R = 1.1 * Math.cbrt(rnd()); put(6, i, ox + R * Math.sin(ph) * Math.cos(th), R * Math.sin(ph) * Math.sin(th), R * Math.cos(ph), mix(BLUE, ION, rnd()), 1) }
        else if (r < .62) { const s = sats[(rnd() * 4) | 0]; put(6, i, s[0] + gauss() * .2, s[1] + gauss() * .2, s[2] + gauss() * .2, WHITE, .85) }
        else { const a = rnd() * 6.283, R = 3.5 + gauss() * .04; const [x, y, z] = rotX(Math.cos(a) * R, Math.sin(a) * R, gauss() * .03, 1.0); put(6, i, ox + x, y, z, GHOST, .4) }
    }
    // 7 · churn: two clouds; part of each streams away
    const side = new Int8Array(N), dir = new Float32Array(N * 3), rank = new Float32Array(N), cL = [ox - 2.3, -.3, 0], cR = [ox + 2.3, -.3, 0];
    for (let i = 0; i < N; i++) {
        const isL = rnd() < .5; side[i] = isL ? -1 : 1; const c = isL ? cL : cR; const th = rnd() * 6.283, ph = Math.acos(2 * rnd() - 1); const dx = Math.sin(ph) * Math.cos(th), dy = Math.sin(ph) * Math.sin(th), dz = Math.cos(ph); dir[i * 3] = dx; dir[i * 3 + 1] = dy; dir[i * 3 + 2] = dz; rank[i] = rnd();
        const R = 1.3 * Math.cbrt(seed[i]); put(7, i, c[0] + dx * R, c[1] + dy * R, c[2] + dz * R, mix(BLUE, ION, seed[i]), .85)
    }
    // 8 · road through four milestones, widening as it grows
    const road = []; for (let k = 0; k < 4; k++)road.push([ox - 3.4 + k * 2.3, -2.1 + k * 1.4, -k * .6]);
    for (let i = 0; i < N; i++) {
        const t = Math.pow(rnd(), .8); const seg = Math.min(2.999, t * 3), k = seg | 0, f = seg - k; const a = road[k], b = road[k + 1]; const sp = .07 + t * t * 1;
        put(8, i, a[0] + (b[0] - a[0]) * f + gauss() * sp, a[1] + (b[1] - a[1]) * f + gauss() * sp * .6, a[2] + (b[2] - a[2]) * f + gauss() * sp, mix(BLUE, t > .85 ? WHITE : ION, t), .6 + t * .5)
    }
    // 9 · spiral galaxy
    for (let i = 0; i < N; i++) { const arm = i % 2, r = Math.pow(rnd(), .6) * 5.2, a = r * 1.05 + arm * Math.PI + gauss() * .28; put(9, i, Math.cos(a) * r, gauss() * .12 * (1 + r * .1), Math.sin(a) * r, mix(WHITE, BLUE, r / 5.2), 1.15 - r * .09) }

    // camera keyframes [position, look-at]
    const cam = [[[0, 0, 11], [0, .2, 0]], [[0, -2.5, 10], [0, 0, 0]], [[0, 6.5, 8], [0, 0, 0]], [[1.5, 1.2, 10.5], [0, 0, 0]], [[-.5, .8, 11], [0, .2, 0]], [[0, 6.5, 8.5], [0, 0, 0]], [[-2, 3.5, 9.5], [0, 0, 0]], [[0, 1, 10.5], [0, .4, 0]], [[1, 1.5, 10.5], [0, 0, 0]], [[0, 7.5, 8.5], [0, -.6, 0]]];

    /* ---------------- WebGL ---------------- */
    const canvas = $('#gl'); let renderer = null;
    try { if (window.THREE) renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }) } catch (e) { renderer = null }
    let points, pivot, stars, scene3, camera, geo, mat, v3, camPos, camLook, lookCur;
    const labels = [];
    if (renderer) {
        renderer.setPixelRatio(DPR); scene3 = new THREE.Scene(); camera = new THREE.PerspectiveCamera(45, 1, .1, 200); camera.position.set(0, 0, 11);
        v3 = new THREE.Vector3(); camPos = new THREE.Vector3(0, 0, 11); camLook = new THREE.Vector3(); lookCur = new THREE.Vector3(0, .2, 0);
        geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(T[0]), 3)); geo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(Cc[0]), 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
        const vs = `attribute vec3 aColor;attribute float aSize;attribute float aSeed;uniform float uTime,uPix,uAspect,uMove;uniform vec2 uMouse;varying vec3 vC;varying float vA;
    void main(){vec3 p=position;float t=uTime*.6+aSeed*40.;p+=vec3(sin(t),cos(t*.8),sin(t*.7))*.035;
      vec4 mv=modelViewMatrix*vec4(p,1.);vec4 cl=projectionMatrix*mv;vec2 ndc=cl.xy/cl.w;vec2 d=ndc-uMouse;d.x*=uAspect;float r=length(d);float f=smoothstep(.28,0.,r);
      vec2 push=normalize(d+1e-4)*f*.09;push.x/=uAspect;ndc+=push;cl.xy=ndc*cl.w;gl_Position=cl;
      gl_PointSize=aSize*uPix*(17./-mv.z)*(1.+uMove*.6);vC=aColor;vA=1.+f*1.4;}`;
        const fs = `varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);a=a*a*.6+a*.4;gl_FragColor=vec4(vC*vA*1.25,a);}`;
        const mk = () => new THREE.ShaderMaterial({
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: vs, fragmentShader: fs,
            uniforms: { uTime: { value: 0 }, uPix: { value: DPR }, uMouse: { value: new THREE.Vector2(9, 9) }, uAspect: { value: 1 }, uMove: { value: 0 } }
        });
        mat = mk(); points = new THREE.Points(geo, mat); pivot = new THREE.Group(); pivot.position.x = ox; points.position.x = -ox; pivot.add(points); scene3.add(pivot);
        const SN = small ? 700 : 1500, sp = new Float32Array(SN * 3), sc = new Float32Array(SN * 3), ss = new Float32Array(SN), sd = new Float32Array(SN);
        for (let i = 0; i < SN; i++) { const th = rnd() * 6.283, ph = Math.acos(2 * rnd() - 1), R = 30 + rnd() * 50; sp[i * 3] = R * Math.sin(ph) * Math.cos(th); sp[i * 3 + 1] = R * Math.sin(ph) * Math.sin(th); sp[i * 3 + 2] = R * Math.cos(ph); const c = rnd() < .2 ? ION : WHITE; sc[i * 3] = c[0] * .6; sc[i * 3 + 1] = c[1] * .6; sc[i * 3 + 2] = c[2] * .6; ss[i] = .8 + rnd() * 1.6; sd[i] = rnd() }
        const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('aColor', new THREE.BufferAttribute(sc, 3)); sg.setAttribute('aSize', new THREE.BufferAttribute(ss, 1)); sg.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
        stars = new THREE.Points(sg, mk()); scene3.add(stars);
        const img = new Image(); img.onload = () => buildLogo(img); img.src = 'assets/logo_mark.webp';
        // 3D labels
        const labelsEl = $('#labels');
        const L = (scene, p, html, cls = '') => { const e = document.createElement('div'); e.className = 'lbl ' + cls; e.innerHTML = html; labelsEl.appendChild(e); labels.push({ scene, p: new THREE.Vector3(p[0], p[1], p[2]), e }); return e };
        ['Agenda', 'Comparece', 'CRM', 'Histórico', 'Tempo sem retorno', 'Inatividade', 'Mensagem', 'Reagenda', 'Painel'].forEach((t, k) => { L(2, [ringNodes[k][0], .45, ringNodes[k][2]], t).dataset.node = k });
        mrr.forEach((m, k) => L(4, [barX[k] - .45, base + Math.max(m[2] / 600000 * maxH, .05) + .35, 0], `R$ ${fmt(m[2])}<em>${fmt(m[0])} × R$ ${m[1]}</em>`, 'big'));
        ['0–50', '50–200', '200–1.000', '1.000+'].forEach((t, k) => { const [x, y, z] = rotX(ringRad[k] * .707, ringRad[k] * .707, 0, 1.5708); L(5, [ox + x, y, z], t) });
        ['Prospecção direta', 'Parcerias', 'Indicação', 'Conteúdo e anúncios'].forEach((t, k) => L(6, [sats[k][0], sats[k][1] + .5, sats[k][2]], t)); L(6, [ox, 1.45, 0], 'Volty', 'big');
        L(7, [cL[0] - .5, cL[1] + 1.8, 0], 'Churn <em class="lc">10%</em>'); L(7, [cR[0] - .5, cR[1] + 1.8, 0], 'Churn <em>2%</em>');
        ['Serviço', 'Validação', 'Recorrência', 'Escala'].forEach((t, k) => L(8, [road[k][0], road[k][1] + .6, road[k][2]], t, 'big'));
        L(3, [ox, 2.4, 0], 'Clientes ativos'); L(3, [ox + 3.4, 3.3, 0], 'Sem voltar há 60+ dias <em>327</em>');
    }

    function resize() { if (!renderer) return; const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); mat.uniforms.uAspect.value = w / h; stars.material.uniforms.uAspect.value = w / h }
    addEventListener('resize', resize); resize();

    /* ---------------- chapter interactions ---------------- */
    const phaseText = [
        ['0 a 50 clientes', 'Prospectar manualmente e fazer demonstrações. Colocar 5 a 10 empresas para usar de verdade. Observar por que compram, o que usam e por que cancelam. Evitar recursos específicos para um cliente só.'],
        ['50 a 200 clientes', 'Onboarding self-service. Landing page clara com demonstração e teste grátis. Integrações, suporte e cobrança padronizados. Estudos de caso com resultado mensurável.'],
        ['200 a 1.000 clientes', 'Programa de indicação. Parcerias com gestores de tráfego, agências e consultores do nicho. Conteúdo e anúncios voltados a dores específicas. Equipe de suporte. Medição rigorosa de CAC, churn, LTV e payback.'],
        ['1.000+ clientes', 'Canais previsíveis de aquisição. Onboarding e cobrança automatizados. Infraestrutura para volume. Monitorar entregabilidade das mensagens e custo de API. Times de produto, suporte, vendas e sucesso do cliente.']];
    let phase = -1, phaseLocked = false;
    function setPhase(i) { if (i === phase) return; phase = i; $$('.phase').forEach(b => b.setAttribute('aria-pressed', +b.dataset.i === i)); $('#phaseDetail').innerHTML = `<span class="mono" style="color:var(--ion)">${phaseText[i][0]}</span><p>${phaseText[i][1]}</p>`; paintRings(i) }
    $$('.phase').forEach(b => { const f = () => { phaseLocked = true; setPhase(+b.dataset.i) }; b.addEventListener('click', f); b.addEventListener('pointerenter', f) });
    setPhase(0);
    let churn = 10; const churnIn = $('#churn');
    function setChurn() { churn = +churnIn.value; $('#churnOut').textContent = churn + '%'; $('#churnN').textContent = fmt(1000 * churn / 100); $$('.lc').forEach(e => e.textContent = churn + '%') }
    churnIn.addEventListener('input', setChurn); setChurn();
    const stepsLi = $$('#steps li'); let activeNode = -1;

    function dyn(sc, q, time) {
        if (sc === 3) {
            const ret = sstep(.1, .85, q);
            for (let i = 0; i < N; i++) {
                if (!lost[i]) continue; const k = i * 3;
                if (lost[i] === 2) { T[3][k] = away[k] + (home[k] - away[k]) * ret; T[3][k + 1] = away[k + 1] + (home[k + 1] - away[k + 1]) * ret; T[3][k + 2] = away[k + 2] + (home[k + 2] - away[k + 2]) * ret; const c = mix(DIM, WHITE, ret); Cc[3][k] = c[0] * 1.4; Cc[3][k + 1] = c[1] * 1.4; Cc[3][k + 2] = c[2] * 1.4 }
                else { const w = 1 + Math.sin(time * .25 + seed[i] * 9) * .05; T[3][k] = ox + (away[k] - ox) * w; T[3][k + 1] = away[k + 1] * w; T[3][k + 2] = away[k + 2] * w }
            }
            return Math.round(31 * ret)
        }
        if (sc === 7) {
            const rl = churn / 100 * 2.5, rr = .05;
            for (let i = 0; i < N; i++) {
                const k = i * 3, isL = side[i] < 0, c = isL ? cL : cR, R0 = 1.3 * Math.cbrt(seed[i]);
                if (rank[i] < (isL ? rl : rr)) { const ph = (time * .08 + seed[i] * 3) % 1; const R = R0 + ph * 6; T[7][k] = c[0] + dir[k] * R + (isL ? -1 : 1) * ph * 2.2; T[7][k + 1] = c[1] + dir[k + 1] * R * .6 + ph * 1.8; T[7][k + 2] = c[2] + dir[k + 2] * R; const f = (1 - ph) * 1.2; Cc[7][k] = WHITE[0] * f; Cc[7][k + 1] = WHITE[1] * f; Cc[7][k + 2] = WHITE[2] * f }
                else { T[7][k] = c[0] + dir[k] * R0; T[7][k + 1] = c[1] + dir[k + 1] * R0; T[7][k + 2] = c[2] + dir[k + 2] * R0; const cc = mix(BLUE, ION, seed[i]); Cc[7][k] = cc[0] * .85; Cc[7][k + 1] = cc[1] * .85; Cc[7][k + 2] = cc[2] * .85 }
            }
        }
    }

    /* ---------------- frame loop ---------------- */
    let tPrev = performance.now(), time = 0, vel = 0;
    // layout is measured once here, never inside the frame loop (reading it there forced a reflow every frame)
    let tops = [], hts = [], maxScroll = 0;
    function measure() { tops = scenes.map(s => s.offsetTop); hts = scenes.map(s => s.offsetHeight); maxScroll = document.documentElement.scrollHeight - innerHeight }
    measure(); addEventListener('resize', measure); addEventListener('load', measure); if (document.fonts) document.fonts.ready.then(measure);
    if (window.ResizeObserver) new ResizeObserver(measure).observe(document.body);
    // continuous journey position (scene index + progress), eased toward the scroll so formations glide instead of stepping
    let gS = -1;
    function sceneState(dt) {
        const c = scrollY + innerHeight * .5; let i = 0; for (let k = 0; k < S; k++)if (tops[k] <= c) i = k;
        const g = i + clamp((c - tops[i]) / hts[i]);
        gS = gS < 0 || reduce ? g : gS + (g - gS) * (1 - Math.exp(-dt * 7)); if (Math.abs(g - gS) < 1e-4) gS = g;
        const a = Math.min(S - 1, Math.floor(gS)), p = clamp(gS - a); return { i: a, p, m: a < S - 1 ? sstep(.66, 1, p) : 0, q: clamp(p / .66) }
    }
    const bar = $('.counter i'); let lastA = -1, lastM = -1;
    const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    function frame(now) {
        if (lenis) lenis.raf(now);
        const dt = Math.min(.05, (now - tPrev) / 1000); tPrev = now; if (!reduce) time += dt;
        const st = sceneState(dt), a = st.i, b = Math.min(S - 1, a + 1), m = st.m;
        if (a !== cur) { cur = a; bT.textContent = tips[a]; bK.textContent = String(a).padStart(2, '0') + ' · ' + scenes[a].dataset.name; $('#cNum').textContent = String(a).padStart(2, '0'); $('#cName').textContent = scenes[a].dataset.name; $$('#rail button').forEach((x, k) => x.setAttribute('aria-current', k === a)); if (scrollY > innerHeight * .5 && !small) say() }
        bar.style.setProperty('--p', (maxScroll > 0 ? clamp(scrollY / maxScroll) : 0).toFixed(4));
        if (a === 2) { const k = Math.min(8, Math.floor(st.q * 9.4)); if (k !== activeNode) { activeNode = k; stepsLi.forEach((li, j) => li.classList.toggle('on', j <= k)); paintNodes(k) } }
        else if (a < 2 && activeNode !== -1) { activeNode = -1; stepsLi.forEach(li => li.classList.remove('on')); paintNodes(0) }
        if (a === 5 && !phaseLocked) setPhase(Math.min(3, Math.floor(st.q * 4)));
        if (a !== 5) phaseLocked = false;
        // owl reacts to scroll direction and pointer side
        const dy = scrollY - lastScroll; lastScroll = scrollY; vel += (Math.abs(dy) - vel) * .15;
        if (Math.abs(dy) > 4) { setOwl(dy > 0 ? 'costas' : 'frente'); idle = 0 } else if ((idle += dt) > .4) setOwl(px < innerWidth * .33 ? 'esquerda' : px > innerWidth * .75 ? 'direita' : 'frente');
        const intro = sstep(0, 1, clamp(scrollY / (innerHeight * .9))); const big = small ? 1.2 : 1.7;
        owl.style.transform = `scale(${(big + (1 - big) * intro).toFixed(3)})`;
        bubble.style.opacity = intro < .95 ? 0 : '';
        if (renderer) {
            const live = a === 3 || b === 3 || a === 7 || b === 7;
            if (a === 3 || b === 3) { const n = dyn(3, a === 3 ? st.q : 0, time); $('#back').textContent = a === 3 ? n : (a < 3 ? 0 : 31) }
            if (a === 7 || b === 7) dyn(7, st.q, time);
            // skip the per-particle pass (and the GPU upload) while the formation is at rest
            const still = !live && !paintDirty && a === lastA && m === lastM; lastA = a; lastM = m; paintDirty = false;
            const P = geo.attributes.position.array, C = geo.attributes.aColor.array, A = T[a], B = T[b], CA = Cc[a], CB = Cc[b]; const burst = m > 0 && m < 1 ? Math.sin(m * Math.PI) * .9 : 0;
            if (!still) for (let i = 0; i < N; i++) {
                const e0 = m <= 0 ? 0 : m >= 1 ? 1 : clamp(m * 1.6 - stag[i] * .6), e = e0 * e0 * (3 - 2 * e0), k = i * 3;
                P[k] = A[k] + (B[k] - A[k]) * e; P[k + 1] = A[k + 1] + (B[k + 1] - A[k + 1]) * e; P[k + 2] = A[k + 2] + (B[k + 2] - A[k + 2]) * e;
                C[k] = CA[k] + (CB[k] - CA[k]) * e; C[k + 1] = CA[k + 1] + (CB[k + 1] - CA[k + 1]) * e; C[k + 2] = CA[k + 2] + (CB[k + 2] - CA[k + 2]) * e;
                if (burst) { P[k] += Math.sin(seed[i] * 91) * burst * (.5 + stag[i]); P[k + 1] += Math.cos(seed[i] * 57) * burst * .6; P[k + 2] += Math.sin(seed[i] * 33) * burst * (1 + stag[i]) }
            }
            if (!still) { geo.attributes.position.needsUpdate = true; geo.attributes.aColor.needsUpdate = true }
            const t = sstep(0, 1, m), cp = lerp3(cam[a][0], cam[b][0], t), cl = lerp3(cam[a][1], cam[b][1], t); const sw = reduce ? 0 : 1;
            camPos.set(cp[0] + mx * .6 * sw + Math.sin(time * .13) * .3 * sw, cp[1] + my * .4 * sw, cp[2] - (a === 0 ? st.p * 1.2 : 0)); camLook.set(cl[0], cl[1], cl[2]);
            const kc = 1 - Math.exp(-dt * 5); camera.position.lerp(camPos, kc); lookCur.lerp(camLook, kc); camera.lookAt(lookCur);
            const spin = (a === 2 || a === 5) && !reduce; pivot.rotation.y = spin ? pivot.rotation.y + dt * .05 : pivot.rotation.y * .94;
            scene3.updateMatrixWorld();
            stars.rotation.y = time * .006;
            mat.uniforms.uTime.value = time; mat.uniforms.uMove.value = Math.min(1, vel / 40); stars.material.uniforms.uTime.value = time;
            mat.uniforms.uMouse.value.set(fine ? mx : 9, fine ? my : 9);
            renderer.render(scene3, camera);
            for (const l of labels) {
                const w = l.scene === a ? 1 - m : l.scene === b ? m : 0; if (w < .02) { if (l.e.style.opacity !== '0') l.e.style.opacity = '0'; continue }
                v3.copy(l.p).applyMatrix4(points.matrixWorld).project(camera); const x = (v3.x * .5 + .5) * innerWidth, y = (-v3.y * .5 + .5) * innerHeight;
                let o = sstep(.3, 1, w); if (l.e.dataset.node !== undefined) o *= +l.e.dataset.node <= activeNode ? 1 : .3; if (v3.z > 1) o = 0; l.e.style.opacity = o.toFixed(2); l.e.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`
            }
        }
        requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame);
})();