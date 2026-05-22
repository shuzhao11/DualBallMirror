using System;
using UnityEngine;
#if !UNITY_EDITOR
using StarkSDKSpace;
#endif

public static class DouyinBridge
{
    public static void Vibrate()
    {
#if UNITY_EDITOR
        Debug.Log("[DouyinBridge] Vibrate stub");
#else
        StarkSDK.API.GetVibrateShortObject().Invoke(new VibrateShortOption { type = "light" });
#endif
    }

    public static void ShowShare(string title, string imageUrl = "")
    {
#if UNITY_EDITOR
        Debug.Log($"[DouyinBridge] Share stub: {title}");
#else
        StarkSDK.API.ShareAppMessage(new ShareMessageOption { title = title, imageUrl = imageUrl });
#endif
    }

    public static void ShowRewardedAd(Action onSuccess, Action onFail = null)
    {
#if UNITY_EDITOR
        Debug.Log("[DouyinBridge] RewardedAd stub → success");
        onSuccess?.Invoke();
        return;
#else
        var ad = StarkSDK.API.CreateRewardedVideoAd(
            new RewardedVideoAdOption { adUnitId = "YOUR_AD_UNIT_ID" });
        ad.OnClose += info => { if (info.isEnded) onSuccess?.Invoke(); else onFail?.Invoke(); };
        ad.OnError += _    => onFail?.Invoke();
        ad.Show();
#endif
    }
}
