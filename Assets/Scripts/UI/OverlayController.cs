using UnityEngine;
using UnityEngine.UI;

public class OverlayController : MonoBehaviour
{
    [SerializeField] GameObject    winPanel;
    [SerializeField] GameObject    timeUpPanel;
    [SerializeField] Button        nextLevelBtn;
    [SerializeField] Button        watchAdBtn;
    [SerializeField] Button        shareBtn;
    [SerializeField] GameBootstrap bootstrap;
    [SerializeField] GameObject    confettiPrefab;

    void Awake()
    {
        winPanel.SetActive(false);
        timeUpPanel.SetActive(false);
        nextLevelBtn.onClick.AddListener(OnNext);
        watchAdBtn.onClick.AddListener(OnWatchAd);
        shareBtn.onClick.AddListener(() =>
            DouyinBridge.ShowShare("我通关了《双球镜像》！来挑战！"));
    }

    void OnEnable()
    {
        if (GameManager.Instance == null) return;
        GameManager.Instance.OnComplete += ShowWin;
        GameManager.Instance.OnTimeUp   += ShowTimeUp;
    }

    void OnDisable()
    {
        if (GameManager.Instance == null) return;
        GameManager.Instance.OnComplete -= ShowWin;
        GameManager.Instance.OnTimeUp   -= ShowTimeUp;
    }

    void ShowWin()
    {
        DouyinBridge.Vibrate();
        winPanel.SetActive(true);
        if (confettiPrefab != null)
        {
            var c = Instantiate(confettiPrefab, Vector3.up * 4f, Quaternion.identity);
            Destroy(c, 2f);
        }
    }

    void ShowTimeUp() => timeUpPanel.SetActive(true);

    void OnNext()
    {
        winPanel.SetActive(false);
        bootstrap.LoadLevel(GameManager.Instance.CurrentLevelIndex + 1);
    }

    void OnWatchAd()
    {
        timeUpPanel.SetActive(false);
        DouyinBridge.ShowRewardedAd(
            onSuccess: () => GameManager.Instance.ResetLevel(),
            onFail:    () => timeUpPanel.SetActive(true));
    }
}
