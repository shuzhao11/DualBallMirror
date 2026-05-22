// src/platform/DouyinBridge.ts

// 抖音小游戏全局对象类型声明
declare const tt: {
  vibrateShort(opts: { type: 'light' | 'medium' | 'heavy' }): void;
  shareAppMessage(opts: { title: string }): void;
  createRewardedVideoAd(opts: { adUnitId: string }): {
    onClose(cb: (res: { isEnded: boolean }) => void): void;
    onError(cb: (err: unknown) => void): void;
    show(): void;
  };
  onHide(cb: () => void): void;
  onShow(cb: () => void): void;
  navigateToScene?(opts: {
    scene: 'sidebar';
    success?: (res: unknown) => void;
    fail?: (err: { errMsg?: string; errNo?: number }) => void;
    complete?: () => void;
  }): void;
};

function isTT(): boolean {
  return typeof tt !== 'undefined';
}

export const DouyinBridge = {
  /** 短震动反馈（通关、碰撞等） */
  vibrate(): void {
    if (isTT()) {
      tt.vibrateShort({ type: 'light' });
    } else {
      console.log('[Bridge] vibrate stub');
    }
  },

  /** 分享当前关卡成绩 */
  showShare(title: string): void {
    if (isTT()) {
      tt.shareAppMessage({ title });
    } else {
      console.log('[Bridge] share stub:', title);
    }
  },

  /**
   * 播放激励视频广告。
   * 看完后调用 onSuccess；加载失败或提前关闭调用 onFail。
   * 开发环境（非抖音）直接调用 onSuccess。
   */
  showRewardedAd(onSuccess: () => void, onFail?: () => void): void {
    if (!isTT()) {
      onSuccess();
      return;
    }
    // 替换为在抖音开发者后台申请的广告单元 ID
    const adUnitId = 'YOUR_AD_UNIT_ID';
    if (adUnitId === 'YOUR_AD_UNIT_ID') {
      console.warn('[Bridge] adUnitId 尚未配置，广告不会展示');
    }
    const ad = tt.createRewardedVideoAd({ adUnitId });
    ad.onClose(res => {
      if (res.isEnded) {
        onSuccess();
      } else {
        onFail?.();
      }
    });
    ad.onError(() => onFail?.());
    ad.show();
  },

  /** 切后台事件（用于暂停游戏循环） */
  onHide(cb: () => void): void {
    if (isTT()) {
      tt.onHide(cb);
    } else {
      console.log('[Bridge] onHide stub (registered but will not fire)');
    }
  },

  /** 切回前台事件（用于恢复游戏循环） */
  onShow(cb: () => void): void {
    if (isTT()) {
      tt.onShow(cb);
    } else {
      console.log('[Bridge] onShow stub (registered but will not fire)');
    }
  },

  /** 当前宿主是否支持侧边栏复访（tt.navigateToScene） */
  canAddToSidebar(): boolean {
    return isTT() && typeof tt.navigateToScene === 'function';
  },

  /**
   * 跳转抖音侧边栏场景，引导用户把小游戏加入侧边栏（复访能力）。
   * 抖音平台审核硬要求：必须存在 tt.navigateToScene({ scene: 'sidebar' }) 调用。
   */
  addToSidebar(onSuccess?: () => void, onFail?: (errMsg?: string) => void): void {
    if (!this.canAddToSidebar()) {
      console.log('[Bridge] addToSidebar stub (host unsupported)');
      onSuccess?.();
      return;
    }
    tt.navigateToScene!({
      scene: 'sidebar',
      success: () => onSuccess?.(),
      fail: err => onFail?.(err?.errMsg),
    });
  },
};
