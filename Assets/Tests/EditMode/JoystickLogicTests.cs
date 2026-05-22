using NUnit.Framework;
using UnityEngine;

public class JoystickLogicTests
{
    [Test]
    public void ExceedsDeadzone_ReturnsNormalized()
    {
        Vector2 r = JoystickLogic.Calculate(new Vector2(100f, 0f), 60f, 0.1f);
        Assert.AreEqual(1f, r.x, 0.001f);
        Assert.AreEqual(0f, r.y, 0.001f);
    }

    [Test]
    public void BelowDeadzone_ReturnsZero()
    {
        Vector2 r = JoystickLogic.Calculate(new Vector2(3f, 0f), 60f, 0.1f);
        Assert.AreEqual(Vector2.zero, r);
    }

    [Test]
    public void ExceedsRadius_ClampedToOne()
    {
        Vector2 r = JoystickLogic.Calculate(new Vector2(999f, 0f), 60f, 0.1f);
        Assert.AreEqual(1f, r.x, 0.001f);
    }

    [Test]
    public void Diagonal_MagnitudeIsOne()
    {
        Vector2 r = JoystickLogic.Calculate(new Vector2(60f, 60f), 60f, 0.1f);
        Assert.AreEqual(1f, r.magnitude, 0.001f);
    }
}
