import "./Loading.scss";
import { useEffect } from "react";
import appRoutes from "../../routes/routes";
import { useNavigate } from "react-router-dom";
import { fetchAndHydrateUserData } from "../../api/userData";
import plenka from "../../assets/images/riil-plenka.png";
import mtsLogo from "../../assets/icons/mts-logo.svg";
import Loader from "../Loader/Loader";
import type { UserDto } from "../../store/appStore";
import { preloadImageSrcs } from "../../utils/preload";
import { APP_PRELOAD_IMAGES } from "../../data/preloadImages";

import {
  getEffectiveUserId,
  getTelegramInitData,
} from "../../api/telegramAuth";

const MIN_LOADING_DELAY = 3000;

const delay = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

function Loading() {
  const navigate = useNavigate();

  const pickNextRoute = (user: UserDto | null, winners?: unknown[]) => {
    if (Array.isArray(winners) && winners.length > 0) {
      return appRoutes.MENU;
    }

    if (user?.rule && user?.subs) {
      return appRoutes.MENU;
    }

    if (user?.rule) {
      return appRoutes.SUB;
    }

    return appRoutes.ONBOARDING;
  };
  // const tg = (window as any)?.Telegram?.WebApp;

  useEffect(() => {
    let navigated = false;
    let cancelled = false;

    const tg = (window as any)?.Telegram?.WebApp;
    tg?.ready?.();

    const go = (to: string) => {
      if (navigated || cancelled) return;

      navigated = true;
      navigate(to, { replace: true });
    };

    const effectiveUserId = getEffectiveUserId();
    const startParam =
      tg?.initDataUnsafe?.start_param ??
      new URLSearchParams(window.location.search).get("start_param") ??
      "";

    const initData = getTelegramInitData();
      // (window as any).__uid = effectiveUserId ?? null;

    console.log(initData)

    if (!effectiveUserId) {
      console.error("effectiveUserId not found");
      return;
    }
    if (!initData) {
      console.error("Telegram initData is empty");
      return;
    }

    try {
      const platform: string | undefined = tg?.platform;
      if (
        platform === "android" ||
        platform === "ios" ||
        platform === "android_x" ||
        platform === "unigram"
      ) {
        tg?.requestFullscreen?.();
        tg?.lockOrientation();
      } else if (
        platform === "tdesktop" ||
        platform === "weba" ||
        platform === "webk" ||
        platform === "unknown"
      ) {
        tg?.exitFullscreen?.();
        tg?.setMinimumHeight?.(700);
      }
      tg?.expand?.();
    } catch {
      tg?.expand?.();
    }
    try {
      tg?.disableVerticalSwipes?.();
    } catch {}

    tg?.setHeaderColor?.("#f3f9ff");
    tg?.setBackgroundColor?.("#f3f9ff");
    tg?.setBottomBarColor?.("#f3f9ff");

    const preloadImages = async () => {
      const results = await preloadImageSrcs(APP_PRELOAD_IMAGES);

      const failedImages = results
        .filter((result) => !result.ok)
        .map((result) => result.src);

      if (failedImages.length) {
        console.warn("[preload] failed images:", failedImages);
      }
    };

    const init = async () => {
      const minDelay = delay(MIN_LOADING_DELAY);

      const userDataPromise = fetchAndHydrateUserData(
        effectiveUserId,
        startParam,
      );

      const [userDataResult, preloadResult] = await Promise.allSettled([
        userDataPromise,
        preloadImages(),
        minDelay,
      ]);

      if (preloadResult.status !== "fulfilled") {
        console.error("Error preloading images:", preloadResult.reason);
        return;
      }

      if (cancelled) return;

      if (userDataResult.status !== "fulfilled") {
        console.error("Error fetching user data:", userDataResult.reason);
        return;
      }

      const userData = userDataResult.value;

      if (!userData.user) {
        console.error("User data is empty");
        return;
      }

      go(pickNextRoute(userData.user, userData.winners));
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [navigate]);
  return (
    <div className="loading">
      <div className="loading__content">
        <div className="loading__content_top">
          <img src={mtsLogo} alt="" className="loading__logo" />
          <img src={plenka} alt="" className="loading__plenka" />
        </div>

        <Loader />
      </div>
    </div>
  );
}

export default Loading;
