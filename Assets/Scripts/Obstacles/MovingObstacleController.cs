using UnityEngine;

public class MovingObstacleController : MonoBehaviour
{
    public enum Mode { Patrol, Rotate }

    [SerializeField] Mode    mode        = Mode.Patrol;
    [SerializeField] Vector3 offsetA;
    [SerializeField] Vector3 offsetB;
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
