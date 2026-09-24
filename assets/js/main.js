/* =========================================================
   OTC International Logistics — main.js
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
    var w, h, r;
    var points = [];
    var arcs = [];
    var rotation = 0;
    var running = true;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      r = Math.min(w, h) * 0.42;
      buildPoints();
    }

    function buildPoints() {
      points = [];
      var latSteps = 9, lonSteps = 16;
      for (var i = 1; i < latSteps; i++) {
        var lat = (Math.PI * i) / latSteps - Math.PI / 2;
        var ringR = Math.cos(lat);
        var count = Math.max(4, Math.round(lonSteps * ringR));
        for (var j = 0; j < count; j++) {
          var lon = (Math.PI * 2 * j) / count;
          points.push({ lat: lat, lon: lon });
        }
      }
      arcs = [];
      var arcCount = 6;
      for (var k = 0; k < arcCount; k++) {
        arcs.push({
          from: points[Math.floor(Math.random() * points.length)],
          to: points[Math.floor(Math.random() * points.length)],
          t: Math.random(),
          speed: 0.0026 + Math.random() * 0.0018
        });
      }
    }

    function project(lat, lon, rot) {
      var x3 = Math.cos(lat) * Math.sin(lon + rot);
      var y3 = Math.sin(lat);
      var z3 = Math.cos(lat) * Math.cos(lon + rot);
      return {
        x: w / 2 + x3 * r,
        y: h / 2 - y3 * r,
        z: z3,
        scale: (z3 + 1.6) / 2.6
      };
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(120,170,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.stroke();

      points.forEach(function (p) {
        var proj = project(p.lat, p.lon, rotation);
        if (proj.z < -0.15) return;
        ctx.beginPath();
        ctx.fillStyle = "rgba(0,229,255," + (0.25 + proj.scale * 0.45) + ")";
        ctx.arc(proj.x, proj.y, 1.1 + proj.scale * 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      arcs.forEach(function (arc) {
        arc.t += arc.speed;
        if (arc.t > 1) { arc.t = 0; arc.from = points[Math.floor(Math.random() * points.length)]; arc.to = points[Math.floor(Math.random() * points.length)]; }
        var lat = arc.from.lat + (arc.to.lat - arc.from.lat) * arc.t;
        var lon = arc.from.lon + (arc.to.lon - arc.from.lon) * arc.t;
        var lift = Math.sin(arc.t * Math.PI) * 0.35;
        var p1 = project(arc.from.lat, arc.from.lon, rotation);
        var p2 = project(lat + lift, lon, rotation);
        if (p1.z < -0.2 || p2.z < -0.2) return;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0,229,255,0.55)";
        ctx.lineWidth = 1.4;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = "#00e5ff";
        ctx.arc(p2.x, p2.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!reduceMotion) rotation += 0.0022;
    }

    function loop() {
      if (!running) return;
      draw();
      requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener("resize", resize);

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          running = entry.isIntersecting;
          if (running) requestAnimationFrame(loop);
        });
      });
      io.observe(canvas);
    } else {
      loop();
    }

    if (reduceMotion) { draw(); running = false; }
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
