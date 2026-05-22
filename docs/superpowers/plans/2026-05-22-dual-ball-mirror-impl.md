# 《双球镜像·同步挑战》Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用团结引擎（Tuanjie Engine）构建 3 关抖音竖屏小游戏，核心机制是力镜像双球同步（蓝球 +F，黄球 -F）+ 牺牲卡位解谜，支持震动/分享/激励视频广告。

**Architecture:** Tuanjie 2D Physics 驱动力镜像（2 行代码）；每关为独立 Prefab 由 LevelLoader 加载；GameManager 单例维护状态机并轮询 HoleDetector 判定通关；HoleDetector 只追踪状态、不判定胜负。

**Tech Stack:** 团结引擎（Tuanjie Engine，Unity-based）、C#、Tuanjie 2D Physics、Tuanjie Test Framework、抖音小游戏原生 SDK（StarkSDK C# bindings）

**设计文档：** `docs/superpowers/specs/2026-05-22-dual-ball-mirror-design.md`

---

## 文件结构

```
Assets/
├── Scripts/
│   ├── Core/
│   │   ├── LevelData.cs                  - ScriptableObject，关卡元信息
│   │   ├── GameManager.cs                - 单例状态机，通关判定，切后台暂停
│   │   ├── LevelLoader.cs                - 加载/卸载关卡 Prefab，球复位
│   │   └── GameBootstrap.cs              - 场景启动入口，串联各模块
│   ├── Ball/
│   │   ├── BallController.cs             - 力镜像核心：AddForce ±F，FixedUpdate
│   │   ├── HoleDetector.cs               - Trigger 追踪，IsSatisfied(threshold)
│   │   └── BallVfx.cs                    - 碰撞火花特效
│   ├── Input/
│   │   ├── JoystickLogic.cs              - 纯 C# 方向计算（EditMode 测试）
│   │   └── JoystickInput.cs              - MonoBehaviour，读触摸，调用 JoystickLogic
│   ├── UI/
│   │   ├── HUDController.cs              - 关卡名、倒计时（L3）
│   │   ├── OverlayController.cs          - 过关弹窗、广告按钮
│   │   ├── ResetHandler.cs               - 长按 1.5s 检测
│   │   └── HoleRotator.cs                - 圆洞旋转光效
│   ├── Obstacles/
│   │   └── MovingObstacleController.cs   - 往返/旋转障碍（L3）
│   └── Platform/
│       └── DouyinBridge.cs               - 震动/分享/激励视频，编辑器降级
├── ScriptableObjects/
│   ├── LevelData_01.asset
│   ├── LevelData_02.asset
│   └── LevelData_03.asset
├── Prefabs/
│   ├── Balls/
│   │   ├── BlueBall.prefab
│   │   └── YellowBall.prefab
│   └── Levels/ (同 Resources/Levels/)
├── Resources/
│   └── Levels/
│       ├── Level_01.prefab
│       ├── Level_02.prefab
│       └── Level_03.prefab
├── Art/
│   └── Particles/
│       ├── CollisionSpark.prefab
│       └── WinConfetti.prefab
├── Scenes/
│   └── Main.unity
└── Tests/
    ├── EditMode/
    │   ├── DualBall.EditMode.asmdef
    │   ├── JoystickLogicTests.cs
    │   └── GameManagerStateTests.cs
    └── PlayMode/
        ├── DualBall.PlayMode.asmdef
        ├── BallControllerTests.cs
        └── HoleDetectorTests.cs
```

---

## Task 1: 项目配置 & 测试基础设施

**Files:**
- Create: `Assets/Tests/EditMode/DualBall.EditMode.asmdef`
- Create: `Assets/Tests/PlayMode/DualBall.PlayMode.asmdef`
- Create: `.gitignore`

- [ ] **Step 1: 用 Tuanjie Hub 创建新项目**

  打开 Tuanjie Hub → 新建项目 → 选择 **2D（Core）** 模板 → 路径填 `C:/Projects/DualBallMirror/` → 创建。

- [ ] **Step 2: 配置竖屏与分辨率**

  Edit → Project Settings → Player：Default Orientation = **Portrait**

  Edit → Project Settings → Physics 2D：Gravity = (0, −9.8)（默认值，保留）

- [ ] **Step 3: 创建文件夹结构**

  在 Project 窗口依次创建：
  `Assets/Scripts/Core`, `Assets/Scripts/Ball`, `Assets/Scripts/Input`,
  `Assets/Scripts/UI`, `Assets/Scripts/Obstacles`, `Assets/Scripts/Platform`,
  `Assets/ScriptableObjects`, `Assets/Prefabs/Balls`, `Assets/Resources/Levels`,
  `Assets/Art/Particles`, `Assets/Scenes`,
  `Assets/Tests/EditMode`, `Assets/Tests/PlayMode`

- [ ] **Step 4: 创建 EditMode 程序集定义**

  右键 `Assets/Tests/EditMode/` → Create → Assembly Definition，命名 `DualBall.EditMode`：

  ```json
  {
    "name": "DualBall.EditMode",
    "references": ["UnityEngine.TestRunner", "UnityEditor.TestRunner"],
    "includePlatforms": ["Editor"],
    "optionalUnityReferences": ["TestAssemblies"]
  }
  ```

- [ ] **Step 5: 创建 PlayMode 程序集定义**

  右键 `Assets/Tests/PlayMode/` → Create → Assembly Definition，命名 `DualBall.PlayMode`：

  ```json
  {
    "name": "DualBall.PlayMode",
    "references": ["UnityEngine.TestRunner"],
    "includePlatforms": [],
    "optionalUnityReferences": ["TestAssemblies"]
  }
  ```

- [ ] **Step 6: 添加 Tags（Blue / Yellow）**

  Edit → Project Settings → Tags and Layers → Tags → 添加 `Blue`、`Yellow`。

- [ ] **Step 7: 创建 .gitignore 并提交**

  在 `C:/Projects/DualBallMirror/` 创建 `.gitignore`：
  ```
  /[Ll]ibrary/
  /[Tt]emp/
  /[Oo]bj/
  /[Bb]uild/
  /[Ll]ogs/
  /[Uu]ser[Ss]ettings/
  *.csproj
  *.sln
  *.suo
  .DS_Store
  .superpowers/
  ```

  ```bash
  git add .gitignore Assets/
  git commit -m "chore: project setup, folder structure, test assemblies, tags"
  ```

