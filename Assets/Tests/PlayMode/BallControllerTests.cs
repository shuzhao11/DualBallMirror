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

        Assert.Greater(_yellowRb.velocity.x, 0f);
        Object.Destroy(wall);
    }
}
