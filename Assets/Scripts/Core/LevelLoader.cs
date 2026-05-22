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

        var prefab = Resources.Load<GameObject>(data.prefabPath);
        if (prefab == null)
        {
            Debug.LogError($"[LevelLoader] Prefab not found: '{data.prefabPath}'");
            return (null, null);
        }
        _currentLevel = Instantiate(prefab, levelRoot);

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
