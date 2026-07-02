import { useState } from "react";
import "./Sub.scss";
import { useNavigate } from "react-router-dom";

import plenka from "../../assets/images/riil-plenka.png";
import li1 from "../../assets/icons/li-1.png";
import li2 from "../../assets/icons/li-2.png";
import Button from "../Button/Button";
import { useAppStore } from "../../store/appStore";
import { checkUserSubscription } from "../../api/subscription";
import appRoutes from "../../routes/routes";

type CheckStatus = "idle" | "checking" | "not-found";

const CHANNEL_URL = "https://t.me/+X_Y-xncYDCAzZTJi";

function Sub() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const [checkStatus, setCheckStatus] = useState<CheckStatus>("idle");

  const handleOpenChannel = () => {
    const tg = (window as any)?.Telegram?.WebApp;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(CHANNEL_URL);
      return;
    }

    window.open(CHANNEL_URL, "_blank", "noopener,noreferrer");
  };

  const handleCheckSubscription = async () => {
    if (!user?.user_id) {
      console.error("user_id not found");
      setCheckStatus("not-found");
      return;
    }

    setCheckStatus("checking");

    try {
      const result = await checkUserSubscription(user.user_id);

      if (!result.success || !result.subs) {
        setCheckStatus("not-found");
        return;
      }

      setCheckStatus("idle");
      navigate(appRoutes.MENU);
    } catch (error) {
      console.error("Error checking subscription:", error);
      setCheckStatus("not-found");
    }
  };

  const handleCloseNotFound = () => {
    setCheckStatus("idle");
  };

  return (
    <div className="sub">
      <div className="sub__content">
        <div></div>

        <div>
          <img src={plenka} alt="" className="sub__content_plenka" />

          <p className="sub__content_header">Два шага до&nbsp;участия в&nbsp;розыгрыше</p>

          <div className="sub__content_ul">
            <div className="sub__content_li">
              <img src={li1} alt="" className="sub__content_li_img" />
              <p className="sub__content_li_text">Подпишись на&nbsp;канал РИИЛ</p>
            </div>

            <div className="sub__content_li">
              <img src={li2} alt="" className="sub__content_li_img" />
              <p className="sub__content_li_text">
                Найди 5&nbsp;спрятанных фотоплёнок
              </p>
            </div>
          </div>
        </div>

        <div className="sub__content_btnblock">
          <Button variant="primary" onClick={handleOpenChannel}>Перейти в канал</Button>

          <Button
            variant="secondary3"
            onClick={handleCheckSubscription}
            disabled={checkStatus === "checking"}
          >
            Проверить подписку
          </Button>
        </div>
      </div>

      {checkStatus !== "idle" && (
        <div
          className={`sub__checking ${
            checkStatus === "not-found" ? "sub__checking--not-found" : ""
          }`}
        >
          {checkStatus === "checking" && (
            <>
              <div className="sub__checking_spinner"></div>
              <p className="sub__checking_text">
                Проверяем <br />
                подписку
              </p>
            </>
          )}

          {checkStatus === "not-found" && (
            <div className="sub__notfound">
              <div className="sub__notfound_card">
                <p className="sub__notfound_title">
                  Подписка
                  <br />
                  не&nbsp;найдена!
                </p>

                <p className="sub__notfound_text">
                  Мы не&nbsp;смогли найти твою подписку
                  <br />
                  на&nbsp;канал РИИЛ.
                  <br />
                  Повтори попытку ещё раз!
                </p>
              </div>

              <Button variant="primary" onClick={handleCloseNotFound}>
                Повторить
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Sub;
