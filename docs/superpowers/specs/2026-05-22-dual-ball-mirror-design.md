# 《双球镜像·同步挑战》设计文档

**日期**：2026-05-22
**平台**：抖音小游戏（竖屏）
**引擎**：团结引擎（Tuanjie）+ 原生小游戏
**MVP 范围**：3 关

---

## 1. 核心玩法定义

### 1.1 镜像方案

选定**中心对称（点反射）**：黄球位置在物理稳态下约等于蓝球关于地图中心 O(0,0) 的对称点。

**实现方式：力镜像（非位置镜像）**

玩家输入方向向量 F，每个物理帧：
```
blueRb.AddForce(+F * speed)
yellowRb.AddForce(-F * speed)
```

两球各自独立受 Tuanjie 2D Physics 约束（碰撞、摩擦、边界）。不维护 `mirrorActive` 标志，无额外状态机。

**关键推论（牺牲卡位机制的物理基础）**：蓝球被障碍阻挡时，其速度被物理引擎清零，但 `-F` 仍作用于黄球，黄球独立继续运动。这是 L2 谜题的底层原理，无需任何额外代码。

### 1.2 通关条件

| 关卡 | 条件 |
|---|---|
| L1 | 蓝球在目标洞内停留 ≥ 0.3s（力镜像下黄球自动同步进入） |
| L2 / L3 | 蓝球 **且** 黄球均在目标洞内停留 ≥ 0.3s |

### 1.3 失败与重置

无严格失败判定。玩家可：
- **长按任意位置 1.5s** → 重置本关（两球回到 SpawnPoints，障碍复位）
- **点击"看广告再试"** → 触发激励视频，看完后等效重置

---

## 2. 技术架构

### 2.1 屏幕与分辨率

- 方向：竖屏固定
- 逻辑分辨率：720 × 1280
- CanvasScaler 模式：Scale With Screen Size，Reference = 720×1280，Match = Height
- 地图区域：屏幕中央 720 × 960（上留 160px UI 栏，下留 160px 摇杆区）
- 地图逻辑坐标范围：x ∈ [-360, +360]，y ∈ [-480, +480]

### 2.2 场景结构

```
Main.unity
├── GameManager
├── UI Canvas
│   ├── HUD             ← 关卡名、计时器（L3）、重置提示
│   ├── Joystick        ← 左下角浮动摇杆
│   └── OverlayPanel    ← 过关/广告弹窗
└── LevelRoot           ← 运行时实例化关卡 Prefab 的挂载点

Levels/
├── Level_01.prefab
├── Level_02.prefab
└── Level_03.prefab
```

### 2.3 核心模块

| 模块 | 文件 | 职责 |
|---|---|---|
| `GameManager` | `GameManager.cs` | 关卡状态机（加载→游戏中→过关→下一关/重置），单例 |
| `BallController` | `BallController.cs` | 读摇杆 Direction，对蓝/黄球施加 ±F，Continuous 碰撞检测 |
| `LevelLoader` | `LevelLoader.cs` | 按索引加载 Prefab，设置两球起始位，障碍复位 |
| `JoystickInput` | `JoystickInput.cs` | 浮动摇杆，输出归一化 Vector2，死区 0.1 |
| `HoleDetector` | `HoleDetector.cs` | Trigger 追踪哪些球在洞内及停留时长，暴露 `HasBall(tag)` / `DwellTime` 供 GameManager 查询；不直接判定通关 |
| `ResetHandler` | `ResetHandler.cs` | 全屏透明 Panel 监听长按 1.5s，调用 ResetLevel() |
| `DouyinBridge` | `DouyinBridge.cs` | 封装 tt.vibrateShort / tt.shareAppMessage / 激励视频，编辑器降级 |

### 2.4 数据流

```
触摸输入
  └→ JoystickInput.Direction (Vector2)
       └→ BallController.FixedUpdate()
            ├→ blueRb.AddForce(+F)
            └→ yellowRb.AddForce(-F)
                 └→ Tuanjie 2D Physics 帧模拟
                      └→ HoleDetector（每洞一个，追踪球停留状态）
                           └→ GameManager.Update() 轮询所有 Detector
                                └→ 通关条件满足（单洞双球 or 双洞各一球）
                                     └→ GameManager.OnLevelComplete()
                                          ├→ DouyinBridge.Vibrate()
                                          ├→ UI 过关动画
                                          └→ DouyinBridge.ShowShareButton()
```

---

## 3. 关卡数据结构

### 3.1 LevelData ScriptableObject

```csharp
[CreateAssetMenu(menuName = "DualBall/LevelData")]
public class LevelData : ScriptableObject {
    public int levelIndex;
    public string prefabPath;
    public bool requireBothBalls;
    public float holeDwellTime = 0.3f;
    public float timeLimitSeconds;   // 0 = 无限制
}
```

### 3.2 关卡 Prefab 层级

```
Level_XX.prefab
├── Boundary              ← CompositeCollider2D 四面围墙
├── Holes/
│   ├── Hole_A            ← CircleCollider2D(isTrigger) + HoleDetector
│   └── [Hole_B]          ← L3 双洞时使用
├── Obstacles/
│   ├── StaticObstacle    ← BoxCollider2D 或 CircleCollider2D
│   └── MovingObstacle    ← BoxCollider2D + MovingObstacleController（L3）
└── SpawnPoints/
    ├── BlueBallSpawn
    └── YellowBallSpawn
```

