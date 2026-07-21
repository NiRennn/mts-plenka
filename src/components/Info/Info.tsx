import { useEffect, useState } from "react";
import "./Info.scss";
import { useNavigate } from "react-router-dom";
import appRoutes from "../../routes/routes";

import plenka from "../../assets/images/riil-plenka.png";
import infoPhoto1 from "../../assets/images/info-cards.png";
import logo from "../../assets/icons/mts-logo.svg";
import present from "../../assets/icons/present.svg";
import luch from "../../assets/images/info-riil.png";

import li1 from "../../assets/icons/li-1.png";
import li2 from "../../assets/icons/li-2.png";

import Button from "../Button/Button";
import rulesPdf from "../../assets/Правила.pdf";

type FaqItem = {
  id: number;
  title: string;
  text: string;
};

const faqItems: FaqItem[] = [
  {
    id: 1,
    title: "Как\u00A0принять участие в\u00A0розыгрыше?",
    text: "Подпишись на\u00A0Телеграмм-канал РИИЛ, найди в\u00A0игре 5\u00A0катушек плёнки и\u00A0жди результатов!",
  },
  {
    id: 2,
    title: "Где ещё можно получить плёнку?",
    text: "Если не\u00A0веришь в\u00A0удачу, можешь купить плёнку в\u00A0фотолаборатории\u00A0ЛУЧ. Проявка и\u00A0сканирование будет бесплатным!",
  },
  {
    id: 3,
    title: "В\u00A0чём эксклюзивность плёнки?",
    text: "Мы\u00A0прокачали классическую катушку Lucky Color C200 на\u00A036\u00A0кадров, добавив узоры и\u00A0шанс стать частью кампании.\n\nПриходи в\u00A0фотолабораторию Луч, бесплатно сканируй плёнку и, возможно, именно твои кадры появятся в\u00A0наружной рекламе МТС\u00A0РИИЛ.",
  },
];

const CHANNEL_URL = "https://t.me/eto_riil";


function Info() {
  const [openedFaqId, setOpenedFaqId] = useState<number>(1);
  const navigate = useNavigate();

  const handleGoToMenu = () => {
    navigate(appRoutes.MENU);
  };

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    const backButton = tg?.BackButton;

    if (!backButton) return;

    const handleTelegramBack = () => {
      navigate(appRoutes.MENU, { replace: true });
    };

    backButton.show();
    backButton.onClick(handleTelegramBack);

    return () => {
      backButton.offClick(handleTelegramBack);
      backButton.hide();
    };
  }, [navigate]);

  const handleToggleFaq = (id: number) => {
    setOpenedFaqId((prev) => (prev === id ? 0 : id));
  };

    const handleOpenRiil = () => {
    const tg = (window as any)?.Telegram?.WebApp;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(CHANNEL_URL);
      return;
    }

    window.open(CHANNEL_URL, "_blank", "noopener,noreferrer");
  };

  const handleOpenRules = () => {
    const tg = (window as any)?.Telegram?.WebApp;

    if (tg?.openLink) {
      const absoluteUrl = new URL(rulesPdf, window.location.href).href;
      tg.openLink(absoluteUrl);
      return;
    }

    window.open(rulesPdf, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="info">
      <div className="info__scroll">
        <section className="info__top">
          <img src={plenka} alt="" className="info__logo" />

          <div className="info__hero">
            <img src={present} alt="" className="info__gift" />

            <img src={infoPhoto1} alt="" className="info__photo " />

            <h1 className="info__title">
              Участвуй
              <br />
              в&nbsp;розыгрыше
              <br />
              эксклюзивных
              <br />
              фотоплёнок РИИЛ
            </h1>
            <div className="info__steps">
              <div className="info__step">
                <img src={li1} alt="" className="info__step_img" />
                <p className="info__step_text">
                  Подпишись
                  <br />
                  на&nbsp;канал
                </p>
              </div>

              <div className="info__step">
                <img src={li2} alt="" className="info__step_img" />
                <p className="info__step_text">
                  Найди 5 спрятанных
                  <br />
                  фотоплёнок
                </p>
              </div>

              <Button variant="primary" onClick={handleGoToMenu}>
                К&nbsp;поискам!
              </Button>
            </div>
          </div>
        </section>

        <section className="info__middle">
          <img src={logo} alt="" className="info__mts_logo" />
          <img src={luch} alt="" className="info__luch" />
        </section>

        <section className="info__faq">
          <h2 className="info__faq_title">
            Ответы на&nbsp;частые
           
            вопросы
          </h2>

          <div className="info__faq_list">
            {faqItems.map((item) => {
              const isOpened = openedFaqId === item.id;

              return (
                <div
                  key={item.id}
                  className={`info__faq_item ${
                    isOpened ? "info__faq_item--opened" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="info__faq_head"
                    onClick={() => handleToggleFaq(item.id)}
                    aria-expanded={isOpened}
                  >
                    <span>{item.title}</span>
                    <span className="info__faq_icon">
                      {isOpened ? "−" : "+"}
                    </span>
                  </button>

                  <div className="info__faq_body">
                    <p className="info__faq_text">
                      {item.text.split("\n").map((line, index) => (
                        <span key={index}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="info__buttons">
            <Button variant="primary" onClick={handleOpenRiil}>В канал РИИЛ</Button>
            <Button variant="secondary2" onClick={handleOpenRules}>Правила розыгрыша</Button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Info;
