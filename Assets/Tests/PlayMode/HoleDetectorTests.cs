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
        _ballGo.transform.position = new Vector3(10f, 10f, 0f); // 初始在洞外
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
        // 主动移入洞内，等物理触发 OnTriggerEnter2D
        _ballGo.transform.position = Vector3.zero;
        yield return new WaitForFixedUpdate();
        yield return new WaitForFixedUpdate();
        // 此时 _inside 应含 "Blue"，开始积累 dwell
        yield return new WaitForSeconds(0.35f);
        Assert.IsTrue(_det.IsSatisfied(0.3f));
    }

    [UnityTest]
    public IEnumerator AfterBallLeaves_DwellTimeResets()
    {
        // 移入洞内
        _ballGo.transform.position = Vector3.zero;
        yield return new WaitForFixedUpdate();
        yield return new WaitForFixedUpdate();
        // 稍微积累一点 dwell
        yield return new WaitForSeconds(0.1f);
        // 移出洞外，等 OnTriggerExit2D
        _ballGo.transform.position = new Vector3(10f, 10f, 0f);
        yield return new WaitForFixedUpdate();
        yield return new WaitForFixedUpdate();
        // 再等 0.3s，_dwell 应已重置且不再积累
        yield return new WaitForSeconds(0.3f);
        Assert.IsFalse(_det.IsSatisfied(0.3f));
    }
}