---

## Task 2: LevelData ScriptableObject

**Files:**
- Create: `Assets/Scripts/Core/LevelData.cs`
- Create: `Assets/ScriptableObjects/LevelData_01.asset` (+ 02, 03)

- [ ] **Step 1: 写 LevelData.cs**

  ```csharp
  // Assets/Scripts/Core/LevelData.cs
  using UnityEngine;

  [CreateAssetMenu(menuName = "DualBall/LevelData", fileName = "LevelData")]
  public class LevelData : ScriptableObject
  {
      public int    levelIndex;
      public string prefabPath;        // 相对 Resources 的路径，例如 "Levels/Level_01"
      public bool   requireBothBalls;  // false=蓝球进洞即过, true=双球均需进洞
      public float  holeDwellTime = 0.3f;
      public float  timeLimitSeconds;  // 0 = 无限制
  }
  ```

- [ ] **Step 2: 创建三个 LevelData Asset**

  右键 `Assets/ScriptableObjects/` → Create → DualBall → LevelData：

  **LevelData_01:** levelIndex=0, prefabPath="Levels/Level_01", requireBothBalls=false, holeDwellTime=0.3, timeLimitSeconds=0

  **LevelData_02:** levelIndex=1, prefabPath="Levels/Level_02", requireBothBalls=true, holeDwellTime=0.3, timeLimitSeconds=0

  **LevelData_03:** levelIndex=2, prefabPath="Levels/Level_03", requireBothBalls=true, holeDwellTime=0.3, timeLimitSeconds=60

- [ ] **Step 3: 提交**

  ```bash
  git add Assets/Scripts/Core/LevelData.cs Assets/ScriptableObjects/
  git commit -m "feat: LevelData ScriptableObject for 3 levels"
  ```

---

## Task 3: JoystickLogic + JoystickInput

**Files:**
- Create: `Assets/Scripts/Input/JoystickLogic.cs`
- Create: `Assets/Scripts/Input/JoystickInput.cs`
- Create: `Assets/Tests/EditMode/JoystickLogicTests.cs`

- [ ] **Step 1: 写 JoystickLogic.cs**

  ```csharp
  // Assets/Scripts/Input/JoystickLogic.cs
  using UnityEngine;

  public static class JoystickLogic
  {
      public static Vector2 Calculate(Vector2 delta, float radius, float deadzone)
      {
          Vector2 clamped    = Vector2.ClampMagnitude(delta, radius);
          Vector2 normalized = clamped / radius;
          return normalized.magnitude > deadzone ? normalized : Vector2.zero;
      }
  }
  ```

- [ ] **Step 2: 写失败测试**

  ```csharp
  // Assets/Tests/EditMode/JoystickLogicTests.cs
  using NUnit.Framework;
  using UnityEngine;

  public class JoystickLogicTests
  {
      [Test]
      public void ExceedsDeadzone_ReturnsNormalized()
      {
          Vector2 r = JoystickLogic.Calculate(new Vector2(100f, 0f), 60f, 0.1f);
          Assert.AreEqual(1f, r.x, 0.001f);
          Assert.AreEqual(0f, r.y, 0.001f);
      }

      [Test]
      public void BelowDeadzone_ReturnsZero()
      {
          Vector2 r = JoystickLogic.Calculate(new Vector2(3f, 0f), 60f, 0.1f);
          Assert.AreEqual(Vector2.zero, r);
      }

      [Test]
      public void ExceedsRadius_ClampedToOne()
      {
          Vector2 r = JoystickLogic.Calculate(new Vector2(999f, 0f), 60f, 0.1f);
          Assert.AreEqual(1f, r.x, 0.001f);
      }

      [Test]
      public void Diagonal_MagnitudeIsOne()
      {
          Vector2 r = JoystickLogic.Calculate(new Vector2(60f, 60f), 60f, 0.1f);
          Assert.AreEqual(1f, r.magnitude, 0.001f);
      }
  }
  ```

- [ ] **Step 3: Window → Test Runner → EditMode → Run `JoystickLogicTests` → 确认 4 PASS**

- [ ] **Step 4: 写 JoystickInput.cs**

  ```csharp
  // Assets/Scripts/Input/JoystickInput.cs
  using UnityEngine;
  using UnityEngine.EventSystems;

  public class JoystickInput : MonoBehaviour,
      IPointerDownHandler, IDragHandler, IPointerUpHandler
  {
      [SerializeField] RectTransform joystickRoot;
      [SerializeField] RectTransform handle;
      [SerializeField] float radius  = 60f;
      [SerializeField] float deadzone = 0.1f;

      public Vector2 Direction { get; private set; }

      public void OnPointerDown(PointerEventData data)
      {
          joystickRoot.position    = data.position;
          handle.anchoredPosition  = Vector2.zero;
          Direction                = Vector2.zero;
      }

      public void OnDrag(PointerEventData data)
      {
          Vector2 delta = data.position - (Vector2)joystickRoot.position;
          Direction               = JoystickLogic.Calculate(delta, radius, deadzone);
          handle.anchoredPosition = Vector2.ClampMagnitude(delta, radius);
      }

      public void OnPointerUp(PointerEventData data)
      {
          handle.anchoredPosition = Vector2.zero;
          Direction               = Vector2.zero;
      }
  }
  ```

- [ ] **Step 5: 提交**

  ```bash
  git add Assets/Scripts/Input/ Assets/Tests/EditMode/JoystickLogicTests.cs
  git commit -m "feat: JoystickLogic (pure) + JoystickInput (floating) with EditMode tests"
  ```

---

## Task 4: BallController（力镜像）+ PlayMode 测试

**Files:**
- Create: `Assets/Scripts/Ball/BallController.cs`
- Create: `Assets/Tests/PlayMode/BallControllerTests.cs`

