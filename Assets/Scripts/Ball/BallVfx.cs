using UnityEngine;

public class BallVfx : MonoBehaviour
{
    [SerializeField] GameObject sparkPrefab;

    void OnCollisionEnter2D(Collision2D col)
    {
        if (sparkPrefab == null) return;
        var contact = col.contacts[0].point;
        var spark   = Instantiate(sparkPrefab, contact, Quaternion.identity);
        Destroy(spark, 0.5f);
    }
}
