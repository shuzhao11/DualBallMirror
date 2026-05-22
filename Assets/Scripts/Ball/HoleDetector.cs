using System.Collections.Generic;
using UnityEngine;

public class HoleDetector : MonoBehaviour
{
    [SerializeField] bool requireBlue   = true;
    [SerializeField] bool requireYellow = true;

    public bool RequireBlue   { get => requireBlue;   set => requireBlue   = value; }
    public bool RequireYellow { get => requireYellow; set => requireYellow = value; }

    readonly HashSet<string> _inside = new();
    float _dwell;

    public float DwellTime            => _dwell;
    public bool  HasBall(string tag)  => _inside.Contains(tag);
    public bool  IsSatisfied(float t) => _dwell >= t;

    void OnTriggerEnter2D(Collider2D col)
    {
        if (col.CompareTag("Blue") || col.CompareTag("Yellow"))
            _inside.Add(col.tag);
    }

    void OnTriggerExit2D(Collider2D col)
    {
        _inside.Remove(col.tag);
        _dwell = 0f;
    }

    void Update()
    {
        bool met = (!requireBlue   || _inside.Contains("Blue"))
                && (!requireYellow || _inside.Contains("Yellow"));
        if (met) _dwell += Time.deltaTime;
        else     _dwell  = 0f;
    }
}