- [ ] **Step 1: 写失败的 PlayMode 测试**

  ```csharp
  // Assets/Tests/PlayMode/BallControllerTests.cs
  using System.Collections;
  using NUnit.Framework;
  using UnityEngine;
  using UnityEngine.TestTools;

  public class BallControllerTests
  {
      GameObject _blue, _yellow, _ctrlGo;
      Rigidbody2D _blueRb, _yellowRb;
      BallController _ctrl;
      StubJoystick _stub;

      [SetUp]
      public void SetUp()
      {
          _stub   = new StubJoystick();
          _blue   = new GameObject("Blue");
          _yellow = new GameObject("Yellow");
          _blueRb   = _blue.AddComponent<Rigidbody2D>();
          _yellowRb = _yellow.AddComponent<Rigidbody2D>();
          _blueRb.gravityScale   = 0f;
          _yellowRb.gravityScale = 0f;
          _ctrlGo = new GameObject("Ctrl");
          _ctrl   = _ctrlGo.AddComponent<BallController>();
          _ctrl.Init(_blueRb, _yellowRb, _stub, 500f);
      }

      [TearDown]
      public void TearDown()
      {
          Object.Destroy(_ctrlGo);
          Object.Destroy(_blue);
          Object.Destroy(_yellow);
      }

      [UnityTest]
      public IEnumerator JoystickUp_BlueMoveUp_YellowMovesDown()
      {
          _stub.Direction = Vector2.up;
          yield return new WaitForFixedUpdate();
          yield return new WaitForFixedUpdate();
          Assert.Greater(_blueRb.velocity.y,   0f);
          Assert.Less   (_yellowRb.velocity.y, 0f);
      }

      [UnityTest]
      public IEnumerator BlueBlockedByWall_YellowStillMoves()
      {
          var wall = new GameObject("Wall");
          var wc   = wall.AddComponent<BoxCollider2D>();
          wc.size  = new Vector2(1f, 10f);
          wall.transform.position = new Vector3(_blue.transform.position.x - 0.6f, 0f, 0f);
          _blue.AddComponent<CircleCollider2D>().radius = 0.4f;

          _stub.Direction = Vector2.left;
          yield return new WaitForFixedUpdate();
          yield return new WaitForFixedUpdate();
          yield return new WaitForFixedUpdate();

          Assert.Greater(_yellowRb.velocity.x, 0f);  // -left = right
          Object.Destroy(wall);
      }
  }

  public class StubJoystick { public Vector2 Direction; }
  ```

- [ ] **Step 2: Test Runner → PlayMode → Run `BallControllerTests` → 确认 2 FAIL**

- [ ] **Step 3: 写 BallController.cs**

  ```csharp
  // Assets/Scripts/Ball/BallController.cs
  using UnityEngine;

  public class BallController : MonoBehaviour
  {
      [SerializeField] Rigidbody2D blueRb;
      [SerializeField] Rigidbody2D yellowRb;
      [SerializeField] float speed = 500f;

      JoystickInput _joystick;
      StubJoystick  _stub;

      void Awake() => _joystick = FindObjectOfType<JoystickInput>();

      // 测试专用，stub=null 则退回 JoystickInput
      public void Init(Rigidbody2D blue, Rigidbody2D yellow, StubJoystick stub, float spd)
      {
          blueRb   = blue;
          yellowRb = yellow;
          _stub    = stub;
          speed    = spd;
          _joystick = null;
      }

      void FixedUpdate()
      {
          Vector2 dir = _stub != null ? _stub.Direction
                       : _joystick != null ? _joystick.Direction
                       : Vector2.zero;
          if (dir == Vector2.zero) return;
          Vector2 f = dir * speed;
          blueRb.AddForce(f);
          yellowRb.AddForce(-f);
      }
  }
  ```

- [ ] **Step 4: Test Runner → PlayMode → 确认 2 PASS**

- [ ] **Step 5: 提交**

  ```bash
  git add Assets/Scripts/Ball/BallController.cs Assets/Tests/PlayMode/BallControllerTests.cs
  git commit -m "feat: BallController force mirror (±F) + PlayMode tests"
  ```

---

## Task 5: HoleDetector + PlayMode 测试

**Files:**
- Create: `Assets/Scripts/Ball/HoleDetector.cs`
- Create: `Assets/Tests/PlayMode/HoleDetectorTests.cs`

- [ ] **Step 1: 写失败的 PlayMode 测试**

  ```csharp
  // Assets/Tests/PlayMode/HoleDetectorTests.cs
  using System.Collections;
  using NUnit.Framework;
  using UnityEngine;
  using UnityEngine.TestTools;

  public class HoleDetectorTests
  {
      GameObject _holeGo, _ballGo;
      HoleDetector _det;

      [SetUp]
      public void SetUp()
      {
          _holeGo = new GameObject("Hole");
          var cc  = _holeGo.AddComponent<CircleCollider2D>();
          cc.isTrigger = true; cc.radius = 1f;
          _det = _holeGo.AddComponent<HoleDetector>();
          _det.RequireBlue = true; _det.RequireYellow = false;

          _ballGo     = new GameObject("BlueBall");
          _ballGo.tag = "Blue";
          var rb = _ballGo.AddComponent<Rigidbody2D>();
          rb.gravityScale = 0f;
          _ballGo.AddComponent<CircleCollider2D>().radius = 0.4f;
          _ballGo.transform.position = Vector3.zero;
      }

      [TearDown]
      public void TearDown()
      {
          Object.Destroy(_holeGo);
          Object.Destroy(_ballGo);
      }

      [UnityTest]
      public IEnumerator AfterDwellThreshold_IsSatisfied()
      {
          yield return new WaitForSeconds(0.35f);
          Assert.IsTrue(_det.IsSatisfied(0.3f));
      }

      [UnityTest]
      public IEnumerator AfterBallLeaves_DwellTimeResets()
      {
          yield return new WaitForSeconds(0.1f);
          _ballGo.transform.position = new Vector3(10f, 10f, 0f);
          yield return new WaitForFixedUpdate();
          yield return new WaitForSeconds(0.3f);
          Assert.IsFalse(_det.IsSatisfied(0.3f));
      }
  }
  ```

- [ ] **Step 2: 确认 2 FAIL**

