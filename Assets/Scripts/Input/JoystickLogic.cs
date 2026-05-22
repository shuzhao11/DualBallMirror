using UnityEngine;

public static class JoystickLogic
{
    public static Vector2 Calculate(Vector2 delta, float radius, float deadzone)
    {
        Vector2 clamped    = Vector2.ClampMagnitude(delta, radius);
        Vector2 normalized = clamped / radius;
        return normalized.magnitude > deadzone ? normalized : Vector2.zero;
    }
}
