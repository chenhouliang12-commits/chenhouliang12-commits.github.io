'use strict';

/* ============================================================
 * UI：渲染 / 对话框 / 背包 / 各谜题输入弹窗 / 笔记本 / 提示 / 设置 / 结局
 * ============================================================ */

window.UI = (function () {
  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  /* ---------- 基础弹层 ---------- */
  function openModal(contentEl, title) {
    const mask = $('#modal');
    mask.innerHTML = '';
    const box = el('div', 'modal-box');
    const head = el('div', 'modal-head');
    head.innerHTML = '<span>' + (title || '') + '</span><button class="modal-close">✕</button>';
    box.appendChild(head);
    box.appendChild(contentEl);
    mask.appendChild(box);
    mask.classList.remove('hidden');
    mask.querySelector('.modal-close').addEventListener('click', closeModal);
    mask.addEventListener('click', function (e) { if (e.target === mask) closeModal(); });
  }
  function closeModal() {
    const mask = $('#modal');
    mask.classList.add('hidden');
    mask.innerHTML = '';
  }

  /* ---------- 对话框 ---------- */
  function showDialog(text, type) {
    const d = $('#dialog');
    d.textContent = text;
    d.className = 'dialog show ' + (type || '');
    clearTimeout(showDialog._t);
    showDialog._t = setTimeout(function () { d.classList.remove('show'); }, 7000);
  }

  /* ---------- 房间渲染 ---------- */
  function renderRoom() {
    const room = Engine.state.currentRoom;
    $('#room-title').textContent = ROOM_NAMES[room];
    $('#room-sub').textContent = ROOM_SUB[room];
    const wrap = $('#scene-wrap');
    wrap.classList.toggle('dark', room === 'basement' && !Engine.state.flags.lightsOn);
    const sceneUrl = window.SCENE_ASSETS && window.SCENE_ASSETS[room] ? window.SCENE_ASSETS[room] : new URL('assets/scenes/' + room + '.jpg', document.baseURI).href;
    wrap.style.setProperty('--scene-bg-image', "url('" + sceneUrl + "')");
    if (window.Scene) window.Scene.render(room, Engine.state);
    renderInventory();
  }

  /* ---------- 背包 ---------- */
  function renderInventory() {
    const bar = $('#inventory-bar');
    bar.innerHTML = '';
    Engine.state.inventory.forEach(function (id) {
      const it = ITEMS[id];
      if (!it) return;
      const cell = el('button', 'inv-cell' + (Engine.state.selectedItem === id ? ' selected' : ''));
      cell.innerHTML = '<span class="inv-icon">' + it.icon + '</span><span class="inv-name">' + it.name + '</span>';
      cell.addEventListener('click', function () {
        AudioFX.click();
        if (Engine.state.selectedItem === id) {
          Engine.state.selectedItem = null;
          renderInventory();
          openItemDetail(id);
        } else if (Engine.state.selectedItem) {
          const other = Engine.state.selectedItem;
          Engine.state.selectedItem = null;
          Engine.combine(other, id);
          renderInventory();
        } else {
          Engine.state.selectedItem = id;
          renderInventory();
        }
      });
      bar.appendChild(cell);
    });
    if (!Engine.state.inventory.length) {
      const empty = el('div', 'inv-empty', '背包是空的');
      bar.appendChild(empty);
    }
  }

  function openItemDetail(id) {
    const it = ITEMS[id];
    if (!it) return;
    const c = el('div', 'item-detail');
    c.innerHTML = '<div class="item-big">' + it.icon + '</div><h3>' + it.name + '</h3><p>' + it.desc + '</p>';
    openModal(c, '物品详情');
  }

  /* ---------- 谜题输入弹窗 ---------- */
  function openPasswordModal(onSuccess) {
    const c = el('div', 'puzzle-modal');
    c.innerHTML = '<p class="puzzle-tip">输入四位数字密码</p>'
      + '<input id="pwd-input" class="pwd-input" type="text" inputmode="numeric" maxlength="4" placeholder="0000">'
      + '<div class="modal-actions"><button id="pwd-ok" class="btn primary">确认</button></div>';
    openModal(c, '上锁的抽屉');
    const input = c.querySelector('#pwd-input');
    input.focus();
    c.querySelector('#pwd-ok').addEventListener('click', function () {
      if (input.value.trim() === ANSWERS.drawer) { closeModal(); onSuccess(); }
      else { AudioFX.error(); input.value = ''; input.classList.add('shake'); setTimeout(function () { input.classList.remove('shake'); }, 400); }
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') c.querySelector('#pwd-ok').click(); });
  }

  function cyclePicker(row, options, values, onUpdate) {
    let idx = 0;
    function paint() {
      values[0] = options[idx].id;
      row.querySelector('.pick-val').textContent = options[idx].icon + ' ' + options[idx].label;
    }
    row.querySelector('.pick-prev').addEventListener('click', function () { idx = (idx + options.length - 1) % options.length; paint(); onUpdate(idx); });
    row.querySelector('.pick-next').addEventListener('click', function () { idx = (idx + 1) % options.length; paint(); onUpdate(idx); });
    values[0] = options[0].id;
    paint();
  }

  function openSymbolModal(onSuccess) {
    const c = el('div', 'puzzle-modal');
    c.innerHTML = '<p class="puzzle-tip">按正确顺序选择四个符号（Ⅰ→Ⅳ）</p>';
    const vals = [];
    for (let i = 0; i < 4; i++) {
      const row = el('div', 'pick-row');
      row.innerHTML = '<button class="pick-btn pick-prev">‹</button><span class="pick-val"></span><button class="pick-btn pick-next">›</button>';
      c.appendChild(row);
      const holder = [null]; vals.push(holder);
      cyclePicker(row, TOOLBOX_SYMBOLS, holder, function () {});
    }
    const btn = el('button', 'btn primary modal-ok', '确认');
    c.appendChild(btn);
    openModal(c, '带锁工具箱');
    btn.addEventListener('click', function () {
      
      const ok = vals.every(function (h, i) { return h[0] === ANSWERS.toolbox[i]; });
      if (ok) { closeModal(); onSuccess(); }
      else { AudioFX.error(); btn.classList.add('shake'); setTimeout(function () { btn.classList.remove('shake'); }, 400); }
    });
  }

  function openMoonModal(onSuccess) {
    const c = el('div', 'puzzle-modal');
    c.innerHTML = '<p class="puzzle-tip">按顺序输入四个月相</p>';
    const vals = [];
    for (let i = 0; i < 4; i++) {
      const row = el('div', 'pick-row');
      row.innerHTML = '<button class="pick-btn pick-prev">‹</button><span class="pick-val"></span><button class="pick-btn pick-next">›</button>';
      c.appendChild(row);
      const holder = [null];
      cyclePicker(row, MOON_PHASES, holder, function () {});
      vals.push(holder);
    }
    const btn = el('button', 'btn primary modal-ok', '确认');
    c.appendChild(btn);
    openModal(c, '星盘·月相锁');
    btn.addEventListener('click', function () {
      const ok = vals.every(function (h, i) { return h[0] === ANSWERS.moon[i]; });
      if (ok) { closeModal(); onSuccess(); }
      else { AudioFX.error(); btn.classList.add('shake'); setTimeout(function () { btn.classList.remove('shake'); }, 400); }
    });
  }

  function openPortraitModal(onSuccess) {
    const c = el('div', 'puzzle-modal');
    c.innerHTML = '<p class="puzzle-tip">为三兄弟各选一件工具</p>';
    const names = [ ['eldest', '长子'], ['middle', '次子'], ['youngest', '幼子'] ];
    const holders = { eldest: [null], middle: [null], youngest: [null] };
    names.forEach(function (pair) {
      const key = pair[0], label = pair[1];
      const row = el('div', 'pick-row');
      row.innerHTML = '<span class="pick-label">' + label + '</span><button class="pick-btn pick-prev">‹</button><span class="pick-val"></span><button class="pick-btn pick-next">›</button>';
      c.appendChild(row);
      cyclePicker(row, PORTRAIT_TOOLS, holders[key], function () {});
    });
    const btn = el('button', 'btn primary modal-ok', '确认');
    c.appendChild(btn);
    openModal(c, '三兄弟画像');
    btn.addEventListener('click', function () {
      const ok = Object.keys(ANSWERS.portraits).every(function (k) { return holders[k][0] === ANSWERS.portraits[k]; });
      if (ok) { closeModal(); onSuccess(); }
      else { AudioFX.error(); btn.classList.add('shake'); setTimeout(function () { btn.classList.remove('shake'); }, 400); }
    });
  }

  function openGearModal(onSuccess) {
    const c = el('div', 'puzzle-modal');
    c.innerHTML = '<p class="puzzle-tip">按顺序安装两个齿轮（先大后小）</p>';
    const slots = [];
    const gearOptions = [ { id: 'a', label: '铜齿轮A（大）', icon: '⚙️' }, { id: 'b', label: '铜齿轮B（小）', icon: '⚙️' } ];
    for (let i = 0; i < 2; i++) {
      const row = el('div', 'pick-row');
      row.innerHTML = '<span class="pick-label">槽' + (i + 1) + '</span><button class="pick-btn pick-prev">‹</button><span class="pick-val"></span><button class="pick-btn pick-next">›</button>';
      c.appendChild(row);
      const holder = [null];
      cyclePicker(row, gearOptions, holder, function () {});
      slots.push(holder);
    }
    const btn = el('button', 'btn primary modal-ok', '确认');
    c.appendChild(btn);
    openModal(c, '齿轮机芯');
    btn.addEventListener('click', function () {
      const ok = slots[0][0] === ANSWERS.gears[0] && slots[1][0] === ANSWERS.gears[1];
      if (ok) { closeModal(); onSuccess(); }
      else { AudioFX.error(); btn.classList.add('shake'); setTimeout(function () { btn.classList.remove('shake'); }, 400); }
    });
  }

  /* ---------- 笔记本 / 提示 / 设置 ---------- */
  const PUZZLE_NAMES = {
    p1_vase: '谜题1 · 花瓶下的钥匙',
    p2_drawer: '谜题2 · 抽屉密码',
    p3_clock: '谜题3 · 修复座钟',
    p4_lamps: '谜题4 · 点亮煤气灯',
    p5_toolbox: '谜题5 · 工具箱符号锁',
    p6_watch: '谜题6 · 拆开旧怀表',
    p7_portraits: '谜题7 · 三兄弟画像',
    p8_moon: '谜题8 · 月相密码锁',
    p9_gears: '谜题9 · 齿轮机芯',
    p10_return: '谜题10 · 怀表归位'
  };

  function openNotebook() {
    const c = el('div', 'notebook');
    const list = el('div', 'note-list');
    Engine.state.notes.forEach(function (n) {
      list.appendChild(el('div', 'note-item', n));
    });
    c.appendChild(list);
    openModal(c, '📓 笔记本');
  }

  function openHints() {
    const c = el('div', 'hints');
    Object.keys(PUZZLE_NAMES).forEach(function (pid) {
      const row = el('div', 'hint-row');
      const used = Engine.state.hints[pid] || 0;
      const name = el('span', 'hint-name', PUZZLE_NAMES[pid]);
      const dots = el('span', 'hint-dots', '●●●'.slice(0, used) + '○○○'.slice(0, 3 - used));
      const btn = el('button', 'btn small', used >= 3 ? '已用尽' : '获取提示');
      btn.disabled = used >= 3;
      btn.addEventListener('click', function () {
        const h = Engine.getHint(pid);
        if (h) {
          AudioFX.click();
          const tip = el('div', 'hint-tip', '💡 ' + h);
          row.appendChild(tip);
          btn.disabled = Engine.state.hints[pid] >= 3;
          btn.textContent = Engine.state.hints[pid] >= 3 ? '已用尽' : '下一级提示';
          dots.textContent = '●●●'.slice(0, Engine.state.hints[pid]) + '○○○'.slice(0, 3 - Engine.state.hints[pid]);
        }
      });
      row.appendChild(name);
      row.appendChild(dots);
      row.appendChild(btn);
      c.appendChild(row);
    });
    openModal(c, '💡 分级提示');
  }

  function openSettings() {
    const c = el('div', 'settings');
    const row1 = el('div', 'set-row');
    row1.innerHTML = '<span>音效</span>';
    const snd = el('input');
    snd.type = 'checkbox'; snd.checked = true;
    snd.addEventListener('change', function () { AudioFX.setEnabled(snd.checked); });
    row1.appendChild(snd);

    const row2 = el('div', 'set-row');
    row2.innerHTML = '<span>环境氛围音</span>';
    const amb = el('input');
    amb.type = 'checkbox'; amb.checked = false;
    amb.addEventListener('change', function () { AudioFX.setAmbient(amb.checked); });
    row2.appendChild(amb);

    const row3 = el('div', 'set-row');
    row3.innerHTML = '<span>文字大小</span>';
    const sizes = ['small', 'medium', 'large'];
    const sizeWrap = el('div', 'size-btns');
    sizes.forEach(function (s) {
      const b = el('button', 'btn small', s === 'medium' ? '中' : (s === 'small' ? '小' : '大'));
      b.addEventListener('click', function () { document.body.dataset.text = s; });
      sizeWrap.appendChild(b);
    });
    row3.appendChild(sizeWrap);

    const row4 = el('div', 'set-row');
    row4.innerHTML = '<span>重新开始</span>';
    const restart = el('button', 'btn small danger', '重新开始');
    restart.addEventListener('click', function () {
      if (confirm('确定要重新开始吗？当前进度会被清除。')) {
        Engine.newGame();
        closeModal();
        renderRoom();
      }
    });
    row4.appendChild(restart);

    c.appendChild(row1); c.appendChild(row2); c.appendChild(row3); c.appendChild(row4);
    openModal(c, '⚙️ 设置');
  }

  /* ---------- 结局 ---------- */
  function showEnding(rating, minutes, hints) {
    const c = el('div', 'ending');
    c.innerHTML = '<div class="ending-star">' + (rating === 'S' ? '🌟' : rating === 'A' ? '✨' : rating === 'B' ? '🔔' : '🕰️') + '</div>'
      + '<h2>你逃出了午夜工坊</h2>'
      + '<p class="ending-text">怀表归位，钟声齐鸣。大门缓缓打开，天光透了进来。</p>'
      + '<div class="ending-stats">'
      + '<div><span class="stat-label">评级</span><span class="stat-val">' + rating + '</span></div>'
      + '<div><span class="stat-label">用时</span><span class="stat-val">' + Math.floor(minutes) + ' 分 ' + Math.floor((minutes % 1) * 60) + ' 秒</span></div>'
      + '<div><span class="stat-label">提示</span><span class="stat-val">' + hints + ' 次</span></div>'
      + '</div>'
      + '<button id="ending-again" class="btn primary">再玩一次</button>';
    openModal(c, '通关');
    c.querySelector('#ending-again').addEventListener('click', function () {
      closeModal();
      Engine.newGame();
      renderRoom();
    });
  }

  /* ---------- 调试面板 ---------- */
  function openDebug() {
    const c = el('div', 'debug');
    const rooms = el('div', 'debug-row');
    rooms.innerHTML = '<span>跳转房间</span>';
    ['foyer', 'basement', 'attic'].forEach(function (r) {
      const b = el('button', 'btn small', ROOM_NAMES[r]);
      b.addEventListener('click', function () { Engine.debugJump(r); closeModal(); });
      rooms.appendChild(b);
    });
    c.appendChild(rooms);

    const items = el('div', 'debug-row');
    items.innerHTML = '<span>给予物品</span>';
    Object.keys(ITEMS).forEach(function (id) {
      const b = el('button', 'btn small', ITEMS[id].icon + ITEMS[id].name);
      b.addEventListener('click', function () { Engine.debugGive(id); });
      items.appendChild(b);
    });
    c.appendChild(items);

    const ans = el('div', 'debug-row');
    const ab = el('button', 'btn small', '显示答案');
    ab.addEventListener('click', function () {
      const a = Engine.debugAnswers();
      const pre = el('pre', 'debug-ans', JSON.stringify(a, null, 2));
      c.appendChild(pre);
    });
    ans.appendChild(ab);
    c.appendChild(ans);
    openModal(c, '🔧 调试面板');
  }

  /* ---------- 初始化 ---------- */
  function init() {
    $('#btn-continue').addEventListener('click', function () {
      if (Engine.hasSave()) { Engine.load(); start(); }
      else { Engine.newGame(); start(); }
    });
    $('#btn-new').addEventListener('click', function () {
      if (Engine.hasSave() && !confirm('确定要重新开始吗？当前进度会被清除。')) return;
      Engine.newGame();
      start();
    });
    $('#btn-notebook').addEventListener('click', function () { AudioFX.click(); openNotebook(); });
    $('#btn-hint').addEventListener('click', function () { AudioFX.click(); openHints(); });
    $('#btn-settings').addEventListener('click', function () { AudioFX.click(); openSettings(); });
    $('#btn-save').addEventListener('click', function () { Engine.save(); AudioFX.click(); showDialog('进度已保存。'); });
    $('#btn-highlight').addEventListener('click', function () { AudioFX.click(); if (window.Scene) window.Scene.toggleHighlight(); });
    $('#btn-zoom').addEventListener('click', function () { AudioFX.click(); if (window.Scene) window.Scene.toggleZoom(); });
    $('#dialog').addEventListener('click', function () { this.classList.remove('show'); });

    document.addEventListener('keydown', function (e) {
      if (e.key === '~' || e.key === '`') { openDebug(); }
      if (window.Scene) window.Scene.onKey(e);
    });

    window.addEventListener('load', function () {
      if (!Engine.hasSave()) { $('#btn-continue').classList.add('disabled'); $('#btn-continue').disabled = true; }
      else {
        const t = Engine.lastSaveTime();
        if (t) {
          const d = new Date(t);
          const hh = ('0' + d.getHours()).slice(-2);
          const mm = ('0' + d.getMinutes()).slice(-2);
          $('#btn-continue').textContent = '继续游戏（' + hh + ':' + mm + ' 保存）';
        }
      }
    });
  }

  function start() {
    $('#start-screen').classList.add('hidden');
    $('#game-screen').classList.remove('hidden');
    renderRoom();
  }

  return {
    init, start, renderRoom, renderInventory,
    showDialog, openModal, closeModal, openItemDetail,
    openPasswordModal, openSymbolModal, openMoonModal, openPortraitModal, openGearModal,
    showEnding
  };
})();