- [ ] **Step 3: 写 HoleDetector.cs**

  ```csharp
  // Assets/Scripts/Ball/HoleDetector.cs
  using System.Collections.Generic;
  using UnityEngine;

  public class HoleDetector : MonoBehaviour
  {
      [SerializeField] bool requireBlue   = true;
      [SerializeField] bool requireYellow = true;

      public bool RequireBlue   { get => requireBlue;   set => requireBlue   = value; }
      public bool RequireYellow { get => requireYellow; set => requireYellow = value; }

      readonly HashSet<string> _inside = new();
      float _dwell;

      public float DwellTime            => _dwell;
      public bool  HasBall(string tag)  => _inside.Contains(tag);
      public bool  IsSatisfied(float t) => _dwell >= t;

      void OnTriggerEnter2D(Collider2D col)
      {
          if (col.CompareTag("Blue") || col.CompareTag("Yellow"))
              _inside.Add(col.tag);
      }

      void OnTriggerExit2D(Collider2D col)
      {
          _inside.Remove(col.tag);
          _dwell = 0f;
      }

      void Update()
      {
          bool met = (!requireBlue   || _inside.Contains("Blue"))
                  && (!requireYellow || _inside.Contains("Yellow"));
          if (met) _dwell += Time.deltaTime;
          else     _dwell  = 0f;
      }
  }
  ```

- [ ] **Step 4: 确认 2 PASS**

- [ ] **Step 5: 提交**

  ```bash
  git add Assets/Scripts/Ball/HoleDetector.cs Assets/Tests/PlayMode/HoleDetectorTests.cs
  git commit -m "feat: HoleDetector dwell-time tracking + PlayMode tests"
  ```

---

## Task 6: GameManager 状态机

**Files:**
- Create: `Assets/Scripts/Core/GameManager.cs`
- Create: `Assets/Tests/EditMode/GameManagerStateTests.cs`

- [ ] **Step 1: 写失败的 EditMode 测试**

  ```csharp
  // Assets/Tests/EditMode/GameManagerStateTests.cs
  using NUnit.Framework;
  using UnityEngine;

  public class GameManagerStateTests
  {
      GameManager _gm;

      [SetUp]
      public void SetUp()
      {
          var go = new GameObject("GM");
          _gm = go.AddComponent<GameManager>();
          _gm.InjectLevels(new LevelData[0]);
      }

      [TearDown]
      public void TearDown() => Object.DestroyImmediate(_gm.gameObject);

      [Test]
      public void InitialState_IsLoading() =>
          Assert.AreEqual(GameState.Loading, _gm.State);

      [Test]
      public void AfterStartLevel_IsPlaying()
      {
          _gm.StartLevel(ScriptableObject.CreateInstance<LevelData>());
          Assert.AreEqual(GameState.Playing, _gm.State);
      }

      [Test]
      public void AfterOnLevelComplete_IsLevelComplete()
      {
          _gm.StartLevel(ScriptableObject.CreateInstance<LevelData>());
          _gm.OnLevelComplete();
          Assert.AreEqual(GameState.LevelComplete, _gm.State);
      }

      [Test]
      public void ResetLevel_ReturnsToPlaying()
      {
          _gm.StartLevel(ScriptableObject.CreateInstance<LevelData>());
          _gm.OnLevelComplete();
          _gm.ResetLevel();
          Assert.AreEqual(GameState.Playing, _gm.State);
      }
  }
  ```

- [ ] **Step 2: 确认 4 FAIL**

- [ ] **Step 3: 写 GameManager.cs**

  ```csharp
  // Assets/Scripts/Core/GameManager.cs
  using System;
  using UnityEngine;

  public enum GameState { Loading, Playing, LevelComplete }

  public class GameManager : MonoBehaviour
  {
      public static GameManager Instance { get; private set; }

      public GameState State  { get; private set; } = GameState.Loading;
      public bool IsPlaying   => State == GameState.Playing;
      public int  CurrentLevelIndex => _current?.levelIndex ?? 0;

      [SerializeField] LevelData[] levels;
      [SerializeField] LevelLoader levelLoader;

      public HoleDetector[] Holes { get; set; }

      public event Action<float> OnTimerUpdate;
      public event Action        OnTimeUp;
      public event Action        OnComplete;

      LevelData _current;
      float     _timeLeft;

      void Awake()
      {
          if (Instance != null && Instance != this) { Destroy(gameObject); return; }
          Instance = this;
      }

      public void InjectLevels(LevelData[] lvls) => levels = lvls;

      public void StartLevel(LevelData data)
      {
          _current  = data;
          _timeLeft = data.timeLimitSeconds;
          State     = GameState.Playing;
      }

      public void OnLevelComplete()
      {
          if (State != GameState.Playing) return;
          State = GameState.LevelComplete;
          OnComplete?.Invoke();
      }

      public void ResetLevel()
      {
          StartLevel(_current);
          levelLoader?.ResetBalls();
      }

      void Update()
      {
          if (State != GameState.Playing) return;
          CheckWinCondition();
          TickTimer();
      }

      void CheckWinCondition()
      {
          if (Holes == null || Holes.Length == 0 || _current == null) return;
          float t   = _current.holeDwellTime;
          bool  win = _current.requireBothBalls
              ? AllHolesSatisfied(t)
              : AnyHoleHasBlue(t);
          if (win) OnLevelComplete();
      }

      bool AllHolesSatisfied(float t)
      {
          foreach (var h in Holes) if (!h.IsSatisfied(t)) return false;
          return true;
      }

      bool AnyHoleHasBlue(float t)
      {
          foreach (var h in Holes) if (h.HasBall("Blue") && h.IsSatisfied(t)) return true;
          return false;
      }

      void TickTimer()
      {
          if (_current == null || _current.timeLimitSeconds <= 0f) return;
          _timeLeft -= Time.deltaTime;
          OnTimerUpdate?.Invoke(_timeLeft);
          if (_timeLeft <= 0f) { State = GameState.LevelComplete; OnTimeUp?.Invoke(); }
      }

      void OnApplicationPause(bool pause) => Time.timeScale = pause ? 0f : 1f;
  }
  ```

- [ ] **Step 4: 确认 4 PASS**

