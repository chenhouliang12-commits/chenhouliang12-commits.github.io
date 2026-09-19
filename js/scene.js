'use strict';
/* ============================================================
   scene.js —— 点击式解谜场景：轮廓热点 + 物体亮起 + 校准编辑器
   ============================================================ */
(function () {
  var SVGNS = 'http://www.w3.org/2000/svg';
  function $(sel) { return document.querySelector(sel); }

  // 热点校准仅在显式使用 ?hotspots=1 打开时恢复。
  // 正式游戏始终使用 data.js 中的完整热点，避免旧校准数据把可交互区域覆盖掉。
  var HOTSPOT_OVERRIDE = /(?:^|[?&])hotspots=1(?:&|$)/.test(window.location.search);
  if (HOTSPOT_OVERRIDE) {
    try {
      var saved = localStorage.getItem('clockmaker_hotspots_v1');
      if (saved) {
        var p = JSON.parse(saved);
        if (p && p.foyer && p.basement && p.attic) window.HOTSPOTS = p;
      }
    } catch (e) {}
  }

  var hoverEl = null;
  function ensureHover() {
    if (!hoverEl) { hoverEl = document.createElement('div'); hoverEl.className = 'hover-label'; document.body.appendChild(hoverEl); }
  }
  function showHover(x, y, label) { if (!hoverEl) ensureHover(); hoverEl.textContent = label; hoverEl.classList.add('show'); moveHover(x, y); }
  function moveHover(x, y) { if (hoverEl) { hoverEl.style.left = (x + 14) + 'px'; hoverEl.style.top = (y + 16) + 'px'; } }
  function hideHover() { if (hoverEl) hoverEl.classList.remove('show'); }
  function flashLabel(x, y, label) { if (!hoverEl) ensureHover(); hoverEl.textContent = label; hoverEl.classList.add('show'); moveHover(x, y); setTimeout(hideHover, 1100); }

  var litImg = null;

  /* ---------- 渲染 ---------- */
  function render(roomId, state) {
    var scene = $('#scene');
    scene.innerHTML = '';
    scene.classList.remove('highlight-all', 'editing');
    var src = 'assets/scenes/' + roomId + '.jpg';

    var bg = document.createElement('img');
    bg.className = 'scene-bg'; bg.src = src;
    var lit = document.createElement('img');
    lit.className = 'scene-lit'; lit.src = src; litImg = lit;
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'scene-overlay');
    svg.setAttribute('preserveAspectRatio', 'none');

    scene.appendChild(bg); scene.appendChild(lit); scene.appendChild(svg);

    function setup() {
      var W = bg.naturalWidth, H = bg.naturalHeight;
      if (!W || !H) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      buildOverlay(svg, roomId, state, W, H);
      fitFrame(W, H);
      if (Editor.on) Editor.attach(scene);
    }
    if (bg.complete && bg.naturalWidth) setup();
    else bg.addEventListener('load', setup);
  }

  function fitFrame(W, H) {
    var wrap = $('#scene-wrap'), scene = $('#scene');
    if (!wrap || !scene) return;
    var w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    var ratio = W / H;
    var fw = Math.min(w, h * ratio);
    var fh = fw / ratio;
    scene.style.width = fw + 'px';
    scene.style.height = fh + 'px';
  }
  window.addEventListener('resize', function () {
    var bg = document.querySelector('.scene-bg');
    if (bg && bg.naturalWidth) fitFrame(bg.naturalWidth, bg.naturalHeight);
  });

  function buildOverlay(svg, room, state, W, H) {
    var list = window.HOTSPOTS[room] || [];
    list.forEach(function (h) {
      var pts = h.points.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
      var clip = h.points.map(function (p) { return (p[0] / W * 100).toFixed(3) + '% ' + (p[1] / H * 100).toFixed(3) + '%'; }).join(',');

      var g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'hotspot');
      g.setAttribute('data-hotspot', h.id);
      g.setAttribute('data-label', h.label);
      g.setAttribute('data-clip', 'polygon(' + clip + ')');

      var flag = window.HOTSPOT_FLAG[h.id];
      if (flag && state && state.flags && state.flags[flag]) g.classList.add('done');

      var area = document.createElementNS(SVGNS, 'polygon');
      area.setAttribute('class', 'hs-area');
      area.setAttribute('points', pts);
      area.setAttribute('fill', 'transparent');

      var glow = document.createElementNS(SVGNS, 'polygon');
      glow.setAttribute('class', 'hs-glow');
      glow.setAttribute('points', pts);

      g.appendChild(area); g.appendChild(glow);
      svg.appendChild(g);
      bindHotspot(g, h);
    });
  }

  function bindHotspot(g, h) {
    g.addEventListener('mouseenter', function (e) {
      if (Editor.on || g.classList.contains('done')) return;
      lightUp(g); showHover(e.clientX, e.clientY, h.label);
    });
    g.addEventListener('mousemove', function (e) { moveHover(e.clientX, e.clientY); });
    g.addEventListener('mouseleave', function () { lightDown(g); hideHover(); });
    g.addEventListener('click', function (e) {
      e.stopPropagation();
      if (Editor.on) { Editor.onHotspotClick(g); return; }
      flashLabel(e.clientX, e.clientY, h.label);
      flash(g);
      if (window.Engine.state.selectedItem) window.Engine.useSelectedOn(h.id);
      else window.Engine.click(h.id);
    });
  }

  function lightUp(g) {
    if (litImg && g.getAttribute('data-clip')) { litImg.style.clipPath = g.getAttribute('data-clip'); litImg.classList.add('show'); }
    g.classList.add('hover');
  }
  function lightDown(g) { if (litImg) litImg.classList.remove('show'); g.classList.remove('hover'); }
  function flash(g) { g.classList.add('flash'); setTimeout(function () { g.classList.remove('flash'); }, 170); }

  function toggleHighlight() { $('#scene').classList.toggle('highlight-all'); }

  function onKey(e) {
    var tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    var k = (e.key || '').toLowerCase();
    if (k === 'h') toggleHighlight();
    else if (k === 'e') Editor.toggle();
    else if (k === 'delete' || k === 'backspace') { if (Editor.on) Editor.deleteVertex(); }
    else if (k === 'escape') { if (Editor.on) { Editor.mode = 'select'; Editor.selectedVertex = -1; Editor.refreshHandles(); } }
  }

  /* ============================================================
     校准编辑器
     ============================================================ */
  var Editor = {
    on: false,
    selected: null,        // 选中的 hotspot g 元素
    selectedData: null,    // 选中的 HOTSPOTS 数据对象
    selectedVertex: -1,
    mode: 'select',
    drawPts: [],
    toolbar: null,
    scene: null,

    toggle: function () {
      this.on = !this.on;
      var scene = $('#scene');
      if (this.on) { scene.classList.add('editing'); this.attach(scene); }
      else { scene.classList.remove('editing'); this.detach(); }
    },

    attach: function (scene) {
      this.scene = scene;
      this.ensureToolbar();
      this.decorate();
      this.bindScene();
    },
    detach: function () {
      if (this.toolbar) this.toolbar.classList.add('hidden');
      this.clearHandles();
      if (this._unbind) { this._unbind(); this._unbind = null; }
    },

    room: function () { return window.Engine.state.currentRoom; },
    list: function () { return window.HOTSPOTS[this.room()] || []; },
    dataFor: function (g) {
      var id = g.getAttribute('data-hotspot');
      var l = this.list();
      for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
      return null;
    },

    ensureToolbar: function () {
      if (this.toolbar) { this.toolbar.classList.remove('hidden'); return; }
      var t = document.createElement('div');
      t.className = 'edit-toolbar';
      t.innerHTML =
        '<span class="et-title">热点校准</span>' +
        '<select class="et-id"></select>' +
        '<input class="et-name" placeholder="名称" />' +
        '<button data-a="poly">画多边形</button>' +
        '<button data-a="wand">魔棒</button>' +
        '<button data-a="del">删除热点</button>' +
        '<button data-a="export" class="primary">导出JSON</button>' +
        '<button data-a="exit">退出(E)</button>' +
        '<label class="et-tol">容差 <input class="et-tolval" type="range" min="8" max="90" value="32" /></label>';
      document.body.appendChild(t);
      this.toolbar = t;
      var self = this;

      var sel = t.querySelector('.et-id');
      var all = [];
      Object.keys(window.HOTSPOTS).forEach(function (r) { window.HOTSPOTS[r].forEach(function (h) { all.push(h.id); }); });
      all.sort().forEach(function (id) { var o = document.createElement('option'); o.value = id; o.textContent = id; sel.appendChild(o); });

      t.addEventListener('click', function (ev) {
        var b = ev.target.closest('button'); if (!b) return;
        var a = b.getAttribute('data-a');
        if (a === 'export') self.export();
        else if (a === 'exit') self.toggle();
        else if (a === 'poly') { self.mode = 'poly'; self.drawPts = []; }
        else if (a === 'wand') { self.mode = 'wand'; self.drawPts = []; }
        else if (a === 'del') self.deleteHotspot();
      });
      sel.addEventListener('change', function () {
        if (self.selectedData) { self.selectedData.id = sel.value; if (self.selected) self.selected.setAttribute('data-hotspot', sel.value); }
      });
      t.querySelector('.et-name').addEventListener('input', function () {
        if (self.selectedData) { self.selectedData.label = this.value; if (self.selected) self.selected.setAttribute('data-label', this.value); }
      });
    },

    decorate: function () {
      var self = this;
      this.scene.querySelectorAll('.hotspot').forEach(function (g) {
        g.classList.add('editable');
        var id = g.getAttribute('data-hotspot');
        if (!g.querySelector('.hs-edit-label')) {
          var h = self.dataFor(g);
          var c = centroid(h.points);
          var txt = document.createElementNS(SVGNS, 'text');
          txt.setAttribute('class', 'hs-edit-label');
          txt.setAttribute('x', c[0]); txt.setAttribute('y', c[1]);
          txt.textContent = id;
          g.appendChild(txt);
        }
      });
    },

    clearHandles: function () {
      if (this.scene) {
        this.scene.querySelectorAll('.hs-vertex').forEach(function (n) { n.remove(); });
      }
      this.selectedVertex = -1;
    },
    refreshHandles: function () {
      this.clearHandles();
      if (!this.selected || !this.selectedData) return;
      var self = this;
      this.selectedData.points.forEach(function (p, i) {
        var c = document.createElementNS(SVGNS, 'circle');
        c.setAttribute('class', 'hs-vertex');
        c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]);
        c.setAttribute('r', 6);
        c.setAttribute('data-vi', i);
        c.addEventListener('pointerdown', function (e) { self.startVertexDrag(e, i); });
        self.selected.appendChild(c);
      });
    },

    onHotspotClick: function (g) {
      if (this.mode === 'poly' || this.mode === 'wand') return; // 绘制模式不选中
      this.select(g);
    },

    select: function (g) {
      this.scene.querySelectorAll('.hotspot').forEach(function (x) { x.classList.remove('selected'); });
      g.classList.add('selected');
      this.selected = g;
      this.selectedData = this.dataFor(g);
      this.selectedVertex = -1;
      this.refreshHandles();
      if (this.toolbar) {
        this.toolbar.querySelector('.et-id').value = g.getAttribute('data-hotspot');
        this.toolbar.querySelector('.et-name').value = g.getAttribute('data-label') || '';
      }
    },

    bindScene: function () {
      var self = this;
      var scene = this.scene;
      var svg = scene.querySelector('svg');

      function toPx(e) {
        var r = svg.getBoundingClientRect();
        var W = parseFloat(svg.getAttribute('viewBox').split(' ')[2]);
        var H = parseFloat(svg.getAttribute('viewBox').split(' ')[3]);
        return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height];
      }

      var down = function (e) {
        if (!self.on) return;
        var p = toPx(e);
        var t = e.target;

        if (self.mode === 'poly') {
          e.preventDefault();
          self.drawPts.push(p);
          self.drawPreview();
          return;
        }
        if (self.mode === 'wand') {
          e.preventDefault();
          self.magicWand(e, p);
          return;
        }

        // 顶点拖拽由 handle 的 pointerdown 处理，这里处理整体拖动
        if (t && t.classList && t.classList.contains('hs-vertex')) return;
        var g = t && t.closest ? t.closest('.hotspot') : null;
        if (!g) { self.select(null); return; }
        self.select(g);
        self.startMove(e, g, p);
      };
      var dbl = function (e) {
        if (!self.on) return;
        var t = e.target;
        var g = t && t.closest ? t.closest('.hotspot') : null;
        if (!g || !self.selected || g !== self.selected) return;
        var p = toPx(e);
        self.insertVertexNear(p);
      };
      svg.addEventListener('pointerdown', down);
      svg.addEventListener('dblclick', dbl);
      this._unbind = function () { svg.removeEventListener('pointerdown', down); svg.removeEventListener('dblclick', dbl); };
    },

    startMove: function (e, g, startPx) {
      var self = this;
      var h = this.dataFor(g);
      var orig = h.points.map(function (p) { return p.slice(); });
      function mv(ev) {
        var r = self.scene.querySelector('svg').getBoundingClientRect();
        var W = parseFloat(self.scene.querySelector('svg').getAttribute('viewBox').split(' ')[2]);
        var H = parseFloat(self.scene.querySelector('svg').getAttribute('viewBox').split(' ')[3]);
        var dx = (ev.clientX - e.clientX) * W / r.width;
        var dy = (ev.clientY - e.clientY) * H / r.height;
        for (var i = 0; i < h.points.length; i++) { h.points[i][0] = orig[i][0] + dx; h.points[i][1] = orig[i][1] + dy; }
        self.applySelected();
      }
      function up() { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); self.save(); }
      window.addEventListener('pointermove', mv);
      window.addEventListener('pointerup', up);
    },

    startVertexDrag: function (e, i) {
      e.stopPropagation(); e.preventDefault();
      var self = this;
      this.selectedVertex = i;
      var h = this.selectedData;
      function mv(ev) {
        var r = self.scene.querySelector('svg').getBoundingClientRect();
        var W = parseFloat(self.scene.querySelector('svg').getAttribute('viewBox').split(' ')[2]);
        var H = parseFloat(self.scene.querySelector('svg').getAttribute('viewBox').split(' ')[3]);
        h.points[i] = [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height];
        self.applySelected();
      }
      function up() { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); self.save(); self.refreshHandles(); }
      window.addEventListener('pointermove', mv);
      window.addEventListener('pointerup', up);
    },

    insertVertexNear: function (p) {
      var pts = this.selectedData.points;
      if (pts.length < 3) return;
      var best = 0, bestD = 1e18, bi = 0;
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i], b = pts[(i + 1) % pts.length];
        var d = distToSeg(p, a, b);
        if (d < bestD) { bestD = d; bi = i; }
      }
      pts.splice(bi + 1, 0, [Math.round(p[0]), Math.round(p[1])]);
      this.applySelected(); this.save(); this.refreshHandles();
    },

    deleteVertex: function () {
      if (!this.selectedData || this.selectedVertex < 0) return;
      if (this.selectedData.points.length <= 3) return;
      this.selectedData.points.splice(this.selectedVertex, 1);
      this.selectedVertex = -1;
      this.applySelected(); this.save(); this.refreshHandles();
    },

    deleteHotspot: function () {
      if (!this.selectedData) return;
      var id = this.selectedData.id;
      var list = this.list();
      var idx = list.indexOf(this.selectedData);
      if (idx >= 0) list.splice(idx, 1);
      this.selected = null; this.selectedData = null;
      this.save();
      window.Scene.render(this.room(), window.Engine.state);
      this.toggle(); this.toggle();
    },

    drawPreview: function () {
      var svg = this.scene.querySelector('svg');
      var old = svg.querySelector('.draw-preview');
      if (old) old.remove();
      if (this.drawPts.length === 0) return;
      var p = document.createElementNS(SVGNS, 'polygon');
      p.setAttribute('class', 'draw-preview');
      p.setAttribute('points', this.drawPts.map(function (x) { return x[0] + ',' + x[1]; }).join(' '));
      p.setAttribute('fill', 'rgba(120,220,120,0.25)');
      p.setAttribute('stroke', '#7cd07c');
      svg.appendChild(p);
    },

    finishDraw: function () {
      if (this.drawPts.length < 3) return;
      var id = this.toolbar.querySelector('.et-id').value || ('new_' + Date.now());
      var label = this.toolbar.querySelector('.et-name').value || id;
      this.list().push({ id: id, label: label, points: this.drawPts.map(function (p) { return [Math.round(p[0]), Math.round(p[1])]; }) });
      this.drawPts = [];
      this.mode = 'select';
      this.save();
      window.Scene.render(this.room(), window.Engine.state);
    },

    magicWand: function (e, p) {
      var self = this;
      var bg = this.scene.querySelector('.scene-bg');
      var W = bg.naturalWidth, H = bg.naturalHeight;
      if (!W || !H) return;
      var max = 300;
      var scale = Math.min(1, max / W);
      var cw = Math.max(1, Math.round(W * scale)), ch = Math.max(1, Math.round(H * scale));
      var cv = document.createElement('canvas');
      cv.width = cw; cv.height = ch;
      var ctx = cv.getContext('2d', { willReadFrequently: true });
      try { ctx.drawImage(bg, 0, 0, cw, ch); } catch (err) { window.alert('无法读取图片像素（可能是本地文件限制）'); return; }
      var img = ctx.getImageData(0, 0, cw, ch).data;
      var tol = parseInt(this.toolbar.querySelector('.et-tolval').value, 10) || 32;
      var sx = Math.round(p[0] * scale), sy = Math.round(p[1] * scale);
      var mask = floodFill(img, cw, ch, sx, sy, tol);
      var pts = outline(mask, cw, ch);
      if (pts.length < 3) { window.alert('魔棒没有选中有效区域，试试调大容差或点击物体中心'); return; }
      var poly = douglasPeucker(pts, 2.5).map(function (q) { return [Math.round(q[0] / scale), Math.round(q[1] / scale)]; });
      var id = this.toolbar.querySelector('.et-id').value || ('new_' + Date.now());
      var label = this.toolbar.querySelector('.et-name').value || id;
      this.list().push({ id: id, label: label, points: poly });
      this.mode = 'select';
      this.save();
      window.Scene.render(this.room(), window.Engine.state);
      var self2 = this;
      setTimeout(function () { var g = self2.scene.querySelector('.hotspot[data-hotspot="' + id + '"]'); if (g) self2.select(g); }, 50);
    },

    applySelected: function () {
      if (!this.selected || !this.selectedData) return;
      var pts = this.selectedData.points.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
      this.selected.querySelector('.hs-area').setAttribute('points', pts);
      this.selected.querySelector('.hs-glow').setAttribute('points', pts);
      // 更新 clip
      var svg = this.scene.querySelector('svg');
      var W = parseFloat(svg.getAttribute('viewBox').split(' ')[2]);
      var H = parseFloat(svg.getAttribute('viewBox').split(' ')[3]);
      var clip = this.selectedData.points.map(function (p) { return (p[0] / W * 100).toFixed(3) + '% ' + (p[1] / H * 100).toFixed(3) + '%'; }).join(',');
      this.selected.setAttribute('data-clip', 'polygon(' + clip + ')');
      var lbl = this.selected.querySelector('.hs-edit-label');
      if (lbl) { var c = centroid(this.selectedData.points); lbl.setAttribute('x', c[0]); lbl.setAttribute('y', c[1]); }
    },

    save: function () {
      try { localStorage.setItem('clockmaker_hotspots_v1', JSON.stringify(window.HOTSPOTS)); } catch (e) {}
    },
    export: function () {
      var json = JSON.stringify(window.HOTSPOTS, null, 2);
      this.save();
      function fb() { var ta = document.createElement('textarea'); ta.value = json; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); window.alert('已复制到剪贴板'); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).then(function () { window.alert('热点JSON已复制，并已保存到 localStorage'); }, fb);
      else fb();
    }
  };

  /* ---------- 几何工具 ---------- */
  function centroid(pts) { var x = 0, y = 0; for (var i = 0; i < pts.length; i++) { x += pts[i][0]; y += pts[i][1]; } return [x / pts.length, y / pts.length]; }
  function distToSeg(p, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var l2 = dx * dx + dy * dy;
    if (!l2) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    var t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  }
  function douglasPeucker(pts, eps) {
    if (pts.length < 3) return pts;
    var dmax = 0, index = 0, first = pts[0], last = pts[pts.length - 1];
    for (var i = 1; i < pts.length - 1; i++) { var d = distToSeg(pts[i], first, last); if (d > dmax) { dmax = d; index = i; } }
    if (dmax > eps) {
      var r1 = douglasPeucker(pts.slice(0, index + 1), eps), r2 = douglasPeucker(pts.slice(index), eps);
      return r1.slice(0, -1).concat(r2);
    }
    return [first, last];
  }
  function floodFill(data, w, h, sx, sy, tol) {
    var mask = new Uint8Array(w * h);
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return mask;
    var si = (sy * w + sx) * 4;
    var r0 = data[si], g0 = data[si + 1], b0 = data[si + 2];
    var q = [[sx, sy]]; mask[sy * w + sx] = 1;
    var tol2 = tol * tol;
    while (q.length) {
      var c = q.pop(), x = c[0], y = c[1];
      var n = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
      for (var k = 0; k < 4; k++) {
        var nx = n[k][0], ny = n[k][1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (mask[ny * w + nx]) continue;
        var ii = (ny * w + nx) * 4;
        var dr = data[ii] - r0, dg = data[ii + 1] - g0, db = data[ii + 2] - b0;
        if (dr * dr + dg * dg + db * db <= tol2) { mask[ny * w + nx] = 1; q.push([nx, ny]); }
      }
    }
    return mask;
  }
  function outline(mask, w, h) {
    var pts = [];
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      var edge = false;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
      else if (!mask[y * w + x - 1] || !mask[y * w + x + 1] || !mask[(y - 1) * w + x] || !mask[(y + 1) * w + x]) edge = true;
      if (edge) pts.push([x, y]);
    }
    if (pts.length < 3) return pts;
    var c = centroid(pts);
    pts.sort(function (a, b) { return Math.atan2(a[1] - c[1], a[0] - c[0]) - Math.atan2(b[1] - c[1], b[0] - c[0]); });
    var step = Math.max(1, Math.floor(pts.length / 80));
    var sampled = [];
    for (var i = 0; i < pts.length; i += step) sampled.push(pts[i]);
    if (sampled.length > 1) sampled.push(pts[0]);
    return sampled;
  }

  // 双击闭合多边形
  window.addEventListener('dblclick', function (e) {
    if (Editor.on && Editor.mode === 'poly' && Editor.drawPts.length >= 3) Editor.finishDraw();
  });

  window.Scene = { render: render, toggleHighlight: toggleHighlight, onKey: onKey, Editor: Editor };
})();