'use strict';

/* ============================================================
 * 引擎：状态管理 / 存档 / 交互 / 谜题判定 / 房间切换 / 结局
 * ============================================================ */

const SAVE_KEY = 'clockmaker_escape_v1';

window.Engine = (function () {
  const state = {
    currentRoom: 'foyer',
    inventory: ['letter'],
    selectedItem: null,
    lampLit: [],
    flags: {},
    notes: [],
    hints: {},
    hintCount: 0,
    elapsedMs: 0,
    lastTick: 0,
    ended: false,
    saveTime: 0
  };

  function freshFlags() {
    return {
      vaseMoved: false, drawerOpened: false, clockWound: false, storageOpen: false,
      lightsOn: false, toolboxOpened: false, oldWatchTaken: false, watchOpened: false,
      portraitsSolved: false, mirrorPolished: false, atticOpen: false,
      starLockOpened: false, gearsInstalled: false, watchReturned: false
    };
  }

  function tick() {
    const now = Date.now();
    if (state.lastTick) state.elapsedMs += Math.max(0, now - state.lastTick);
    state.lastTick = now;
  }

  function save() {
    tick();
    state.saveTime = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  function lastSaveTime() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return 0;
      const s = JSON.parse(raw);
      return s.saveTime || 0;
    } catch (e) { return 0; }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      Object.assign(state, s);
      state.lastTick = Date.now();
      state.flags = Object.assign(freshFlags(), s.flags || {});
      return true;
    } catch (e) { return false; }
  }

  function newGame() {
    Object.assign(state, {
      currentRoom: 'foyer',
      inventory: ['letter'],
      selectedItem: null,
      lampLit: [],
      flags: freshFlags(),
      notes: ['委托信：取回已故老钟表匠的传世怀表。'],
      hints: {},
      hintCount: 0,
      elapsedMs: 0,
      lastTick: Date.now(),
      ended: false
    });
    save();
  }

  function has(id) { return state.inventory.indexOf(id) !== -1; }

  function addItem(id) {
    if (has(id)) return;
    if (state.inventory.length >= 8) {
      UI.showDialog('背包满了，先把不用的东西放下吧。');
      return;
    }
    state.inventory.push(id);
    save();
    UI.renderInventory();
  }

  function removeItem(id) {
    const i = state.inventory.indexOf(id);
    if (i !== -1) state.inventory.splice(i, 1);
    if (state.selectedItem === id) state.selectedItem = null;
    save();
    UI.renderInventory();
  }

  function addNote(text) {
    if (state.notes.indexOf(text) !== -1) return;
    state.notes.push(text);
    save();
  }

  function msg(text) { UI.showDialog(text); }

  function goToRoom(roomId) {
    state.currentRoom = roomId;
    state.selectedItem = null;
    save();
    UI.renderRoom();
  }

  function getHint(puzzleId) {
    const arr = HINTS[puzzleId];
    if (!arr) return null;
    const used = state.hints[puzzleId] || 0;
    if (used >= arr.length) return null;
    state.hints[puzzleId] = used + 1;
    state.hintCount += 1;
    save();
    return arr[used];
  }

  /* ---------- 灯谜（顺序机关） ---------- */
  function handleLamp(id) {
    if (state.flags.lightsOn) { msg('三盏灯都已经亮了。'); return; }
    if (state.lampLit.indexOf(id) !== -1) { msg('这盏灯已经亮了。'); return; }
    const expected = ANSWERS.lampOrder[state.lampLit.length];
    if (id === expected) {
      state.lampLit.push(id);
      AudioFX.click();
      if (state.lampLit.length === 3) {
        state.flags.lightsOn = true;
        AudioFX.unlock();
        addNote('储藏室的三盏煤气灯全部点亮。');
        save();
        UI.renderRoom();
        msg('三盏灯依次亮起，整个储藏室明亮了起来。');
      } else {
        msg('这盏灯亮了。');
      }
    } else {
      state.lampLit = [];
      AudioFX.error();
      save();
      UI.renderRoom();
      msg('灯芯闪了几下又灭了，点灯的顺序似乎不对。');
    }
  }

  /* ---------- 点击热点 ---------- */
  function click(hotspotId) {
    AudioFX.click();
    const f = state.flags;
    switch (hotspotId) {
      /* 前厅 */
      case 'exit_door':
        if (f.watchReturned) ending();
        else msg('大门从外面锁死了。门板上刻着一行字：把时间放回原处。');
        break;
      case 'coat_rack': msg('一件旧大衣挂在衣架上，口袋空空，只有淡淡的樟脑味。'); break;
      case 'window_vase':
        if (!f.vaseMoved) {
          f.vaseMoved = true;
          addItem('brass_key');
          addNote('花瓶下找到一把黄铜钥匙。');
          AudioFX.pickup();
          save();
          msg('你挪开花瓶，底下藏着一把黄铜钥匙。');
        } else msg('花瓶已经挪开了，只剩一捧早已干枯的花。');
        break;
      case 'workbench':
        addNote('工作台压着一张 3 月 15 日的旧日历。');
        msg('工作台凌乱不堪，压着一张 3 月 15 日的旧日历。');
        break;
      case 'drawer':
        if (f.drawerOpened) msg('抽屉已经打开，里面空了。');
        else UI.openPasswordModal(function () {
          f.drawerOpened = true;
          addItem('winding_key');
          addItem('old_photo');
          addNote('抽屉里找到发条钥匙和一张老照片。');
          AudioFX.unlock();
          save();
          msg('锁开了。抽屉里有一把发条钥匙和一张老照片。');
        });
        break;
      case 'wall_clock': msg('挂钟的指针停在 3:15，秒针轻轻颤动，像在等待什么。'); break;
      case 'floor_clock':
        if (has('winding_key')) msg('落地座钟已经停摆。在背包里选中发条钥匙，再点击座钟给它上发条。');
        else msg('一座高大的落地座钟，已经完全停摆，发条孔空空如也。');
        break;
      case 'display_stand': msg('一只空空的怀表展台，底座刻着：这里少了一块表。'); break;
      case 'tool_wall': msg('墙上挂满镊子、扳手、游标卡尺，最顺手的几件早已被人拿走。'); break;
      case 'storage_door':
        if (f.storageOpen) goToRoom('basement');
        else msg('通往地下的门锁着，需要一把钥匙。');
        break;
      case 'rug': msg('你掀开地毯，下面只有积年的灰尘和几枚旧螺丝。'); break;

      /* 地下储藏室 */
      case 'stair_entrance': goToRoom('foyer'); break;
      case 'entry_note':
        addNote('点灯顺序：左 → 右 → 中。');
        msg('纸条上写着：灯的顺序是左、右、中。');
        break;
      case 'gas_left': case 'gas_right': case 'gas_middle': handleLamp(hotspotId); break;
      case 'drawing_wall':
        addNote('四张图纸：Ⅰ太阳、Ⅱ月亮、Ⅲ星星、Ⅳ云朵。');
        msg('工具墙上贴着四张泛黄图纸，分别标着：Ⅰ太阳、Ⅱ月亮、Ⅲ星星、Ⅳ云朵。');
        break;
      case 'toolbox':
        if (f.toolboxOpened) msg('工具箱已经打开了。');
        else UI.openSymbolModal(function () {
          f.toolboxOpened = true;
          addItem('tweezers');
          AudioFX.unlock();
          save();
          msg('锁开了，里面有一把尖头镊子。');
        });
        break;
      case 'watch_stand':
        if (f.oldWatchTaken) msg('旧怀表架已经空了。');
        else {
          f.oldWatchTaken = true;
          addItem('old_watch');
          addNote('拿到一只锈住的旧怀表。');
          AudioFX.pickup();
          save();
          msg('你拿起旧怀表，外壳锈住了，怎么也打不开。');
        }
        break;
      case 'chem_table': msg('实验桌上摆着三瓶试剂，标签模糊，已经派不上用场。'); break;
      case 'ledger':
        addNote('账本：长子不是螺丝刀；次子不是放大镜；幼子喜欢看细小零件。');
        msg('账本上写着三句话：长子不是螺丝刀；次子不是放大镜；幼子喜欢看细小零件。');
        break;
      case 'portraits':
        if (f.portraitsSolved) msg('三兄弟画像各归其位，神情安详。');
        else UI.openPortraitModal(function () {
          f.portraitsSolved = true;
          addItem('polish');
          AudioFX.unlock();
          save();
          msg('画像背后弹开一个小格，里面有一瓶金属抛光剂。');
        });
        break;
      case 'copper_mirror': msg('一面蒙尘的铜镜，表面灰暗，照不清任何东西。'); break;
      case 'attic_stairs':
        if (f.atticOpen) goToRoom('attic');
        else if (has('attic_key') && has('copper_gear_a') && has('copper_gear_b')) {
          f.atticOpen = true;
          removeItem('attic_key');
          AudioFX.unlock();
          save();
          msg('你装好齿轮、转动阁楼钥匙，通往钟塔的楼梯缓缓落下。');
          goToRoom('attic');
        } else msg('楼梯机关需要阁楼钥匙，以及两个铜齿轮才能启动。');
        break;

      /* 阁楼钟塔 */
      case 'stair_down': goToRoom('basement'); break;
      case 'attic_window': msg('天窗外的月光洒进来，正好落在星盘上。'); break;
      case 'star_lock':
        if (f.starLockOpened) msg('星盘机关已经打开。');
        else UI.openMoonModal(function () {
          f.starLockOpened = true;
          addItem('heirloom_watch');
          addNote('星盘开启，得到传世怀表。');
          AudioFX.unlock();
          save();
          msg('星盘缓缓开启，传世怀表就躺在中央。');
        });
        break;
      case 'gear_mechanism':
        if (f.gearsInstalled) msg('齿轮机芯正平稳地转动着。');
        else UI.openGearModal(function () {
          f.gearsInstalled = true;
          addNote('钟塔启动，石碑显现遗言。');
          AudioFX.unlock();
          save();
          msg('机芯开始转动，钟声在塔内回荡。石碑上的字迹亮了起来。');
        });
        break;
      case 'epitaph':
        if (f.gearsInstalled) {
          addNote('遗言：带走怀表的人将被困住，把它放回前厅展台。');
          msg('石碑写着：带走怀表的人，将被困在这座工坊。把它放回它原来的位置，门才会开。');
        } else msg('石碑上的字被阴影遮住，需要先让钟塔运转起来。');
        break;

      default: msg('这里没什么特别的。');
    }
  }

  /* ---------- 使用选中物品 ---------- */
  function useSelectedOn(hotspotId) {
    const item = state.selectedItem;
    if (!item) { msg('先在背包里选一件物品。'); return; }
    const key = item + '@' + hotspotId;

    if (key === 'winding_key@floor_clock') {
      if (state.flags.clockWound) msg('座钟已经在走动了。');
      else {
        state.flags.clockWound = true;
        removeItem('winding_key');
        addItem('copper_gear_a');
        addNote('座钟开始走动，掉出铜齿轮A。');
        AudioFX.unlock();
        save();
        msg('你给座钟上紧发条。钟摆摆动起来，一个小齿轮「当啷」掉在地上——是铜齿轮A。');
      }
      return;
    }
    if (key === 'brass_key@storage_door') {
      if (state.flags.storageOpen) msg('门已经开了。');
      else {
        state.flags.storageOpen = true;
        removeItem('brass_key');
        AudioFX.unlock();
        save();
        msg('黄铜钥匙转动锁芯，通往地下的门开了。');
        goToRoom('basement');
      }
      return;
    }
    if (key === 'heirloom_watch@display_stand') {
      if (state.flags.watchReturned) msg('怀表已经归位了。');
      else {
        state.flags.watchReturned = true;
        removeItem('heirloom_watch');
        AudioFX.win();
        save();
        ending();
      }
      return;
    }
    if (key === 'polish@copper_mirror') {
      if (state.flags.mirrorPolished) msg('铜镜已经锃亮了。');
      else {
        state.flags.mirrorPolished = true;
        removeItem('polish');
        addItem('copper_gear_b');
        addNote('擦亮铜镜后，在暗格里找到铜齿轮B。');
        AudioFX.unlock();
        save();
        msg('你擦亮铜镜，镜面后竟藏着一个暗格，里面是铜齿轮B。');
      }
      return;
    }
    msg('这样用似乎没有效果。');
  }

  /* ---------- 道具组合 ---------- */
  function combine(a, b) {
    if ((a === 'tweezers' && b === 'old_watch') || (a === 'old_watch' && b === 'tweezers')) {
      if (state.flags.watchOpened) { msg('怀表已经拆开了。'); return; }
      state.flags.watchOpened = true;
      removeItem('tweezers');
      removeItem('old_watch');
      addItem('film');
      addItem('attic_key');
      addNote('撬开旧怀表：里面是微型胶卷和阁楼钥匙。');
      AudioFX.unlock();
      save();
      msg('你用镊子撬开怀表，里面藏着一小段微型胶卷和一把细长的阁楼钥匙。');
      return;
    }
    AudioFX.error();
    msg('这两件东西互相看了一眼，决定不要在一起。');
  }

  /* ---------- 结局与评级 ---------- */
  function ending() {
    tick();
    state.ended = true;
    save();
    const minutes = state.elapsedMs / 60000;
    const h = state.hintCount;
    let rating;
    if (minutes < 15 && h <= 3) rating = 'S';
    else if (minutes < 25 && h <= 6) rating = 'A';
    else if (minutes < 40 && h <= 10) rating = 'B';
    else rating = 'C';
    UI.showEnding(rating, minutes, h);
  }

  /* ---------- 调试面板 ---------- */
  function debugGive(id) { addItem(id); }
  function debugJump(roomId) { goToRoom(roomId); }
  function debugAnswers() {
    return {
      drawer: ANSWERS.drawer,
      lamps: ANSWERS.lampOrder.join('→'),
      toolbox: ANSWERS.toolbox.join('→'),
      portraits: '长子=游标卡尺，次子=螺丝刀，幼子=放大镜',
      moon: ANSWERS.moon.join('→'),
      gears: '先A后B（大→小）',
      finale: '把传世怀表放回前厅展台'
    };
  }

  return {
    state, newGame, load, save, hasSave,
    has, addItem, removeItem, addNote, getHint,
    click, useSelectedOn, combine, goToRoom, ending,
    debugGive, debugJump, debugAnswers, lastSaveTime
  };
})();