- [ ] **Step 5: 提交**

  ```bash
  git add Assets/Scripts/Core/GameManager.cs Assets/Tests/EditMode/GameManagerStateTests.cs
  git commit -m "feat: GameManager state machine + win condition (single/dual hole) + tests"
  ```

---

## Task 7: LevelLoader + ResetHandler + GameBootstrap

**Files:**
- Create: `Assets/Scripts/Core/LevelLoader.cs`
- Create: `Assets/Scripts/Core/GameBootstrap.cs`
- Create: `Assets/Scripts/UI/ResetHandler.cs`

- [ ] **Step 1: 写 LevelLoader.cs**

  ```csharp
  // Assets/Scripts/Core/LevelLoader.cs
  using UnityEngine;

  public class LevelLoader : MonoBehaviour
  {
      [SerializeField] Transform   levelRoot;
      [SerializeField] GameObject  blueBallPrefab;
      [SerializeField] GameObject  yellowBallPrefab;

      GameObject  _currentLevel;
      Rigidbody2D _blueRb, _yellowRb;
      Vector3     _blueSpawn, _yellowSpawn;

      public (Rigidbody2D blue, Rigidbody2D yellow) LoadLevel(LevelData data)
      {
          if (_currentLevel != null)
          {
              Destroy(_currentLevel);
              if (_blueRb   != null) Destroy(_blueRb.gameObject);
              if (_yellowRb != null) Destroy(_yellowRb.gameObject);
          }

          var prefab        = Resources.Load<GameObject>(data.prefabPath);
          _currentLevel     = Instantiate(prefab, levelRoot);

          _blueSpawn        = _currentLevel.transform.Find("SpawnPoints/BlueBallSpawn").position;
          _yellowSpawn      = _currentLevel.transform.Find("SpawnPoints/YellowBallSpawn").position;

          var blueGo        = Instantiate(blueBallPrefab,   _blueSpawn,   Quaternion.identity, levelRoot);
          var yellowGo      = Instantiate(yellowBallPrefab, _yellowSpawn, Quaternion.identity, levelRoot);
          _blueRb           = blueGo.GetComponent<Rigidbody2D>();
          _yellowRb         = yellowGo.GetComponent<Rigidbody2D>();

          GameManager.Instance.Holes = _currentLevel.GetComponentsInChildren<HoleDetector>();
          return (_blueRb, _yellowRb);
      }

      public void ResetBalls()
      {
          if (_blueRb == null || _yellowRb == null) return;
          void ResetRb(Rigidbody2D rb, Vector3 pos)
          {
              rb.velocity         = Vector2.zero;
              rb.angularVelocity  = 0f;
              rb.transform.position = pos;
          }
          ResetRb(_blueRb,   _blueSpawn);
          ResetRb(_yellowRb, _yellowSpawn);

          foreach (var mo in _currentLevel.GetComponentsInChildren<MovingObstacleController>())
              mo.ResetToStart();
      }
  }
  ```

- [ ] **Step 2: 写 ResetHandler.cs**

  ```csharp
  // Assets/Scripts/UI/ResetHandler.cs
  using UnityEngine;
  using UnityEngine.EventSystems;

  public class ResetHandler : MonoBehaviour, IPointerDownHandler, IPointerUpHandler
  {
      float _holdTime;
      bool  _holding;

      public void OnPointerDown(PointerEventData _) => _holding = true;
      public void OnPointerUp  (PointerEventData _) { _holding = false; _holdTime = 0f; }

      void Update()
      {
          if (!_holding) return;
          _holdTime += Time.deltaTime;
          if (_holdTime >= 1.5f)
          {
              _holdTime = 0f; _holding = false;
              GameManager.Instance.ResetLevel();
          }
      }
  }
  ```

- [ ] **Step 3: 写 GameBootstrap.cs**

  ```csharp
  // Assets/Scripts/Core/GameBootstrap.cs
  using UnityEngine;

  public class GameBootstrap : MonoBehaviour
  {
      [SerializeField] LevelData[]   levels;
      [SerializeField] LevelLoader   levelLoader;
      [SerializeField] BallController ballController;
      [SerializeField] HUDController  hud;

      int _currentIndex;

      void Start() => LoadLevel(0);

      public void LoadLevel(int index)
      {
          _currentIndex        = Mathf.Clamp(index, 0, levels.Length - 1);
          var data             = levels[_currentIndex];
          var (blue, yellow)   = levelLoader.LoadLevel(data);
          ballController.Init(blue, yellow, null, 500f);
          GameManager.Instance.StartLevel(data);
          hud.SetLevel(_currentIndex);
          if (data.timeLimitSeconds > 0) hud.ShowTimer(data.timeLimitSeconds);
      }
  }
  ```

- [ ] **Step 4: 提交**

  ```bash
  git add Assets/Scripts/Core/LevelLoader.cs Assets/Scripts/Core/GameBootstrap.cs Assets/Scripts/UI/ResetHandler.cs
  git commit -m "feat: LevelLoader, GameBootstrap (scene entry), ResetHandler (long press)"
  ```

---

## Task 8: DouyinBridge + MovingObstacleController

**Files:**
- Create: `Assets/Scripts/Platform/DouyinBridge.cs`
- Create: `Assets/Scripts/Obstacles/MovingObstacleController.cs`

