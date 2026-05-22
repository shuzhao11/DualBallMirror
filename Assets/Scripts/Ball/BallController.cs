using UnityEngine;

public class BallController : MonoBehaviour
{
    [SerializeField] Rigidbody2D blueRb;
    [SerializeField] Rigidbody2D yellowRb;
    [SerializeField] float speed = 500f;

    JoystickInput _joystick;
    StubJoystick  _stub;

    void Awake() => _joystick = FindObjectOfType<JoystickInput>();

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

public class StubJoystick { public Vector2 Direction; }
