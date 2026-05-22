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
