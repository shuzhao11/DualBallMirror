using UnityEngine;

public class GameBootstrap : MonoBehaviour
{
    [SerializeField] LevelData[]    levels;
    [SerializeField] LevelLoader    levelLoader;
    [SerializeField] BallController ballController;
    [SerializeField] HUDController  hud;

    int _currentIndex;

    void Start() => LoadLevel(0);

    public void LoadLevel(int index)
    {
        if (levels == null || levels.Length == 0)
        {
            Debug.LogError("[GameBootstrap] levels array is not configured");
            return;
        }
        _currentIndex      = Mathf.Clamp(index, 0, levels.Length - 1);
        var data           = levels[_currentIndex];
        var (blue, yellow) = levelLoader.LoadLevel(data);
        ballController.Init(blue, yellow, null, 500f);
        GameManager.Instance.StartLevel(data);
        hud.SetLevel(_currentIndex);
        if (data.timeLimitSeconds > 0) hud.ShowTimer(data.timeLimitSeconds);
    }
}
