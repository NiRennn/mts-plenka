import { useState } from "react";
import Button from "../Button/Button";
import "./Onboarding.scss";
import cards from "../../assets/images/ob-cards.png";
import luch from "../../assets/images/ob-riil.png";
import { useNavigate } from "react-router-dom";
import appRoutes from "../../routes/routes";
import { useAppStore } from "../../store/appStore";
import { acceptRules } from "../../api/rules";

function Onboarding() {
  const navigate = useNavigate();

  const user = useAppStore((state) => state.user);

  const [isLoading, setIsLoading] = useState(false);

  const handleGoToInfo = async () => {
    if (isLoading) return;

    if (!user?.user_id) {
      console.error("user_id not found");
      return;
    }

    setIsLoading(true);

    try {
      const result = await acceptRules(user.user_id);

      if (!result.success || !result.rule) {
        console.error("Rules were not accepted");
        return;
      }
      if (user.subs) {
        navigate(appRoutes.MENU, { replace: true });
        return;
      }

      navigate(appRoutes.SUB, { replace: true });
    } catch (error) {
      console.error("Error accepting rules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding__content">
        <div className="onboarding__content_top">
          <img src={cards} alt="" className="onboarding__content_top_cards" />
          <img src={luch} alt="" className="onboarding__content_top_luch" />
        </div>

        <div className="onboarding__content_bot">
          <div className="onboarding__content_bot_textblock">
            <p className="onboarding__content_bot_textblock_header">
              Эксклюзивная плёнка уже ждёт!
            </p>

            <p className="onboarding__content_bot_textblock_text">
              <span className="onboarding__content_bot_textblock_b">
                МТС от&nbsp;РИИЛ{" "}
              </span>
              объединился с&nbsp;фотолабораторией{" "}
              <span className="onboarding__content_bot_textblock_b">ЛУЧ </span>
              и&nbsp;создали лимитированный дроп:{" "}
              <span className="onboarding__content_bot_textblock_b">
                эксклюзивную плёнку для&nbsp;ваших ярких моментов!
              </span>{" "}
              <br />
              <br />
              Найди катушку плёнки и&nbsp;участвуй
              в&nbsp;розыгрыше реальных плёнок
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleGoToInfo}
            disabled={isLoading}
          >
            {isLoading ? "Загрузка..." : "Продолжить"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
