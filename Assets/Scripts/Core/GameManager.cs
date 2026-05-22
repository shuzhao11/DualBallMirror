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

    void OnDestroy()
    {
        if (Instance == this) Instance = null;
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
