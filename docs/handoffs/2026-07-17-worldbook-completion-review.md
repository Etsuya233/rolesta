[P1] ST order 与 displayIndex 被错误合并。
[codec.ts (line 215)](C:/Users/Etsuya/Programming/codex/rolesta-v2/.worktrees/chat-prompt-assembling/apps/api/src/worldbooks/adapters/silly-tavern/silly-tavern-worldbook-codec.ts:215) 优先把 displayIndex 导入为 insertionOrder；[完整文档保存 (line 107)](C:/Users/Etsuya/Programming/codex/rolesta-v2/.worktrees/chat-prompt-assembling/apps/api/src/worldbooks/application/update-worldbook-document.use-case.ts:107) 又将其重编号为数组下标；[Web Order 输入 (line 132)](C:/Users/Etsuya/Programming/codex/rolesta-v2/.worktrees/chat-prompt-assembling/apps/web/src/features/worldbooks/components/worldbook-entry-editor.tsx:132) 实际执行列表移动。ST 使用 order 决定扫描、预算、分组优先级和注入顺序，displayIndex 只负责编辑器排列。真实 ST 世界书通常同时保存两个字段，当前链路会改变语义。

[P1] Anchor/outlet 注入顺序与固定 ST 基线相反。
扫描器先按 insertionOrder 升序生成激活条目，再向 anchor 数组尾部追加，见 [worldbook-scanner.ts (line 263)](C:/Users/Etsuya/Programming/codex/rolesta-v2/.worktrees/chat-prompt-assembling/apps/api/src/worldbooks/domain/worldbook-scanner.ts:263) 和 [anchor 分组 (line 740)](C:/Users/Etsuya/Programming/codex/rolesta-v2/.worktrees/chat-prompt-assembling/apps/api/src/worldbooks/domain/worldbook-scanner.ts:740)。ST 基线按 order 降序遍历并对 outlet 使用 push，见 [world-info.js (line 4997)](C:/Users/Etsuya/Softwares/SillyTavern/public/scripts/world-info.js:4997)。多个 anchor 条目最终顺序会不同。

[P2] Trace 会把最终落选条目记录成已激活。
[evaluateEntry (line 310)](C:/Users/Etsuya/Programming/codex/rolesta-v2/.worktrees/chat-prompt-assembling/apps/api/src/worldbooks/domain/worldbook-scanner.ts:310) 在分组、概率和预算判断前写入 activated；[分组过滤 (line 396)](C:/Users/Etsuya/Programming/codex/rolesta-v2/.worktrees/chat-prompt-assembling/apps/api/src/worldbooks/domain/worldbook-scanner.ts:396) 删除候选时不追加落选原因。分组 loser 的 Trace 只显示“activated”，却不会出现在结果中，无法作为后续 Generation Debug 的可信解释记录。

[P2] 固定 ST 差异测试尚未建立。
[worldbook-scanner.spec.ts (line 11)](C:/Users/Etsuya/Programming/codex/rolesta-v2/.worktrees/chat-prompt-assembling/apps/api/src/worldbooks/domain/worldbook-scanner.spec.ts:11) 仅保存 commit 字符串并断言长度，期望结果仍由 Rolesta 测试手写。测试没有运行固定 ST 扫描器，也没有读取由该基线生成并审计过的黄金夹具，因此设计规格第 170 行尚未完成。

[P2] 完整文档 API 允许遗漏必填的 scanDepth。
[worldbook-requests.dto.ts (line 217)](C:/Users/Etsuya/Programming/codex/rolesta-v2/.worktrees/chat-prompt-assembling/apps/api/src/worldbooks/http/worldbook-requests.dto.ts:217) 对必填 nullable 字段使用 @IsOptional()，导致 undefined 也通过验证。用例随后会返回或持久化缺少该字段的 Entry，与 OpenAPI 的 required 契约不一致。

[P3] Web 新 Entry 的 depth 默认值仍为 3。
[worldbook-editor-form.ts (line 93)](C:/Users/Etsuya/Programming/codex/rolesta-v2/.worktrees/chat-prompt-assembling/apps/web/src/features/worldbooks/model/worldbook-editor-form.ts:93) 使用 3，固定 ST 基线的 DEFAULT_DEPTH 为 4。新建后切换到 atDepth 会产生不同默认行为。

## 后续处理

上述 `order/displayIndex`、Anchor 顺序、Trace、必填 `scanDepth` 和默认 depth 问题已在当前分支修正。固定 SillyTavern 黄金样本及其生成器已经补充，覆盖单轮扫描和跨轮定时效果；黄金对比进一步发现并修正了普通注入条目在相同 `order` 下的稳定顺序差异。后续以 golden spec 和当前代码为准，本文件前半部分保留为审查历史。
