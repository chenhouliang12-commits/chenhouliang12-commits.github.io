'use strict';

/* ============================================================
   data.js —— 数据层：物品 / 答案 / 提示 / 房间场景 / 选择器选项
   换主题时主要修改本文件即可。
   ============================================================ */

/* ---------- 房间名称 ---------- */
window.ROOM_NAMES = { foyer: '前厅工坊', basement: '地下储藏室', attic: '阁楼钟塔' };
window.ROOM_SUB = { foyer: '炉火未熄，钟声已停', basement: '潮湿的石阶通往更深处', attic: '月光从彩窗洒落' };

/* ---------- 物品 ---------- */
window.ITEMS = {
  letter: {
    id: 'letter', name: '委托信', category: 'note',
    desc: '一封火漆封口的委托信，请你取回老钟表匠的传世怀表。背面有一行小字：那朵花下，藏着你离开这里的第一把钥匙。',
    icon: '📜'
  },
  brass_key: {
    id: 'brass_key', name: '黄铜钥匙', category: 'key',
    desc: '一把沉甸甸的黄铜钥匙，齿纹简单，像是开某扇旧门用的。',
    icon: '🗝️'
  },
  winding_key: {
    id: 'winding_key', name: '发条钥匙', category: 'tool',
    desc: '一把铜质发条钥匙，正好能插进落地座钟侧面的发条孔。',
    icon: '🔑'
  },
  old_photo: {
    id: 'old_photo', name: '老照片', category: 'clue',
    desc: '一张泛黄的老照片，拍的是钟塔上的星盘。星盘的月相依次是：新月、上弦月、满月、下弦月。',
    icon: '🖼️'
  },
  copper_gear_a: {
    id: 'copper_gear_a', name: '铜齿轮A', category: 'gear',
    desc: '一枚较大的铜齿轮，齿面刻着「A」，是驱动钟塔机关的关键零件。',
    icon: '⚙️'
  },
  tweezers: {
    id: 'tweezers', name: '尖头镊子', category: 'tool',
    desc: '一把尖头镊子，能伸进细小的缝隙里撬开卡死的东西。',
    icon: '🤏'
  },
  old_watch: {
    id: 'old_watch', name: '旧怀表', category: 'part',
    desc: '一只锈住的旧怀表，表盖卡得死死的，得用件尖细的工具撬开。',
    icon: '⌚'
  },
  film: {
    id: 'film', name: '微型胶卷', category: 'clue',
    desc: '一小段微型胶卷，对着光能看清上面的月相顺序：新月 → 上弦月 → 满月 → 下弦月。',
    icon: '🎞️'
  },
  attic_key: {
    id: 'attic_key', name: '阁楼钥匙', category: 'key',
    desc: '一把细长的阁楼钥匙，齿纹精致，能启动通往钟塔的楼梯机关。',
    icon: '🔑'
  },
  polish: {
    id: 'polish', name: '金属抛光剂', category: 'tool',
    desc: '一瓶金属抛光剂，能把暗沉的铜面擦得锃亮。',
    icon: '🧴'
  },
  copper_gear_b: {
    id: 'copper_gear_b', name: '铜齿轮B', category: 'gear',
    desc: '一枚稍小的铜齿轮，齿面刻着「B」。',
    icon: '⚙️'
  },
  heirloom_watch: {
    id: 'heirloom_watch', name: '传世怀表', category: 'part',
    desc: '修复好的传世怀表，正在掌心安静地走着。它属于前厅那个空着的展台。',
    icon: '⌚'
  }
};

/* ---------- 谜题答案 ---------- */
window.ANSWERS = {
  drawer: '0315',
  lampOrder: ['gas_left', 'gas_right', 'gas_middle'],
  toolbox: ['sun', 'moon', 'star', 'cloud'],
  portraits: { eldest: 'caliper', middle: 'screwdriver', youngest: 'magnifier' },
  moon: ['new', 'waxing', 'full', 'waning'],
  gears: ['a', 'b']
};

