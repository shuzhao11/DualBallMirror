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
