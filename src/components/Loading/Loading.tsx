import "./Loading.scss";
import { useEffect } from "react";
import appRoutes from "../../routes/routes";
import { useNavigate } from "react-router-dom";
// import { preloadImageSrcs } from "../../utils/preload";
import { fetchAndHydrateUserData } from "../../api/userData";
import plenka from "../../assets/images/riil-plenka.png";
import mtsLogo from "../../assets/icons/mts-logo.svg";
import Loader from "../Loader/Loader";
import type { UserDto } from "../../store/appStore";
import { preloadImageSrcs } from "../../utils/preload";
import { APP_PRELOAD_IMAGES } from "../../data/preloadImages";

const MIN_LOADING_DELAY = 3000;
const PRELOAD_HARD_TIMEOUT = 7000;

const delay = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

function Loading() {
  const navigate = useNavigate();

  const pickNextRoute = (user: UserDto | null) => {
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

    const getEffectiveUserId = (): number | null => {
      try {
        const idFromUnsafe =
          tg?.initDataUnsafe?.user?.id != null
            ? Number(tg.initDataUnsafe.user.id)
            : NaN;
        if (Number.isFinite(idFromUnsafe)) return idFromUnsafe;

        const p = new URLSearchParams(window.location.search).get("user_id");
        const idFromQuery = p ? Number(p) : NaN;
        if (Number.isFinite(idFromQuery)) return idFromQuery;

        return null;
      } catch {
        return null;
      }
    };

    const effectiveUserId = getEffectiveUserId();
    // const initData = tg?.initData ?? "";
    const startParam =
      tg?.initDataUnsafe?.start_param ??
      new URLSearchParams(window.location.search).get("start_param") ??
      "";

    // const initData = "user=%7B%22id%22%3A783751626%2C%22first_name%22%3A%22%D0%9A%D0%BE%D1%81%D1%82%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22Deadly_Harlequine%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2Fl0kw4w0I95ZbMH8JAdPx3NfQwh1NpMo80TLCuNUWD38.svg%22%7D&chat_instance=4660196123306434724&chat_type=private&auth_date=1777474452&signature=xH96cotNslDGi72I0-4AIFLoK5mLBgL4JUfpSHeLtZRo5eIDTK1Lkz5fGnawURrvVEFsIx1rbzevNBEefrFCBg&hash=0bc116406f7a72a0b1db92f068bbb9bed777f1a0e45a31cc8cd743f398b9bbe7";
    // const effectiveUserId = 783751626;

    // (window as any).__uid = effectiveUserId ?? null;

    // console.log(initData)

    // preloadImageSrcs(ONBOARDING_IMAGES).then((results) => {
    //   const failed = results.filter((r) => !r.ok).map((r) => r.src);
    //   if (failed.length) console.warn("[preload] failed:", failed);
    // });

    if (!effectiveUserId) {
      console.error("effectiveUserId not found");
      return;
    }
    // if (!initData) {
    //   console.error("Telegram initData is empty");
    //   return;
    // }

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

      const preloadWithTimeout = Promise.race([
        preloadImages(),
        delay(PRELOAD_HARD_TIMEOUT).then(() => {
          console.warn("[preload] hard timeout");
        }),
      ]);

      const [userDataResult] = await Promise.allSettled([
        userDataPromise,
        preloadWithTimeout,
        minDelay,
      ]);

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

      go(pickNextRoute(userData.user));
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