/* ---------- 分级提示（每谜题 3 级） ---------- */
window.HINTS = {
  p1_vase: ['委托信的背面好像写了什么，翻过来看看。', '信上提到“那朵花”——前厅窗台上有一盆花。', '挪开窗台的花瓶，钥匙就在底下。'],
  p2_drawer: ['工作台上有一张旧日历，墙上的挂钟也停在一个时间。', '日历写着 3 月 15 日，挂钟停在 3:15。', '四位密码是 0315。'],
  p3_clock: ['落地座钟的发条孔是空的，需要一把发条钥匙。', '发条钥匙在带锁的抽屉里。', '用发条钥匙点击落地座钟，它会掉出铜齿轮A。'],
  p4_lamps: ['储藏室入口有张纸条，写着点灯的顺序。', '顺序是左、右、中。', '依次点击 左 → 右 → 中 三盏煤气灯。'],
  p5_toolbox: ['工具墙上贴着四张图纸，每张有一个罗马数字和一个图案。', '顺序是 Ⅰ太阳、Ⅱ月亮、Ⅲ星星、Ⅳ云朵。', '按 太阳 → 月亮 → 星星 → 云朵 输入符号锁。'],
  p6_watch: ['旧怀表锈住了，需要一件尖细的工具。', '工具箱里有一把尖头镊子。', '在背包里选中镊子，再点旧怀表组合。'],
  p7_portraits: ['储藏室桌上的账本写了三句话，是三兄弟的线索。', '幼子喜欢细小零件（放大镜）；长子不是螺丝刀；次子不是放大镜。', '长子=游标卡尺，次子=螺丝刀，幼子=放大镜。'],
  p8_moon: ['阁楼的星盘需要月相顺序，线索藏在老照片和胶卷里。', '老照片和微型胶卷都印着同一个月相顺序。', '顺序是 新月 → 上弦月 → 满月 → 下弦月。'],
  p9_gears: ['机芯旁写着安装要求，看清楚是“先大后小”。', '铜齿轮A较大，铜齿轮B较小。', '槽1放A，槽2放B。'],
  p10_return: ['石碑上的遗言说：带走怀表的人会被困住。', '前厅的怀表展台一直空着，写着“这里少了一块表”。', '回到前厅，把传世怀表放回展台。']
};

/* ---------- 选择器选项 ---------- */
window.TOOLBOX_SYMBOLS = [
  { id: 'sun', label: '太阳', icon: '☀️' },
  { id: 'moon', label: '月亮', icon: '🌙' },
  { id: 'star', label: '星星', icon: '⭐' },
  { id: 'cloud', label: '云朵', icon: '☁️' }
];
window.MOON_PHASES = [
  { id: 'new', label: '新月', icon: '🌑' },
  { id: 'waxing', label: '上弦月', icon: '🌓' },
  { id: 'full', label: '满月', icon: '🌕' },
  { id: 'waning', label: '下弦月', icon: '🌗' }
];
window.PORTRAIT_TOOLS = [
  { id: 'caliper', label: '游标卡尺', icon: '📏' },
  { id: 'screwdriver', label: '螺丝刀', icon: '🪛' },
  { id: 'magnifier', label: '放大镜', icon: '🔍' }
];

