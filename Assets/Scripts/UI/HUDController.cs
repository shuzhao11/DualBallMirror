using TMPro;
using UnityEngine;

public class HUDController : MonoBehaviour
{
    [SerializeField] TextMeshProUGUI levelLabel;
    [SerializeField] TextMeshProUGUI timerLabel;
    [SerializeField] GameObject      timerPanel;

    void OnEnable()
    {
        if (GameManager.Instance == null) return;
        GameManager.Instance.OnTimerUpdate += UpdateTimer;
        GameManager.Instance.OnTimeUp      += OnTimeUp;
    }

    void OnDisable()
    {
        if (GameManager.Instance == null) return;
        GameManager.Instance.OnTimerUpdate -= UpdateTimer;
        GameManager.Instance.OnTimeUp      -= OnTimeUp;
    }

    public void SetLevel(int index)
    {
        levelLabel.text = $"Level {index + 1}";
        timerPanel.SetActive(false);
    }

    public void ShowTimer(float seconds)
    {
        timerPanel.SetActive(true);
        UpdateTimer(seconds);
    }

    void UpdateTimer(float t) =>
        timerLabel.text = Mathf.CeilToInt(Mathf.Max(0, t)).ToString();

    void OnTimeUp() => timerPanel.SetActive(false);
}
