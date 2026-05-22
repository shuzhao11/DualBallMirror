using UnityEngine;
using UnityEngine.EventSystems;

public class ResetHandler : MonoBehaviour, IPointerDownHandler, IPointerUpHandler
{
    float _holdTime;
    bool  _holding;

    public void OnPointerDown(PointerEventData _) => _holding = true;
    public void OnPointerUp  (PointerEventData _) { _holding = false; _holdTime = 0f; }

    void Update()
    {
        if (!_holding) return;
        _holdTime += Time.deltaTime;
        if (_holdTime >= 1.5f)
        {
            _holdTime = 0f; _holding = false;
            GameManager.Instance.ResetLevel();
        }
    }
}
