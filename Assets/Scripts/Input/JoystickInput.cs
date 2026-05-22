using UnityEngine;
using UnityEngine.EventSystems;

public class JoystickInput : MonoBehaviour,
    IPointerDownHandler, IDragHandler, IPointerUpHandler
{
    [SerializeField] RectTransform joystickRoot;
    [SerializeField] RectTransform handle;
    [SerializeField] float radius   = 60f;
    [SerializeField] float deadzone = 0.1f;

    public Vector2 Direction { get; private set; }

    public void OnPointerDown(PointerEventData data)
    {
        joystickRoot.position    = data.position;
        handle.anchoredPosition  = Vector2.zero;
        Direction                = Vector2.zero;
    }

    public void OnDrag(PointerEventData data)
    {
        Vector2 delta           = data.position - (Vector2)joystickRoot.position;
        Direction               = JoystickLogic.Calculate(delta, radius, deadzone);
        handle.anchoredPosition = Vector2.ClampMagnitude(delta, radius);
    }

    public void OnPointerUp(PointerEventData data)
    {
        handle.anchoredPosition = Vector2.zero;
        Direction               = Vector2.zero;
    }
}