- [ ] **Step 1: 写 DouyinBridge.cs**

  > SDK 参考：[Tuanjie 小游戏开放能力](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/game-engine/tuanjie/introduction)。`StarkSDKSpace` 命名空间由 Tuanjie 小游戏包提供；广告位 ID 在抖音开放平台申请后替换。

  ```csharp
  // Assets/Scripts/Platform/DouyinBridge.cs
  using System;
  using UnityEngine;
  #if !UNITY_EDITOR
  using StarkSDKSpace;
  #endif

  public static class DouyinBridge
  {
      public static void Vibrate()
      {
  #if UNITY_EDITOR
          Debug.Log("[DouyinBridge] Vibrate stub");
  #else
          StarkSDK.API.GetVibrateShortObject().Invoke(new VibrateShortOption { type = "light" });
  #endif
      }

      public static void ShowShare(string title, string imageUrl = "")
      {
  #if UNITY_EDITOR
          Debug.Log($"[DouyinBridge] Share stub: {title}");
  #else
          StarkSDK.API.ShareAppMessage(new ShareMessageOption { title = title, imageUrl = imageUrl });
  #endif
      }

      public static void ShowRewardedAd(Action onSuccess, Action onFail = null)
      {
  #if UNITY_EDITOR
          Debug.Log("[DouyinBridge] RewardedAd stub → success");
          onSuccess?.Invoke();
          return;
  #else
          var ad = StarkSDK.API.CreateRewardedVideoAd(
              new RewardedVideoAdOption { adUnitId = "YOUR_AD_UNIT_ID" });
          ad.OnClose += info => { if (info.isEnded) onSuccess?.Invoke(); else onFail?.Invoke(); };
          ad.OnError += _    => onFail?.Invoke();
          ad.Show();
  #endif
      }
  }
  ```

- [ ] **Step 2: 写 MovingObstacleController.cs**

  ```csharp
  // Assets/Scripts/Obstacles/MovingObstacleController.cs
  using UnityEngine;

  public class MovingObstacleController : MonoBehaviour
  {
      public enum Mode { Patrol, Rotate }

      [SerializeField] Mode    mode        = Mode.Patrol;
      [SerializeField] Vector3 offsetA;               // 相对起始位的偏移 A 端点
      [SerializeField] Vector3 offsetB;               // 相对起始位的偏移 B 端点
      [SerializeField] float   speed       = 2f;
      [SerializeField] float   rotateSpeed = 45f;

      Vector3 _startPos;
      int     _dir = 1;

      void Awake() => _startPos = transform.position;

      public void ResetToStart()
      {
          transform.position = _startPos;
          _dir = 1;
      }

      void Update()
      {
          if (GameManager.Instance == null || !GameManager.Instance.IsPlaying) return;

          if (mode == Mode.Rotate)
          {
              transform.Rotate(0f, 0f, rotateSpeed * Time.deltaTime);
              return;
          }

          Vector3 target = _dir > 0 ? _startPos + offsetB : _startPos + offsetA;
          transform.position = Vector3.MoveTowards(transform.position, target, speed * Time.deltaTime);
          if (Vector3.Distance(transform.position, target) < 0.05f) _dir = -_dir;
      }
  }
  ```

- [ ] **Step 3: 提交**

  ```bash
  git add Assets/Scripts/Platform/DouyinBridge.cs Assets/Scripts/Obstacles/MovingObstacleController.cs
  git commit -m "feat: DouyinBridge (vibrate/share/ad) + MovingObstacleController (patrol/rotate)"
  ```

---

## Task 9: HUD + Overlay + Main 场景搭建

**Files:**
- Create: `Assets/Scripts/UI/HUDController.cs`
- Create: `Assets/Scripts/UI/OverlayController.cs`
- Create: `Assets/Scripts/UI/HoleRotator.cs`
- Modify: `Assets/Scenes/Main.unity`（Tuanjie Editor 手动搭建）

- [ ] **Step 1: 写 HUDController.cs**

  ```csharp
  // Assets/Scripts/UI/HUDController.cs
  using TMPro;
  using UnityEngine;

  public class HUDController : MonoBehaviour
  {
      [SerializeField] TextMeshProUGUI levelLabel;
      [SerializeField] TextMeshProUGUI timerLabel;
      [SerializeField] GameObject      timerPanel;

      void OnEnable()
      {
          if (GameManager.Instance == null) return;
          GameManager.Instance.OnTimerUpdate += UpdateTimer;
          GameManager.Instance.OnTimeUp      += () => timerPanel.SetActive(false);
      }

      void OnDisable()
      {
          if (GameManager.Instance == null) return;
          GameManager.Instance.OnTimerUpdate -= UpdateTimer;
      }

      public void SetLevel(int index)
      {
          levelLabel.text = $"Level {index + 1}";
          timerPanel.SetActive(false);
      }

      public void ShowTimer(float seconds)
      {
          timerPanel.SetActive(true);
          UpdateTimer(seconds);
      }

      void UpdateTimer(float t) =>
          timerLabel.text = Mathf.CeilToInt(Mathf.Max(0, t)).ToString();
  }
  ```

- [ ] **Step 2: 写 OverlayController.cs**

  ```csharp
  // Assets/Scripts/UI/OverlayController.cs
  using UnityEngine;
  using UnityEngine.UI;

  public class OverlayController : MonoBehaviour
  {
      [SerializeField] GameObject winPanel;
      [SerializeField] GameObject timeUpPanel;
      [SerializeField] Button     nextLevelBtn;
      [SerializeField] Button     watchAdBtn;
      [SerializeField] Button     shareBtn;
      [SerializeField] GameBootstrap bootstrap;

      void Awake()
      {
          winPanel.SetActive(false);
          timeUpPanel.SetActive(false);
          nextLevelBtn.onClick.AddListener(OnNext);
          watchAdBtn.onClick.AddListener(OnWatchAd);
          shareBtn.onClick.AddListener(() =>
              DouyinBridge.ShowShare("我通关了《双球镜像》！来挑战！"));
      }

      void OnEnable()
      {
          if (GameManager.Instance == null) return;
          GameManager.Instance.OnComplete += ShowWin;
          GameManager.Instance.OnTimeUp   += ShowTimeUp;
      }

      void OnDisable()
      {
          if (GameManager.Instance == null) return;
          GameManager.Instance.OnComplete -= ShowWin;
          GameManager.Instance.OnTimeUp   -= ShowTimeUp;
      }

      void ShowWin()    { DouyinBridge.Vibrate(); winPanel.SetActive(true); }
      void ShowTimeUp() => timeUpPanel.SetActive(true);

      void OnNext()
      {
          winPanel.SetActive(false);
          bootstrap.LoadLevel(GameManager.Instance.CurrentLevelIndex + 1);
      }

      void OnWatchAd()
      {
          timeUpPanel.SetActive(false);
          DouyinBridge.ShowRewardedAd(
              onSuccess: () => GameManager.Instance.ResetLevel(),
              onFail:    () => timeUpPanel.SetActive(true));
      }
  }
  ```