/* ---------- 热点（物体轮廓多边形，图片像素坐标） ---------- */
window.HOTSPOTS = {
  "foyer": [
    {
      "id": "exit_door",
      "label": "大门",
      "points": [
        [
          120,
          132
        ],
        [
          388,
          132
        ],
        [
          388,
          868
        ],
        [
          120,
          868
        ]
      ]
    },
    {
      "id": "coat_rack",
      "label": "衣帽架",
      "points": [
        [
          425,
          155
        ],
        [
          545,
          168
        ],
        [
          540,
          522
        ],
        [
          402,
          522
        ],
        [
          410,
          190
        ]
      ]
    },
    {
      "id": "window_vase",
      "label": "窗台花盆",
      "points": [
        [
          530,
          46
        ],
        [
          882,
          46
        ],
        [
          882,
          474
        ],
        [
          530,
          474
        ]
      ]
    },
    {
      "id": "wall_clock",
      "label": "挂钟",
      "points": [
        [
          1163,
          18
        ],
        [
          1245,
          48
        ],
        [
          1280,
          130
        ],
        [
          1245,
          212
        ],
        [
          1163,
          242
        ],
        [
          1081,
          212
        ],
        [
          1046,
          130
        ],
        [
          1081,
          48
        ]
      ]
    },
    {
      "id": "tool_wall",
      "label": "工具墙",
      "points": [
        [
          1292,
          60
        ],
        [
          1620,
          60
        ],
        [
          1620,
          430
        ],
        [
          1292,
          430
        ]
      ]
    },
    {
      "id": "floor_clock",
      "label": "落地座钟",
      "points": [
        [
          936,
          150
        ],
        [
          1044,
          150
        ],
        [
          1060,
          172
        ],
        [
          1090,
          196
        ],
        [
          1090,
          768
        ],
        [
          888,
          768
        ],
        [
          888,
          196
        ],
        [
          920,
          172
        ]
      ]
    },
    {
      "id": "storage_door",
      "label": "地下室门",
      "points": [
        [
          1334,
          384
        ],
        [
          1596,
          384
        ],
        [
          1596,
          786
        ],
        [
          1334,
          786
        ]
      ]
    },
    {
      "id": "workbench",
      "label": "工作台",
      "points": [
        [510,470],
        [980,470],
        [980,548],
        [510,548]
      ]
    },
    {
      "id": "drawer",
      "label": "上锁抽屉",
      "points": [
        [640,540],
        [810,540],
        [810,640],
        [640,640]
      ]
    },
    {
      "id": "display_stand",
      "label": "怀表展台",
      "points": [
        [
          420,
          340
        ],
        [
          530,
          350
        ],
        [
          548,
          520
        ],
        [
          520,
          675
        ],
        [
          470,
          730
        ],
        [
          420,
          675
        ],
        [
          400,
          480
        ]
      ]
    },
    {
      "id": "rug",
      "label": "地毯",
      "points": [
        [
          830,
          788
        ],
        [
          1060,
          802
        ],
        [
          1235,
          846
        ],
        [
          1292,
          892
        ],
        [
          1150,
          930
        ],
        [
          830,
          938
        ],
        [
          512,
          930
        ],
        [
          376,
          892
        ],
        [
          432,
          846
        ],
        [
          608,
          802
        ]
      ]
    }
  ],
  "basement": [
    {
      "id": "stair_entrance",
      "label": "回前厅",
      "points": [
        [
          0,
          80
        ],
        [
          210,
          80
        ],
        [
          210,
          820
        ],
        [
          0,
          820
        ]
      ]
    },
    {
      "id": "attic_stairs",
      "label": "阁楼楼梯",
      "points": [
        [
          1505,
          340
        ],
        [
          1662,
          340
        ],
        [
          1662,
          930
        ],
        [
          1505,
          930
        ]
      ]
    },
    {
      "id": "drawing_wall",
      "label": "四张图纸",
      "points": [
        [
          560,
          215
        ],
        [
          875,
          215
        ],
        [
          875,
          465
        ],
        [
          560,
          465
        ]
      ]
    },
    {
      "id": "toolbox",
      "label": "带锁工具箱",
      "points": [
        [
          212,
          530
        ],
        [
          495,
          530
        ],
        [
          495,
          788
        ],
        [
          212,
          788
        ]
      ]
    },
    {
      "id": "chem_table",
      "label": "实验桌",
      "points": [
        [
          525,
          505
        ],
        [
          1018,
          505
        ],
        [
          1018,
          778
        ],
        [
          525,
          778
        ]
      ]
    },
    {
      "id": "portraits",
      "label": "三兄弟画像",
      "points": [
        [
          1008,
          175
        ],
        [
          1318,
          175
        ],
        [
          1318,
          298
        ],
        [
          1008,
          298
        ]
      ]
    },
    {
      "id": "copper_mirror",
      "label": "蒙尘铜镜",
      "points": [
        [
          945,
          248
        ],
        [
          988,
          272
        ],
        [
          995,
          320
        ],
        [
          968,
          358
        ],
        [
          925,
          358
        ],
        [
          898,
          320
        ],
        [
          905,
          272
        ]
      ]
    },
    {
      "id": "gas_left",
      "label": "煤气灯",
      "points": [
        [
          438,
          275
        ],
        [
          535,
          275
        ],
        [
          535,
          425
        ],
        [
          438,
          425
        ]
      ]
    },
    {
      "id": "gas_middle",
      "label": "煤气灯",
      "points": [
        [
          1320,
          285
        ],
        [
          1400,
          285
        ],
        [
          1400,
          420
        ],
        [
          1320,
          420
        ]
      ]
    },
    {
      "id": "gas_right",
      "label": "煤气灯",
      "points": [
        [
          1572,
          200
        ],
        [
          1668,
          200
        ],
        [
          1668,
          322
        ],
        [
          1572,
          322
        ]
      ]
    },
    {
      "id": "entry_note",
      "label": "墙上的纸条",
      "points": [
        [
          1110,
          315
        ],
        [
          1270,
          320
        ],
        [
          1255,
          470
        ],
        [
          1120,
          465
        ]
      ]
    },
    {
      "id": "watch_stand",
      "label": "旧怀表",
      "points": [
        [
          578,
          418
        ],
        [
          690,
          418
        ],
        [
          690,
          560
        ],
        [
          578,
          560
        ]
      ]
    },
    {
      "id": "ledger",
      "label": "账本",
      "points": [
        [
          745,
          505
        ],
        [
          860,
          505
        ],
        [
          860,
          568
        ],
        [
          745,
          568
        ]
      ]
    }
  ],
  "attic": [
    {
      "id": "stair_down",
      "label": "回储藏室",
      "points": [[0,220],[170,245],[188,880],[160,939],[0,939]]
    },
    {
      "id": "attic_window",
      "label": "天窗",
      "points": [[1040,0],[1360,0],[1360,320],[1280,350],[1100,340],[1040,300]]
    },
    {
      "id": "star_lock",
      "label": "星盘机关",
      "points": [[815,245],[1000,300],[1090,430],[1080,650],[965,810],[760,835],[575,735],[535,560],[580,350]]
    },
    {
      "id": "gear_mechanism",
      "label": "齿轮机芯",
      "points": [[350,145],[620,150],[680,300],[635,490],[470,515],[350,430]]
    },
    {
      "id": "epitaph",
      "label": "遗言石碑",
      "points": [[1250,330],[1460,300],[1535,400],[1520,690],[1430,760],[1260,735]]
    }
  ]
};

window.HOTSPOT_FLAG = {
  "window_vase": "vaseMoved",
  "drawer": "drawerOpened",
  "floor_clock": "clockWound",
  "storage_door": "storageOpen",
  "toolbox": "toolboxOpened",
  "watch_stand": "oldWatchTaken",
  "portraits": "portraitsSolved",
  "copper_mirror": "mirrorPolished",
  "attic_stairs": "atticOpen",
  "star_lock": "starLockOpened",
  "gear_mechanism": "gearsInstalled",
  "display_stand": "watchReturned"
};
