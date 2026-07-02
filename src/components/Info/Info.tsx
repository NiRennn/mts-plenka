import { useState } from "react";
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


type FaqItem = {
  id: number;
  title: string;
  text: string;
};

const faqItems: FaqItem[] = [
  {
    id: 1,
    title: "Как принять участие в розыгрыше?",
    text: "Подпишись на канал РИИЛ, найди 5 спрятанных фотоплёнок и выполни условия розыгрыша.",
  },
  {
    id: 2,
    title: "Где еще можно получить плёнку?",
    text: "Плёнки можно найти в локациях, которые будут открываться внутри игры.",
  },
  {
    id: 3,
    title: "В чем эксклюзивность плёнки?",
    text: "Мы прокачали классическую катушку Lucky Color C200 на 36 кадров, добавив узоры и шанс стать частью кампании.\n\nПриходи в фотолабораторию Луч, бесплатно сканируй плёнку и, возможно, именно твои кадры появятся в наружной рекламе МТС РИИЛ.",
  },
];

function Info() {
  const [openedFaqId, setOpenedFaqId] = useState<number>(3);
    const navigate = useNavigate();

  const handleGoToMenu = () => {
    navigate(appRoutes.MENU);
  };

  const handleToggleFaq = (id: number) => {
    setOpenedFaqId((prev) => (prev === id ? 0 : id));
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
              в розыгрыше
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
                  на канал
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

              <Button variant="primary" onClick={handleGoToMenu}>К поискам!</Button>
            </div>
          </div>
        </section>

        <section className="info__middle">
          <img src={logo} alt="" className="info__mts_logo" />
          <img src={luch} alt="" className="info__luch" />
        </section>

        <section className="info__faq">
          <h2 className="info__faq_title">
            Ответы на частые
            <br />
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
            <Button variant="primary">В канал РИИЛ</Button>
            <Button variant="secondary2">Правила розыгрыша</Button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Info;
