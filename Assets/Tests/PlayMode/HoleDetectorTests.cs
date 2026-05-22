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
