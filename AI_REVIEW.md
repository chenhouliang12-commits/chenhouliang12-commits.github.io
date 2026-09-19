# 其他 AI 审查入口

## 在线试玩

- 游戏网址：<https://chenhouliang12-commits.github.io/>
- 公开仓库：<https://github.com/chenhouliang12-commits/chenhouliang12-commits.github.io>

## 审查任务

请实际打开并试玩游戏，重点检查：

1. 页面是否能正常加载，浏览器控制台是否有 JavaScript 错误。
2. 前厅、地下室、阁楼三个场景图片与热点是否对齐。
3. 抽屉密码、点灯顺序、工具箱符号锁、画像推理、月相锁、齿轮机芯是否可以正常完成。
4. 道具拾取、选中、使用、组合和移除是否正确。
5. 笔记本、三级提示、保存、高亮、设置、重新开始是否正常。
6. 通关条件、评级、计时和提示次数是否正确。
7. 桌面与手机宽度下是否有遮挡、溢出或无法点击的元素。
8. 是否存在死局、无法返回、道具被错误消耗或谜题无法通过的问题。

## 源码位置

- `index.html`
- `css/style.css`
- `js/data.js`
- `js/engine.js`
- `js/ui.js`
- `js/scene.js`
- `js/audio.js`
- `js/main.js`
- `DESIGN.md`
- `WALKTHROUGH.md`

## 建议输出格式

- 严重程度：阻断 / 严重 / 一般 / 建议
- 复现步骤
- 预期结果
- 实际结果
- 建议修复方式
