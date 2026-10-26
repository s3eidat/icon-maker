/* Icon Maker — one SVG path per shape feeds both the canvas (Path2D) and the SVG export, so they match. */
(function () {
  "use strict";
  var $ = S3.$, $$ = S3.$$;
  var EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol"';
  var FONTS = {
    sans: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Arabic", sans-serif, ' + EMOJI,
    rounded: 'ui-rounded, "SF Pro Rounded", Nunito, "Varela Round", "Arial Rounded MT Bold", system-ui, sans-serif, ' + EMOJI,
    serif: 'Georgia, "Times New Roman", "Noto Serif", serif, ' + EMOJI,
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace, ' + EMOJI
  };
  var PICKS = ["🚀", "⚡", "🎯", "💡", "🔥", "⭐", "📷", "🎵", "❤️", "🌿", "☕", "🧠", "🎮", "📚", "✈️", "Aa"];
  var PRESETS = [["#3dd6d0", "#3b5bdb"], ["#ff9a6b", "#ff5e7e"], ["#7b6cf6", "#e45fd6"], ["#f7b733", "#fc4a1a"], ["#3fa66b", "#134e3a"],
    ["#5b3c88", "#1d2b4f"], ["#3a3f47", "#111418"], ["#ffffff", "#e7eaef"]];
  var DEF = { text: "S3", font: "sans", weight: "800", fg: "#ffffff", size: 52, bgType: "linear", c1: "#3dd6d0", c2: "#3b5bdb", angle: 135, shape: "squircle", shadow: true };
  var st = Object.assign({}, DEF, S3.store("im.settings") || {});

  // ---------- pure helpers ----------
  function graphemes(s) {
    if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s), function (x) { return x.segment; });
    return Array.from(s);
  }
  function f2(n) { return +n.toFixed(2); }
  function shapePath(shape, S) {
    if (shape === "circle") return "M0 " + S / 2 + "A" + S / 2 + " " + S / 2 + " 0 1 1 " + S + " " + S / 2 + "A" + S / 2 + " " + S / 2 + " 0 1 1 0 " + S / 2 + "Z";
    if (shape === "rounded") {
      var r = f2(S * 0.2237);
      return "M" + r + " 0H" + f2(S - r) + "A" + r + " " + r + " 0 0 1 " + S + " " + r + "V" + f2(S - r) + "A" + r + " " + r + " 0 0 1 " + f2(S - r) + " " + S +
        "H" + r + "A" + r + " " + r + " 0 0 1 0 " + f2(S - r) + "V" + r + "A" + r + " " + r + " 0 0 1 " + r + " 0Z";
    }
    if (shape === "squircle") { // superellipse |x|^5 + |y|^5 = 1
      var d = "", n = 160, h = S / 2;
      for (var i = 0; i < n; i++) {
        var t = i / n * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t);
        d += (i ? "L" : "M") + f2(h + h * Math.sign(c) * Math.pow(Math.abs(c), 0.4)) + " " + f2(h + h * Math.sign(s) * Math.pow(Math.abs(s), 0.4));
      }
      return d + "Z";
    }
    return "M0 0H" + S + "V" + S + "H0Z";
  }
  // CSS-style gradient line (0deg = up).
  function gradLine(S, deg) { var a = deg * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), len = S * (Math.abs(dx) + Math.abs(dy)); return [S / 2 - dx * len / 2, S / 2 - dy * len / 2, S / 2 + dx * len / 2, S / 2 + dy * len / 2]; }

  var mc = document.createElement("canvas").getContext("2d");
  // Measures the ink box so the glyphs sit visually centred (emoji and letters alike).
  function textLayout(s, S, scale) {
    var txt = s.text || " ", px = S * s.size / 100 * (scale || 1);
    mc.font = s.weight + " " + px + "px " + FONTS[s.font];
    var m = mc.measureText(txt), w = (m.actualBoundingBoxRight || 0) + (m.actualBoundingBoxLeft || 0) || m.width;
    var maxW = S * 0.8 * (scale || 1);
    if (w > maxW) { px *= maxW / w; mc.font = s.weight + " " + px + "px " + FONTS[s.font]; m = mc.measureText(txt); }
    var asc = m.actualBoundingBoxAscent || px * 0.72, desc = m.actualBoundingBoxDescent || 0;
    var left = m.actualBoundingBoxLeft || 0, right = m.actualBoundingBoxRight || m.width;
    return { px: px, y: S / 2 + (asc - desc) / 2, inkLeft: left, inkRight: right, font: s.weight + " " + px + "px " + FONTS[s.font] };
  }

  function draw(canvas, S, s, opt) {
    opt = opt || {};
    canvas.width = S; canvas.height = S;
    var c = canvas.getContext("2d"), path = new Path2D(shapePath(opt.fullBleed ? "square" : s.shape, S));
    if (s.bgType === "solid") c.fillStyle = s.c1;
    else {
      var g;
      if (s.bgType === "radial") g = c.createRadialGradient(S * 0.5, S * 0.38, 0, S * 0.5, S * 0.5, S * 0.75);
      else { var l = gradLine(S, s.angle); g = c.createLinearGradient(l[0], l[1], l[2], l[3]); }
      g.addColorStop(0, s.c1); g.addColorStop(1, s.c2); c.fillStyle = g;
    }
    c.fill(path);
    if (!s.text) return canvas;
    c.save(); c.clip(path);
    var L = textLayout(s, S, opt.textScale);
    c.font = L.font; c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillStyle = s.fg;
    if (s.shadow) { c.shadowColor = "rgba(0,0,0,.30)"; c.shadowBlur = S * 0.035; c.shadowOffsetY = S * 0.018; }
    c.fillText(s.text, S / 2 - (L.inkRight - L.inkLeft) / 2, L.y);
    c.restore();
    return canvas;
  }

  function svg(s, S) {
    S = S || 1024;
    var L = textLayout(s, S), defs = "", fill = s.c1;
    if (s.bgType === "linear") {
      var l = gradLine(S, s.angle);
      defs += '<linearGradient id="bg" gradientUnits="userSpaceOnUse" x1="' + f2(l[0]) + '" y1="' + f2(l[1]) + '" x2="' + f2(l[2]) + '" y2="' + f2(l[3]) + '"><stop offset="0" stop-color="' + s.c1 + '"/><stop offset="1" stop-color="' + s.c2 + '"/></linearGradient>';
      fill = "url(#bg)";
    } else if (s.bgType === "radial") {
      defs += '<radialGradient id="bg" gradientUnits="userSpaceOnUse" cx="' + S / 2 + '" cy="' + S / 2 + '" r="' + f2(S * 0.75) + '" fx="' + S / 2 + '" fy="' + f2(S * 0.38) + '"><stop offset="0" stop-color="' + s.c1 + '"/><stop offset="1" stop-color="' + s.c2 + '"/></radialGradient>';
      fill = "url(#bg)";
    }
    if (s.shadow) defs += '<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="' + f2(S * 0.018) + '" stdDeviation="' + f2(S * 0.0175) + '" flood-color="#000" flood-opacity=".3"/></filter>';
    defs += '<clipPath id="clip"><path d="' + shapePath(s.shape, S) + '"/></clipPath>';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + " " + S + '">' +
      "<defs>" + defs + "</defs>" +
      '<path d="' + shapePath(s.shape, S) + '" fill="' + fill + '"/>' +
      (s.text ? '<g clip-path="url(#clip)"><text x="' + f2(S / 2 - (L.inkRight - L.inkLeft) / 2) + '" y="' + f2(L.y) + '" fill="' + s.fg + '" font-family="' + S3.esc(FONTS[s.font].replace(/"/g, "'")) +
        '" font-weight="' + s.weight + '" font-size="' + f2(L.px) + '"' + (s.shadow ? ' filter="url(#sh)"' : "") + ">" + S3.esc(s.text) + "</text></g>" : "") +
      "</svg>";
  }

  // ---------- export plan ----------
  var IOS = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024];
  var ANDROID = [["mdpi", 48], ["hdpi", 72], ["xhdpi", 96], ["xxhdpi", 144], ["xxxhdpi", 192]];
  function plan() {
    var p = [["web/favicon-16.png", 16], ["web/favicon-32.png", 32], ["web/favicon-48.png", 48], ["web/icon-192.png", 192], ["web/icon-512.png", 512]]
      .map(function (x) { return { name: x[0], size: x[1] }; });
    p.push({ name: "web/apple-touch-icon.png", size: 180, fullBleed: true });
    p.push({ name: "web/icon-maskable-512.png", size: 512, fullBleed: true, textScale: 0.8 }); // content inside the 80% safe zone
    IOS.forEach(function (n) { p.push({ name: "ios/AppIcon-" + n + ".png", size: n, fullBleed: true }); });
    ANDROID.forEach(function (a) { p.push({ name: "android/mipmap-" + a[0] + "/ic_launcher.png", size: a[1] }); });
    p.push({ name: "android/playstore-icon-512.png", size: 512, fullBleed: true });
    return p;
  }
  function pngBytes(canvas) {
    return new Promise(function (res, rej) { canvas.toBlob(function (b) { if (!b) return rej(new Error("PNG encoding failed")); b.arrayBuffer().then(function (a) { res(new Uint8Array(a)); }, rej); }, "image/png"); });
  }
  function label() { return /^[\p{L}\p{N}\s]+$/u.test(st.text) ? st.text : "My App"; }
  function manifest() {
    return JSON.stringify({ name: label(), short_name: label(), icons: [
      { src: "icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ], theme_color: st.c1, background_color: st.c1, display: "standalone" }, null, 2) + "\n";
  }
  var HEAD = '<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">\n<link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png">\n' +
    '<link rel="icon" href="/icon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">\n';

  // ---------- UI ----------
  var cv = $("#cv");
  function persist() { S3.store("im.settings", st); }
  function seg(el, key) {
    $$("button", el).forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.v === String(st[key])));
      b.addEventListener("click", function () { st[key] = b.dataset.v; $$("button", el).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); update(); });
    });
  }
  function syncSegs() { ["font", "weight", "bgType", "shape"].forEach(function (k) { $$("#" + k + " button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === String(st[k]))); }); }); }
  var queued = false;
  function update() {
    persist();
    $("#sizeLbl").textContent = st.size + "%"; $("#angLbl").textContent = st.angle + "°";
    $("#c2Wrap").hidden = st.bgType === "solid"; $("#angWrap").hidden = st.bgType !== "linear";
    var n = graphemes(st.text).length;
    $("#cnt").textContent = n + " of 3 characters";
    if (queued) return; queued = true;
    requestAnimationFrame(function () {
      queued = false;
      draw(cv, 640, st);
      $$(".im-minis canvas").forEach(function (c) { var s = +c.dataset.s; draw(c, s * 2, st); c.style.width = c.style.height = s + "px"; });
      $("#homeLbl").textContent = label();
    });
  }
  $("#text").value = st.text;
  $("#text").addEventListener("input", function () {
    var g = graphemes(this.value);
    if (g.length > 3) { this.value = g.slice(0, 3).join(""); S3.toast("Icons look best with 1–3 characters"); }
    st.text = this.value; update();
  });
  PICKS.forEach(function (p) {
    var b = S3.h("button", { "class": "im-pick", text: p, "aria-label": "Use " + p });
    b.addEventListener("click", function () { st.text = p; $("#text").value = p; update(); });
    $("#picks").appendChild(b);
  });
  PRESETS.forEach(function (p) {
    var b = S3.h("button", { "class": "im-preset", style: "background:linear-gradient(135deg," + p[0] + "," + p[1] + ")", "aria-label": "Background " + p[0] + " to " + p[1] });
    b.addEventListener("click", function () { st.c1 = p[0]; st.c2 = p[1]; if (st.bgType === "solid") st.bgType = "linear"; $("#c1").value = p[0]; $("#c2").value = p[1]; st.fg = p[0] === "#ffffff" ? "#111418" : "#ffffff"; $("#fg").value = st.fg; syncSegs(); update(); });
    $("#presets").appendChild(b);
  });
  ["fg", "c1", "c2"].forEach(function (k) { $("#" + k).value = st[k]; $("#" + k).addEventListener("input", function () { st[k] = this.value; update(); }); });
  ["size", "angle"].forEach(function (k) { $("#" + k).value = st[k]; $("#" + k).addEventListener("input", function () { st[k] = +this.value; update(); }); });
  $("#shadow").checked = st.shadow; $("#shadow").addEventListener("change", function () { st.shadow = this.checked; update(); });
  ["font", "weight", "bgType", "shape"].forEach(function (k) { seg($("#" + k), k); });

  function base() { return (label() === "My App" ? "icon" : label().trim().replace(/\s+/g, "-").toLowerCase()) || "icon"; }
  $$("[data-png]").forEach(function (b) {
    b.addEventListener("click", function () {
      var n = +b.dataset.png;
      pngBytes(draw(document.createElement("canvas"), n, st)).then(function (u8) { S3.download(new Blob([u8], { type: "image/png" }), base() + "-" + n + ".png"); S3.done(); },
        function (e) { S3.toast(e.message, "error"); });
    });
  });
  $("#svg").addEventListener("click", function () { S3.download(svg(st), base() + ".svg", "image/svg+xml"); S3.done(); });
  $("#zip").addEventListener("click", function () {
    var btn = this; btn.disabled = true;
    var files = [];
    plan().reduce(function (pr, f) {
      return pr.then(function () { return pngBytes(draw(document.createElement("canvas"), f.size, st, f)).then(function (u8) { files.push({ name: f.name, data: u8 }); }); });
    }, Promise.resolve()).then(function () {
      files.push({ name: "web/icon.svg", data: svg(st) }, { name: "web/site.webmanifest", data: manifest() }, { name: "web/head-snippet.html", data: HEAD });
      S3.download(S3.zip(files), base() + "-icons.zip"); S3.done();
    }, function (e) { S3.toast(e.message, "error"); }).then(function () { btn.disabled = false; });
  });

  update();
  if (document.fonts && document.fonts.load) document.fonts.load("800 40px Inter").then(update, function () {});

  window.S3_DEMO = function () {
    st = Object.assign({}, DEF); $("#text").value = st.text; syncSegs();
    ["fg", "c1", "c2", "size", "angle"].forEach(function (k) { $("#" + k).value = st[k]; }); $("#shadow").checked = true; update();
  };

  window.S3_SELFTEST = function () {
    var ok = graphemes("👍🏽").length === 1 && graphemes("👨‍👩‍👧").length === 1 && graphemes("AB").length === 2 && graphemes("é").length === 1;
    function alpha(shape, x, y) { var c = draw(document.createElement("canvas"), 64, Object.assign({}, DEF, { text: "", shape: shape, bgType: "solid", c1: "#ff0000" })); return c.getContext("2d").getImageData(x, y, 1, 1).data[3]; }
    ok = ok && alpha("circle", 1, 1) === 0 && alpha("circle", 32, 32) === 255 && alpha("square", 0, 0) === 255 &&
      alpha("rounded", 0, 0) === 0 && alpha("rounded", 32, 1) === 255 && alpha("squircle", 1, 1) === 0 && alpha("squircle", 32, 1) === 255;
    var full = draw(document.createElement("canvas"), 64, Object.assign({}, DEF, { text: "", shape: "circle" }), { fullBleed: true });
    ok = ok && full.getContext("2d").getImageData(0, 0, 1, 1).data[3] === 255;
    var sq = shapePath("squircle", 100).match(/-?\d+(\.\d+)?/g).map(Number);
    ok = ok && sq.every(function (v) { return v >= 0 && v <= 100; }) && shapePath("square", 10) === "M0 0H10V10H0Z";
    var x = svg(Object.assign({}, DEF, { text: "<&" }), 1024);
    ok = ok && x.indexOf('viewBox="0 0 1024 1024"') > 0 && x.indexOf("&lt;&amp;</text>") > 0 && x.indexOf("<linearGradient") > 0 && x.indexOf("<&") < 0;
    var names = plan().map(function (f) { return f.name; });
    ok = ok && names.length === 26 && names.indexOf("ios/AppIcon-1024.png") >= 0 && names.indexOf("android/mipmap-xxxhdpi/ic_launcher.png") >= 0 &&
      plan().filter(function (f) { return /^ios\//.test(f.name); }).every(function (f) { return f.fullBleed; });
    ok = ok && JSON.parse(manifest()).icons.length === 3;
    if (!ok) return false;
    return pngBytes(draw(document.createElement("canvas"), 16, DEF)).then(function (u8) {
      return S3.zip([{ name: "a.txt", data: "hi" }]).arrayBuffer().then(function (z) {
        var zb = new Uint8Array(z);
        return u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && zb[0] === 0x50 && zb[1] === 0x4B;
      });
    });
  };
})();