- [ ] **Step 3: 写 HoleRotator.cs**

  ```csharp
  // Assets/Scripts/UI/HoleRotator.cs
  using UnityEngine;

  public class HoleRotator : MonoBehaviour
  {
      [SerializeField] float speed = 90f;
      void Update() => transform.Rotate(0f, 0f, speed * Time.deltaTime);
  }
  ```

- [ ] **Step 4: 在 Tuanjie Editor 搭建 Main.unity**

  Hierarchy 层级（手动拖拽创建）：
  ```
  [Manager]            - GameManager.cs, LevelLoader.cs, GameBootstrap.cs
  LevelRoot            - 空 GameObject，赋给 LevelLoader.levelRoot
  BallControllerObj    - BallController.cs
  Canvas (ScreenSpace-Overlay, CanvasScaler Scale-With-Screen 720×1280 Match=Height)
  ├── HUD              - HUDController.cs
  │   ├── LevelLabel   (TextMeshProUGUI, pos 顶部居中)
  │   └── TimerPanel
  │       └── TimerLabel (TextMeshProUGUI)
  ├── JoystickArea     - 全屏透明 Image + JoystickInput.cs（限制在左下 1/4 区域）
  │   ├── JoystickRoot (Image，摇杆背景圆，Anchors 左下，pos ≈ (100,-100))
  │   └── Handle       (Image，手柄圆，子节点，anchoredPos 初始 (0,0))
  ├── ResetArea        - 全屏透明 Image + ResetHandler.cs
  └── OverlayPanel     - OverlayController.cs
      ├── WinPanel     (默认隐藏)
      │   ├── NextLevelBtn
      │   └── ShareBtn
      └── TimeUpPanel  (默认隐藏)
          └── WatchAdBtn
  ```

  Inspector 连线：
  - `[Manager]` 的 GameBootstrap → 拖入 LevelData_01/02/03，levelLoader，ballController，hud
  - `[Manager]` 的 GameManager → 拖入 levelLoader
  - BallControllerObj 的 BallController → 无需预填 blueRb/yellowRb（LoadLevel 后动态设置）

- [ ] **Step 5: 提交**

  ```bash
  git add Assets/Scripts/UI/ Assets/Scenes/Main.unity
  git commit -m "feat: HUD, OverlayController, HoleRotator, Main scene assembled"
  ```

---

## Task 10: Ball Prefabs + L1 关卡 Prefab

**Files:**
- Create: `Assets/Prefabs/Balls/BlueBall.prefab`
- Create: `Assets/Prefabs/Balls/YellowBall.prefab`
- Create: `Assets/Resources/Levels/Level_01.prefab`

> 坐标单位：世界坐标 1 单位 = 地图 ~100px（PPU=100）。地图范围 ±3.6 × ±4.8。

- [ ] **Step 1: 创建 BlueBall.prefab**

  Hierarchy 创建 `BlueBall` → 添加：
  - `Rigidbody2D`：Mass=1，GravityScale=0，LinearDrag=3，Collision Detection=**Continuous**
  - `CircleCollider2D`：Radius=0.26
  - `SpriteRenderer`：赋蓝色涂鸦圆形 Sprite（粗黑描边，硬阴影）
  - Tag = **Blue**

  拖入 `Assets/Prefabs/Balls/BlueBall.prefab`。

- [ ] **Step 2: 创建 YellowBall.prefab**

  同 Step 1，Tag=**Yellow**，Sprite 颜色 #F5C518。

- [ ] **Step 3: 创建 Level_01.prefab（对称入门）**

  ```
  Level_01
  ├── Boundary（4 面 BoxCollider2D，不是 Trigger）
  │   Top:    pos=(0, 4.85)  size=(7.4, 0.2)
  │   Bottom: pos=(0,-4.85)  size=(7.4, 0.2)
  │   Left:   pos=(-3.65,0)  size=(0.2,9.9)
  │   Right:  pos=( 3.65,0)  size=(0.2,9.9)
  ├── Holes/
  │   └── Hole_A  pos=(0,0)  CircleCollider2D r=0.4 isTrigger=true
  │              + HoleDetector: requireBlue=true, requireYellow=false
  │              + HoleRotator (子 GlowRing Sprite 旋转)
  ├── Obstacles/
  │   ├── Obs1A  pos=( 2.0, 1.0)  BoxCollider2D size=(0.8, 0.3)
  │   ├── Obs1B  pos=(-2.0,-1.0)  BoxCollider2D size=(0.8, 0.3)
  │   ├── Obs2A  pos=(-1.0,-1.5)  CircleCollider2D r=0.25
  │   └── Obs2B  pos=( 1.0, 1.5)  CircleCollider2D r=0.25
  └── SpawnPoints/
      ├── BlueBallSpawn   pos=(-2.4,-3.2)
      └── YellowBallSpawn pos=( 2.4, 3.2)
  ```

  保存至 `Assets/Resources/Levels/Level_01.prefab`。

- [ ] **Step 4: Play Mode 手动验证 L1**

  运行 → 摇杆控蓝球向中心 → 黄球同向移动（对称地图下同步）→ 蓝球进洞停 0.3s → WinPanel 出现，震动日志出现。长按 1.5s → 两球复位。

- [ ] **Step 5: 提交**

  ```bash
  git add Assets/Prefabs/Balls/ Assets/Resources/Levels/Level_01.prefab
  git commit -m "feat: Ball prefabs + L1 symmetric level (center hole, 4 symmetric obstacles)"
  ```

---

## Task 11: L2 关卡 Prefab（牺牲卡位）

**Files:**
- Create: `Assets/Resources/Levels/Level_02.prefab`

