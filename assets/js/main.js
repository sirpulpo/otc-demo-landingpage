/* =========================================================
   OTC Integrated Logistics Solutions — main.js
   Vanilla JS, no dependencies. Respects prefers-reduced-motion.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-nav-primary]");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      document.body.style.overflow = !open ? "hidden" : "";
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Header scroll state ---------- */
  function initHeaderScroll() {
    var header = document.querySelector("[data-site-header]");
    var toTop = document.querySelector("[data-to-top]");
    if (!header) return;
    function onScroll() {
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 30);
      if (toTop) toTop.classList.toggle("is-visible", y > 700);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      });
    }
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 0.08 + "s";
      io.observe(el);
    });
  }

  /* ---------- Animated counters ---------- */
  function initCounters() {
    var counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;
    function animate(el) {
      var target = parseFloat(el.getAttribute("data-counter"));
      var decimals = (el.getAttribute("data-counter").split(".")[1] || "").length;
      if (reduceMotion) {
        el.textContent = target.toFixed(decimals);
        return;
      }
      var start = null;
      var duration = 1600;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var val = target * eased;
        el.textContent = val.toFixed(decimals);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(decimals);
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animate);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hero rotator ---------- */
  function initRotator() {
    var el = document.querySelector("[data-rotator]");
    if (!el) return;
    var words = JSON.parse(el.getAttribute("data-words") || "[]");
    if (!words.length) return;
    var i = 0;
    el.textContent = words[0];
    if (reduceMotion) return;
    setInterval(function () {
      i = (i + 1) % words.length;
      el.style.opacity = "0";
      setTimeout(function () {
        el.textContent = words[i];
        el.style.opacity = "1";
      }, 250);
    }, 2600);
    el.style.transition = "opacity .25s ease";
  }

  /* ---------- Card spotlight + border angle ---------- */
  function initCardSpotlight() {
    var cards = document.querySelectorAll(".card");
    cards.forEach(function (card) {
      var spot = card.querySelector(".spot");
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        if (spot) {
          spot.style.setProperty("--x", x + "px");
          spot.style.setProperty("--y", y + "px");
        }
      });
    });
  }

  /* ---------- Timeline scroll progress ---------- */
  function initTimeline() {
    var track = document.querySelector("[data-timeline-track]");
    var progress = document.querySelector("[data-timeline-progress]");
    var items = document.querySelectorAll(".timeline-item");
    if (!track || !items.length) return;
    function update() {
      var rect = track.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = rect.height;
      var visibleStart = vh * 0.75;
      var raw = (visibleStart - rect.top) / total;
      var pct = Math.max(0, Math.min(1, raw));
      if (progress) progress.style.height = pct * 100 + "%";
      var activeIndex = Math.floor(pct * items.length);
      items.forEach(function (item, i) {
        item.classList.toggle("is-active", i <= activeIndex - 1 || (pct >= 0.98 && i === items.length - 1));
      });
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ---------- Hero globe canvas ---------- */
  function initGlobe() {
    var canvas = document.querySelector("[data-globe]");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var GOLD = "184,145,90";
    var DEG = Math.PI / 180;
    var TILT = 0.4; // axial tilt (rad), north pole toward viewer
    var cosT = Math.cos(TILT), sinT = Math.sin(TILT);
    var w, h, r, cx, cy;
    var land = [];            // unit vectors of land dots
    var px, py, pz;           // per-frame projected land dots
    var hubs = [];
    var rotation = 1.4;       // start facing the Americas (center lon = -rotation)
    var running = true;
    var looping = false;

    /* OTC logo as an orbiting "satellite" that tracks the routes */
    // x/y/z: per-frame screen position + depth (z>0 = in front of globe)
    var sats = [
      { scale: 1.25, inc: 0.38, roll: -0.35, angle: 0.7, speed: 0.0055, x: 0, y: 0, z: 1 },
      { scale: 1.4, inc: -0.55, roll: 0.6, angle: 3.8, speed: -0.0042, x: 0, y: 0, z: 1 }
    ];
    var satImg = new Image();
    var satSrc = canvas.getAttribute("data-globe-logo");
    if (satSrc) satImg.src = satSrc;

    /* 144x72 land/sea mask (2.5 deg cells, row 0 = 90N, col 0 = 180W), 4 cells per hex digit */
    var LAND = [
      "000000000000000000000000000000000000", "000000000000000000000000000000000000",
      "000000000000000000000000000000000000", "000000000ff9ffffe0000000000000000000",
      "000000133fcfffff000700000000c0000000", "00000129900fffff00000000e001f8000000",
      "000003c034003fff00000006007ff8008000", "8040017c6fe01ffe000000061dfffff7f800",
      "07ffffd43b381ff80001fe05ebffffffffff", "f3fffffffc3e1fc04007fd3fffffffffffff",
      "00fffffff51c1f00800f7ffffffffffffffe", "03ffffffc0600e00003e7ffffffffffffef8",
      "01e07fffe07a0000003e7fffffffffff8080", "00801ffff87e00000214fffffffffffe0380",
      "00000ffffeff80000d1fffffffffffff0300", "000007ffffffc00003ffffffffffffff0000",
      "000003fffff4e00003ffffffffffffff0000", "000003fffffc000001fff5f7fffffffe0000",
      "000003fffff0000001ebe0effffffffc4000", "000003ffffe000000f86f6f3fffffff08000",
      "000001ffffc000000f029ff3fffffe208000", "000001ffffc0000000f007ffffffff130000",
      "0000007fff80000007f003ffffffff040000", "0000005ffe0000000ffeebffffffff800000",
      "0000003fc10000000fffffefffffff800000", "0000000f810000003ffffdf3ffffff000000",
      "00000007800000003ffffdfe1ffffe800000", "00000003880000007ffffeff0fe7e0000000",
      "00000003d81800003ffffefe07c3d0000000", "00000000780000007fffff780781e0800000",
      "000000000e0000007fffffe00301f0c00000", "00000000002800003fffff90030160000000",
      "00000000017f00001ffffff0000100200000", "00000000007f80000fbffff0008080000000",
      "00000000007ff000000fffe0000186000000", "0000000000fff000000fffc00000ce000000",
      "0000000000fffc00000fff800000ce8c0000", "0000000000ffff80000fff0000004083c000",
      "0000000000ffffc00007ff0000002001e000", "0000000000ffffc00007ff00000001a08000",
      "00000000007fff800007ff00000000000000", "00000000007fff000007ff100000000c0000",
      "00000000001fff000007ff300000007e4000", "00000000000fff000007fc300000007fe000",
      "00000000000fff000007fc60000003fff000", "00000000000ffc000003fc60000007fff000",
      "00000000000ff8000003f800000007fff800", "00000000001ff0000001f800000003fff800",
      "00000000001ff0000001f000000003fff800", "00000000001fe0000001c000000003c3f800",
      "00000000001f80000000000000000000f000", "00000000001f000000000000000000002002",
      "00000000003c000000000000000000002004", "00000000001c000000000000000000000008",
      "000000000038000000000000000000000010", "000000000038000000000000000000000000",
      "000000000030800000000000000000000000", "000000000018000000000000000000000000",
      "000000000000000000000000000000000000", "000000000000000000000000000000000000",
      "000000000000000000000000000000000000", "000000000000800000000000000000000000",
      "000000000002000000000006000044000000", "00000000000400000000047ff1fffffff800",
      "00000000003e000005ffffffe7fffffffff0", "00000101ffbf00007fffffffffffffffffe0",
      "0003fffffff00003ffffffffffffffffff80", "013fffffff800e3fffffffffffffffffffe0",
      "003ffffffff8007fffffffffffffffffff00", "001ffffffffffffffffffffffffffffffff0",
      "000000000000000000000000000000000000", "000000000000000000000000000000000000"
    ];
    var MASK_W = 144, MASK_H = 72;

    function isLand(latDeg, lonDeg) {
      var row = Math.min(MASK_H - 1, Math.max(0, Math.floor((90 - latDeg) / 2.5)));
      var col = ((Math.floor((lonDeg + 180) / 2.5) % MASK_W) + MASK_W) % MASK_W;
      return (parseInt(LAND[row].charAt(col >> 2), 16) >> (3 - (col & 3))) & 1;
    }

    // lat/lon in radians -> unit vector
    function vec(lat, lon) {
      return { x: Math.cos(lat) * Math.sin(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.cos(lon) };
    }

    // Trade hubs [lat, lon] in degrees
    var HUB_COORDS = [
      [19.4, -99.1], [40.7, -74.0], [33.7, -118.3], [-23.5, -46.6], [51.9, 4.5],
      [31.2, 121.5], [22.5, 114.1], [1.3, 103.8], [25.2, 55.3], [-33.9, 18.4],
      [35.7, 139.7], [-33.9, 151.2], [6.5, 3.4], [30.0, 31.2]
    ];

    // Real ports / airports [lat, lon] for the highlighted route
    var ROUTE_SITES = [
      [19.05, -104.32], [19.2, -96.13], [19.44, -99.07], [33.75, -118.22],
      [40.64, -73.78], [-23.98, -46.3], [51.95, 4.14], [53.54, 9.97],
      [31.23, 121.47], [1.26, 103.82], [35.1, 129.04], [25.01, 55.06],
      [36.13, -5.44], [-33.95, 151.18]
    ];
    var routes = [];
    var ROUTE_HOLD = 0;       // frames between comet arrival and start of fade
    var MAX_LINKS = 4;        // max simultaneous telemetry links / comets
    var ROUTE_FADE = 0.12;   // soft fade length at the erasing edge (arc fraction)

    function newRoute(delay) {
      var a, b, A, B, dot;
      do {
        a = Math.floor(Math.random() * ROUTE_SITES.length);
        b = Math.floor(Math.random() * ROUTE_SITES.length);
        A = vec(ROUTE_SITES[a][0] * DEG, ROUTE_SITES[a][1] * DEG);
        B = vec(ROUTE_SITES[b][0] * DEG, ROUTE_SITES[b][1] * DEG);
        dot = Math.max(-1, Math.min(1, A.x * B.x + A.y * B.y + A.z * B.z));
      } while (a === b || Math.acos(dot) < 25 * DEG);
      return { A: A, B: B, omega: Math.acos(dot), life: -delay, enter: 90 + Math.random() * 60 };
    }

    function drawRoutes() {
      var now = performance.now();
      routes.forEach(function (rt, idx) {
        var head = 1, tail = 0;
        rt.hp = null;
        if (!reduceMotion) {
          rt.life++;
          if (rt.life < 0) return;
          head = Math.min(1, rt.life / rt.enter);
          tail = Math.max(0, (rt.life - rt.enter - ROUTE_HOLD) / rt.enter);
          if (tail >= 1) { routes[idx] = newRoute(Math.random() * 60); return; }
        }

        function strokeRange(a, b) {
          if (b <= a) return;
          strokeFacing(function (t) { return arcPoint(rt, a + (b - a) * t); }, Math.max(2, Math.ceil(64 * (b - a))));
        }

        ctx.save();
        ctx.strokeStyle = "rgba(" + GOLD + ",0.85)";
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        // soft edge where the route is being erased (tail), then the solid body
        var steps = tail > 0 ? 6 : 0, fadeEnd = Math.min(head, tail + ROUTE_FADE), i;
        for (i = 0; i < steps; i++) {
          ctx.globalAlpha = (i + 1) / (steps + 1);
          strokeRange(tail + (fadeEnd - tail) * (i / steps), tail + (fadeEnd - tail) * ((i + 1) / steps));
        }
        ctx.globalAlpha = 1;
        strokeRange(steps ? fadeEnd : tail, head);

        // comet head dot
        if (head < 1) {
          var hp = arcPoint(rt, head);
          if (hp.z > 0) {
            rt.hp = hp;
            ctx.fillStyle = "rgba(" + GOLD + ",0.25)";
            ctx.beginPath(); ctx.arc(hp.x, hp.y, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#B8915A";
            ctx.beginPath(); ctx.arc(hp.x, hp.y, 2.6, 0, Math.PI * 2); ctx.fill();
          }
        }

        [rt.A, rt.B].forEach(function (v, n) {
          var a = n === 0 ? 1 - Math.min(1, tail / 0.15)
                          : (head < 1 ? 0 : 1 - Math.min(1, Math.max(0, (tail - 0.85) / 0.15)));
          if (a <= 0) return;
          var p = project(v, 1);
          if (p.z <= 0.05) return;
          ctx.globalAlpha = a;
          if (!reduceMotion) {
            var k = (now % 1800) / 1800;
            ctx.beginPath();
            ctx.strokeStyle = "rgba(" + GOLD + "," + (0.6 * (1 - k)) + ")";
            ctx.lineWidth = 1.2;
            ctx.arc(p.x, p.y, 4 + 6 * k, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.fillStyle = "#B8915A";
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      });
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h / 2;
      r = Math.min(w, h) * 0.42;
      buildPoints();
    }

    function buildPoints() {
      // Fibonacci sphere, keep only points that fall on land
      var spacing = Math.max(5.5, r / 38);
      var n = Math.round((4 * Math.PI * r * r) / (spacing * spacing));
      var golden = Math.PI * (3 - Math.sqrt(5));
      land = [];
      for (var i = 0; i < n; i++) {
        var y = 1 - (2 * (i + 0.5)) / n;
        var lat = Math.asin(y);
        var lon = (((i * golden) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
        if (isLand(lat / DEG, lon / DEG)) land.push(vec(lat, lon));
      }
      px = new Float32Array(land.length);
      py = new Float32Array(land.length);
      pz = new Float32Array(land.length);

      hubs = HUB_COORDS.map(function (c) { return vec(c[0] * DEG, c[1] * DEG); });
    }

    // Spin around Y, tilt around X, scale to screen
    function project(v, scale) {
      var c = Math.cos(rotation), s = Math.sin(rotation);
      var x = v.x * c + v.z * s;
      var z = -v.x * s + v.z * c;
      return {
        x: cx + x * r * scale,
        y: cy - (v.y * cosT - z * sinT) * r * scale,
        z: v.y * sinT + z * cosT
      };
    }

    // Great-circle point (slerp) lifted off the surface
    function arcPoint(arc, t) {
      var so = Math.sin(arc.omega) || 1;
      var k1 = Math.sin((1 - t) * arc.omega) / so, k2 = Math.sin(t * arc.omega) / so;
      var lift = 1 + Math.sin(t * Math.PI) * 0.16 * Math.min(1, arc.omega);
      return project({
        x: arc.A.x * k1 + arc.B.x * k2,
        y: arc.A.y * k1 + arc.B.y * k2,
        z: arc.A.z * k1 + arc.B.z * k2
      }, lift);
    }

    // Stroke only the camera-facing part of a parametric curve
    function strokeFacing(fn, steps) {
      ctx.beginPath();
      var pen = false;
      for (var i = 0; i <= steps; i++) {
        var p = fn(i / steps);
        if (p.z < 0) { pen = false; continue; }
        if (pen) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); pen = true; }
      }
      ctx.stroke();
    }

    function drawGraticule() {
      ctx.strokeStyle = "rgba(" + GOLD + ",0.12)";
      ctx.lineWidth = 1;
      var d;
      for (d = -60; d <= 60; d += 30) {
        strokeFacing(function (t) { return project(vec(d * DEG, t * Math.PI * 2), 1); }, 72);
      }
      for (d = 0; d < 360; d += 30) {
        strokeFacing(function (t) { return project(vec((t - 0.5) * Math.PI, d * DEG), 1); }, 36);
      }
    }

    // Satellite position on a tilted orbit (view space: it does not spin with the globe)
    function updateSatellite(sat) {
      var ca = Math.cos(sat.angle), sa = Math.sin(sat.angle);
      var ox = ca, oy = sa * Math.sin(sat.inc), oz = sa * Math.cos(sat.inc);
      var cr = Math.cos(sat.roll), sr = Math.sin(sat.roll);
      var vx = ox * cr - oy * sr, vy = ox * sr + oy * cr;
      sat.x = cx + vx * r * sat.scale;
      sat.y = cy - vy * r * sat.scale;
      sat.z = oz;
    }

    function drawOrbit(sat, front) {
      ctx.save();
      ctx.strokeStyle = "rgba(" + GOLD + "," + (front ? 0.22 : 0.1) + ")";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      var cr = Math.cos(sat.roll), sr = Math.sin(sat.roll), pen = false, i, n = 90;
      ctx.beginPath();
      for (i = 0; i <= n; i++) {
        var a = (i / n) * Math.PI * 2, ox = Math.cos(a), oy = Math.sin(a) * Math.sin(sat.inc), oz = Math.sin(a) * Math.cos(sat.inc);
        if ((oz >= 0) !== front) { pen = false; continue; }
        var X = cx + (ox * cr - oy * sr) * r * sat.scale, Y = cy - (ox * sr + oy * cr) * r * sat.scale;
        if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; }
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawSatelliteBody(sat, front) {
      var size = Math.max(18, r * 0.15) * (front ? 1 : 0.8);
      var x = sat.x - size / 2, y = sat.y - size / 2, rad = size * 0.22;
      ctx.save();
      ctx.globalAlpha = front ? 1 : 0.35;
      var glow = ctx.createRadialGradient(sat.x, sat.y, size * 0.2, sat.x, sat.y, size * 1.1);
      glow.addColorStop(0, "rgba(" + GOLD + ",0.35)");
      glow.addColorStop(1, "rgba(" + GOLD + ",0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(sat.x, sat.y, size * 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + size, y, x + size, y + size, rad);
      ctx.arcTo(x + size, y + size, x, y + size, rad);
      ctx.arcTo(x, y + size, x, y, rad);
      ctx.arcTo(x, y, x + size, y, rad);
      ctx.closePath();
      ctx.fillStyle = "#0F1C30";
      ctx.fill();
      if (satImg.complete && satImg.naturalWidth) ctx.drawImage(satImg, x, y, size, size);
      ctx.strokeStyle = "rgba(" + GOLD + ",0.9)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // Tracking links: each active comet head is tracked by the nearest visible satellite
    function drawSatelliteLinks() {
      var targets = [];
      routes.forEach(function (rt) {
        if (!rt.hp) return;
        var best = null, bd = Infinity;
        sats.forEach(function (s) {
          if (s.z <= 0.1) return;
          var ddx = rt.hp.x - s.x, ddy = rt.hp.y - s.y, d = ddx * ddx + ddy * ddy;
          if (d < bd) { bd = d; best = s; }
        });
        if (best) targets.push({ p: rt.hp, s: best });
      });
      if (!targets.length) return;

      ctx.save();
      ctx.shadowColor = "rgba(" + GOLD + ",0.8)";
      ctx.shadowBlur = 8;
      ctx.strokeStyle = "rgba(" + GOLD + ",0.8)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = reduceMotion ? 0 : -performance.now() / 30;
      targets.forEach(function (t) {
        ctx.beginPath(); ctx.moveTo(t.s.x, t.s.y); ctx.lineTo(t.p.x, t.p.y); ctx.stroke();
      });
      // target rings on the tracked comet heads
      ctx.setLineDash([]);
      targets.forEach(function (t) {
        ctx.beginPath(); ctx.arc(t.p.x, t.p.y, 8, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      sats.forEach(updateSatellite);

      // satellites on the far side of the orbit: drawn first so the globe occludes them
      sats.forEach(function (s) {
        drawOrbit(s, false);
        if (s.z < 0) drawSatelliteBody(s, false);
      });

      // atmosphere halo
      var halo = ctx.createRadialGradient(cx, cy, r * 0.98, cx, cy, r * 1.22);
      halo.addColorStop(0, "rgba(" + GOLD + ",0.20)");
      halo.addColorStop(1, "rgba(" + GOLD + ",0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.22, 0, Math.PI * 2); ctx.fill();

      // ocean sphere, lit from upper-left
      var body = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.1, cx, cy, r);
      body.addColorStop(0, "rgba(" + GOLD + ",0.20)");
      body.addColorStop(0.65, "rgba(" + GOLD + ",0.06)");
      body.addColorStop(1, "rgba(" + GOLD + ",0.02)");
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(" + GOLD + ",0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      drawGraticule();

      // land dots in 4 depth buckets (one path each); nearer = bigger and brighter
      var c = Math.cos(rotation), s = Math.sin(rotation), i, n = land.length;
      for (i = 0; i < n; i++) {
        var v = land[i];
        var z = -v.x * s + v.z * c;
        px[i] = cx + (v.x * c + v.z * s) * r;
        py[i] = cy - (v.y * cosT - z * sinT) * r;
        pz[i] = v.y * sinT + z * cosT;
      }
      var dotR = Math.max(0.8, r / 230);
      for (var b = 0; b < 4; b++) {
        var lo = b / 4, hi = (b + 1) / 4, rad = dotR * (0.8 + b * 0.25);
        ctx.fillStyle = "rgba(" + GOLD + "," + (0.3 + b * 0.2) + ")";
        ctx.beginPath();
        for (i = 0; i < n; i++) {
          var zz = pz[i];
          if (zz < lo || (b < 3 ? zz >= hi : zz > 1.01)) continue;
          ctx.moveTo(px[i] + rad, py[i]);
          ctx.arc(px[i], py[i], rad, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // hubs
      ctx.fillStyle = "rgba(" + GOLD + ",0.9)";
      hubs.forEach(function (hv) {
        var p = project(hv, 1);
        if (p.z < 0.05) return;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill();
      });

      sats.forEach(function (s) { drawOrbit(s, true); });
      drawRoutes();
      drawSatelliteLinks();
      sats.forEach(function (s) { if (s.z >= 0) drawSatelliteBody(s, true); });

      if (!reduceMotion) {
        rotation += 0.0022;
        sats.forEach(function (s) { s.angle += s.speed; });
      }
    }

    function loop() {
      if (!running) { looping = false; return; }
      draw();
      requestAnimationFrame(loop);
    }

    function start() {
      if (looping) return;
      looping = true;
      requestAnimationFrame(loop);
    }

    resize();
    for (var rk = 0; rk < MAX_LINKS; rk++) routes.push(newRoute(reduceMotion ? 0 : rk * 90));
    window.addEventListener("resize", resize);

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          running = entry.isIntersecting;
          if (running) start();
        });
      });
      io.observe(canvas);
    } else {
      start();
    }

    if (reduceMotion) { draw(); running = false; satImg.onload = draw; }
  }

  /* ---------- Quote form -> WhatsApp / mailto ---------- */
  function initQuoteForm() {
    var form = document.querySelector("[data-quote-form]");
    if (!form) return;
    var waNumber = form.getAttribute("data-wa-number") || "";
    var toEmail = form.getAttribute("data-email") || "";

    function buildMessage() {
      var fd = new FormData(form);
      var lines = [];
      form.querySelectorAll("[name]").forEach(function (field) {
        var label = field.closest(".form-field") && field.closest(".form-field").querySelector("label");
        var val = fd.get(field.name);
        if (val) lines.push((label ? label.textContent : field.name) + ": " + val);
      });
      return lines.join("\n");
    }

    function handleSend(e, type) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var message = buildMessage();
      if (type === "wa") {
        var url = "https://wa.me/" + waNumber.replace(/[^0-9]/g, "") + "?text=" + encodeURIComponent(message);
        window.open(url, "_blank", "noopener");
      } else {
        var subject = encodeURIComponent(form.getAttribute("data-subject") || "Solicitud de cotización");
        var body = encodeURIComponent(message);
        window.location.href = "mailto:" + toEmail + "?subject=" + subject + "&body=" + body;
      }
    }

    var waBtn = form.querySelector("[data-send-wa]");
    var mailBtn = form.querySelector("[data-send-mail]");
    if (waBtn) waBtn.addEventListener("click", function (e) { handleSend(e, "wa"); });
    if (mailBtn) mailBtn.addEventListener("click", function (e) { handleSend(e, "mail"); });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initHeaderScroll();
    initReveal();
    initCounters();
    initRotator();
    initCardSpotlight();
    initTimeline();
    initGlobe();
    initQuoteForm();
    initYear();
  });
})();