---

## 4. 关卡设计

### 4.1 L1 对称入门

| 属性 | 值 |
|---|---|
| 目标洞 | 单洞，O(0,0)，半径 40 |
| 蓝球起始 | (-240, -320) |
| 黄球起始 | (240, 320) |
| 障碍物 | 4 块，两对关于 O 对称：矩形柱 ±(200,100)，圆柱 ±(100,150) |
| requireBothBalls | false |
| 时间限制 | 无 |
| 设计意图 | 教学"力镜像同步感"，蓝球进洞黄球自动跟入 |

### 4.2 L2 牺牲卡位

| 属性 | 值 |
|---|---|
| 目标洞 | 单洞偏上，(0, +240)，半径 55（可容双球） |
| 障碍物 | 非对称：下半区宽墙卡槽（y≈-120），上半区窄通道 |
| requireBothBalls | true |
| 时间限制 | 无 |
| 谜题流程 | ① 蓝球被下方卡槽挡住 → ② 向下推摇杆：蓝球贴墙，黄球获得向上力 → ③ 黄球进大洞 → ④ 向上推蓝球脱卡进洞 → ⑤ 双球停留 0.3s 通关 |

### 4.3 L3 移动障碍

| 属性 | 值 |
|---|---|
| 目标洞 | 双洞：Hole_A(-180,+300) 供黄球，Hole_B(+180,-300) 供蓝球 |
| 障碍物 | 2 个水平往返 MovingObstacle + 1 个旋转挡板 |
| requireBothBalls | true（各进各自的洞） |
| 时间限制 | 60s |
| 设计意图 | 节奏压力 + 路径规划复合；移动障碍考验等待时机 |

---

## 5. 控制与交互

### 5.1 摇杆

- 类型：浮动摇杆，触点落点即为原点，限制在屏幕左下 1/4 区域
- 输出：归一化 Vector2，死区 0.1

### 5.2 长按重置

```csharp
// ResetHandler.cs
if (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Stationary)
    holdTime += Time.deltaTime;
else
    holdTime = 0f;
if (holdTime >= 1.5f) { GameManager.Instance.ResetLevel(); holdTime = 0f; }
```

---

## 6. 视觉风格：涂鸦卡通

| 元素 | 描述 |
|---|---|
| 背景 | 纸质纹理（淡黄/米白），上下区域轻微色调区分 |
| 球体 | 纯色填充 + 粗黑描边（3-4px）+ 硬阴影偏移（4px 右下），轻微拖尾 |
| 障碍物 | 几何体 + 粗黑描边 + 硬阴影，随机涂鸦纹理 |
| 圆洞 | 深色填充 + 粗描边 + 旋转光效，进洞时吸入动画（scale 缩小 + 旋转） |
| UI 字体 | 抖音风格粗圆体（方正综艺/站酷快乐体），白底黑描边 |
| 特效 | 碰撞小火花（涂鸦风星形 Particle），过关爆炸彩纸 |

---

## 7. 抖音平台能力

| 能力 | 触发时机 | API |
|---|---|---|
| 震动反馈 | 每次过关 | `tt.vibrateShort({ type: "light" })` |
| 分享按钮 | 过关弹窗 | `tt.shareAppMessage({ title, imageUrl })` |
| 激励视频广告 | 玩家点击"看广告再试" | `tt.createRewardedVideoAd` → 看完回调重置关卡 |

**编辑器降级**：所有方法在 `#if UNITY_EDITOR` 下直接成功回调。

---

## 8. 错误处理

| 场景 | 处理 |
|---|---|
| 球高速穿透薄障碍 | Rigidbody2D.collisionDetectionMode = Continuous |
| 切后台 | OnApplicationPause(true) → Time.timeScale=0，恢复时 =1 |
| 激励视频加载失败 | 降级为直接重置，DouyinBridge 内部捕获 error 回调 |
| 物理帧率波动 | 全部物理逻辑在 FixedUpdate，与渲染帧解耦 |

---

## 9. 测试策略

### 9.1 Play Mode 单元测试

| 测试 | 验证点 |
|---|---|
| `ForceMirror_BlueUp_YellowDown` | AddForce(0,1) 后，yellowRb.velocity.y < 0 |
| `ForceMirror_WallBlock_YellowStillMoves` | 蓝球贴左墙，AddForce(-1,0)，黄球 velocity.x > 0 |
| `HoleDetector_DwellTime_Triggers` | 球停留 ≥ 0.3s，OnLevelComplete 被调用一次 |
| `HoleDetector_BallExit_ResetsTimer` | 球离开后计时归零，短暂再入不触发 |
| `Reset_RestoresBallPositions` | ResetLevel() 后两球回到 SpawnPoints |

### 9.2 真机验收清单

- [ ] L1：蓝球进洞，黄球同步跟入，过关震动触发
- [ ] L2：卡墙机制可被自然发现，双球均进大洞可完成
- [ ] L3：移动障碍流畅，60s 计时正确，时间到有提示
- [ ] 全关：长按 1.5s 重置；分享按钮弹出；激励视频完整流程
- [ ] 低端机（红米 Note 8 级别）帧率 ≥ 30fps