- [ ] **Step 1: 在 Editor 中搭建 Level_02**

  ```
  Level_02
  ├── Boundary（同 L1）
  ├── Holes/
  │   └── Hole_A  pos=(0, 2.4)  CircleCollider2D r=0.55 isTrigger=true
  │              + HoleDetector: requireBlue=true, requireYellow=true
  ├── Obstacles/
  │   ├── WallSlot    pos=(-1.8,-1.2)  BoxCollider2D size=(2.4,0.25)  【卡槽宽墙】
  │   ├── NarrowLeft  pos=(-0.5, 1.0)  BoxCollider2D size=(0.25,1.5) 【窄通道左】
  │   ├── NarrowRight pos=( 0.5, 1.0)  BoxCollider2D size=(0.25,1.5) 【窄通道右，间隙≈0.5】
  │   └── BlockRight  pos=( 2.2,-0.5)  BoxCollider2D size=(1.5,0.25) 【引导蓝球去卡槽】
  └── SpawnPoints/
      ├── BlueBallSpawn   pos=(-2.4,-3.2)
      └── YellowBallSpawn pos=( 2.4, 3.2)
  ```

- [ ] **Step 2: Play Mode 验证谜题可解**

  ① 向上推 → 蓝球被 WallSlot 挡住；② 向下推 → 蓝球贴墙，黄球获 +Y 力穿过窄通道进 Hole_A；③ 向上推 → 蓝球脱卡进 Hole_A；④ 双球停 0.3s → WinPanel。若通道过窄/卡槽位置偏，在 Editor 中微调 Collider 位置直至可解。

- [ ] **Step 3: 提交**

  ```bash
  git add Assets/Resources/Levels/Level_02.prefab
  git commit -m "feat: L2 sacrifice-block level (asymmetric obstacles, single large hole)"
  ```

---

## Task 12: L3 关卡 Prefab（移动障碍）+ 视觉特效

**Files:**
- Create: `Assets/Resources/Levels/Level_03.prefab`
- Create: `Assets/Scripts/Ball/BallVfx.cs`
- Create: `Assets/Art/Particles/CollisionSpark.prefab`
- Create: `Assets/Art/Particles/WinConfetti.prefab`

- [ ] **Step 1: 搭建 Level_03.prefab**

  ```
  Level_03
  ├── Boundary（同 L1）
  ├── Holes/
  │   ├── Hole_A  pos=(-1.8, 3.0)  r=0.4 isTrigger
  │   │          + HoleDetector: requireBlue=false, requireYellow=true
  │   └── Hole_B  pos=( 1.8,-3.0)  r=0.4 isTrigger
  │              + HoleDetector: requireBlue=true,  requireYellow=false
  ├── Obstacles/
  │   ├── MoverH1  pos=(0, 1.5)  BoxCollider2D(1.5,0.25)
  │   │           + MovingObstacleController: Patrol, offsetA=(-2,0), offsetB=(2,0), speed=2
  │   ├── MoverH2  pos=(0,-1.5)  BoxCollider2D(1.5,0.25)
  │   │           + MovingObstacleController: Patrol, offsetA=(2,0), offsetB=(-2,0), speed=2.5
  │   └── Rotator  pos=(0, 0)   BoxCollider2D(2.5,0.2)
  │               + MovingObstacleController: Rotate, rotateSpeed=30
  └── SpawnPoints/
      ├── BlueBallSpawn   pos=(-2.4,-3.2)
      └── YellowBallSpawn pos=( 2.4, 3.2)
  ```

- [ ] **Step 2: 写 BallVfx.cs（碰撞火花，挂在 Ball Prefab 上）**

  ```csharp
  // Assets/Scripts/Ball/BallVfx.cs
  using UnityEngine;

  public class BallVfx : MonoBehaviour
  {
      [SerializeField] GameObject sparkPrefab;

      void OnCollisionEnter2D(Collision2D col)
      {
          if (sparkPrefab == null) return;
          var contact = col.contacts[0].point;
          var spark   = Instantiate(sparkPrefab, contact, Quaternion.identity);
          Destroy(spark, 0.5f);
      }
  }
  ```

  在 `BlueBall.prefab` 和 `YellowBall.prefab` 上挂 `BallVfx`，赋 `CollisionSpark.prefab`。

- [ ] **Step 3: 创建 CollisionSpark.prefab**

  Hierarchy 创建 `Particle System` → 设置：
  - Duration=0.3, Looping=false, Start Lifetime=0.2, Start Speed=4, Max Particles=10
  - Shape=Sphere Radius=0.05
  - Color over Lifetime：黄→透明
  - Renderer Material=Sprites/Default

  保存 `Assets/Art/Particles/CollisionSpark.prefab`。

- [ ] **Step 4: 创建 WinConfetti.prefab**

  类似 Step 3，Duration=1.5, Looping=false, Start Speed=5, Max Particles=40。
  Color=随机彩色，Shape=Box size=(3,0.1,0)（从顶部散落）。
  保存 `Assets/Art/Particles/WinConfetti.prefab`。

  在 `OverlayController.ShowWin()` 中添加：
  ```csharp
  [SerializeField] GameObject confettiPrefab;

  void ShowWin()
  {
      DouyinBridge.Vibrate();
      winPanel.SetActive(true);
      if (confettiPrefab != null)
      {
          var c = Instantiate(confettiPrefab, Vector3.up * 4f, Quaternion.identity);
          Destroy(c, 2f);
      }
  }
  ```

- [ ] **Step 5: Play Mode 验证 L3**

  运行 → 进入 L3 → 观察移动障碍往返正常 → 旋转板旋转 → 60s 倒计时出现 → 时间到 TimeUpPanel 弹出。验证双球各进各自的洞触发 WinPanel。

- [ ] **Step 6: 最终提交**

  ```bash
  git add Assets/Resources/Levels/Level_03.prefab Assets/Scripts/Ball/BallVfx.cs Assets/Art/
  git commit -m "feat: L3 moving-obstacle level + collision spark + win confetti VFX"
  ```

---

## 真机验收清单

在抖音开发者工具或真机上验证：

- [ ] L1：蓝球进洞，黄球自动同步进入，震动触发，分享按钮出现
- [ ] L2：卡墙机制可被自然发现（无需提示），双球均可进大洞完成关卡
- [ ] L3：移动障碍运动流畅，60s 计时正确，时间到显示广告弹窗
- [ ] 全关：长按 1.5s 重置；激励视频看完后重置关卡
- [ ] 低端机（红米 Note 8）帧率 ≥ 30fps，无卡顿
- [ ] Home 键切后台再回来，Time.timeScale 恢复为 1，游戏继续
