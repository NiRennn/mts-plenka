import { useEffect, useState } from "react";
import "./Menu.scss";
import { useNavigate } from "react-router-dom";
import appRoutes from "../../routes/routes";

import plenka from "../../assets/images/riil-plenka.png";
import plenkaFull from "../../assets/icons/plenka-full.png";
import plenkaEmpty from "../../assets/icons/plenka-empty.png";
import task from "../../assets/icons/task.png";
import cafe from "../../assets/images/cafe.jpg";
import picnic from "../../assets/images/picnic.jpg";
import room from "../../assets/images/room.jpg";
import party from "../../assets/images/party.jpg";
import bikes from "../../assets/images/bikes.jpg";
import Button from "../Button/Button";
import treug from "../../assets/icons/treug.svg";
import win from "../../assets/icons/win.svg";

import checkIcon from "../../assets/icons/done.png";
import foundPlenka from "../../assets/icons/done-plenka.png";

import { useAppStore } from "../../store/appStore";

const CHANNEL_URL = "https://t.me/+X_Y-xncYDCAzZTJi";
const CHANNEL_MTS_URL = "https://vk.com/mts";

const IS_DRAW_FINISHED = true;

const winners = [
  {
    id: 1,
    username: "@username",
    isCurrentUser: false,
  },
  {
    id: 2,
    username: "@username",
    isCurrentUser: false,
  },
  {
    id: 3,
    username: "@anotherUser",
    isCurrentUser: true,
  },
  {
    id: 4,
    username: "@anotherUser",
    isCurrentUser: false,
  },
  {
    id: 5,
    username: "@anotherUser",
    isCurrentUser: false,
  },
];

const levels = [
  {
    id: 1,
    title: "ЛЕТНЯЯ ТУСОВКА",
    location: "ЛЕТНЯЯ ТУСОВКА",
    image: party,
  },
  {
    id: 2,
    title: "МОДНАЯ КОФЕЙНЯ",
    location: "МОДНАЯ КОФЕЙНЯ",
    image: cafe,
  },
  {
    id: 3,
    title: "Пикник",
    location: "ПИКНИК",
    image: picnic,
  },
  {
    id: 4,
    title: "ВЕЛОЗАЕЗД",
    location: "ВЕЛОЗАЕЗД",
    image: bikes,
  },
  {
    id: 5,
    title: "Твоя комната",
    location: "ТВОЯ КОМНАТА",
    image: room,
  },
];

type MenuContentState = "game" | "all-found" | "finished";

function Menu() {
  const navigate = useNavigate();

  const locations = useAppStore((state) => state.locations);

  const [activeLevelIndex, setActiveLevelIndex] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const isLevelPassed = (location: string) => {
    return locations.some(
      (item) => item.location === location && item.is_success,
    );
  };

  const passedLevelsCount = levels.filter((level) =>
    isLevelPassed(level.location),
  ).length;

  const isAllLevelsPassed = passedLevelsCount >= levels.length;

  const menuContentState: MenuContentState = IS_DRAW_FINISHED
    ? "finished"
    : isAllLevelsPassed
      ? "all-found"
      : "game";

  const handleOpenLink = () => {
    // const tg = (window as any)?.Telegram?.WebApp;

    window.open(CHANNEL_MTS_URL, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (menuContentState !== "game") return;

    const firstNotPassedIndex = levels.findIndex(
      (level) => !isLevelPassed(level.location),
    );

    if (firstNotPassedIndex !== -1) {
      setActiveLevelIndex(firstNotPassedIndex);
    }
  }, [locations, menuContentState]);

  const activeLevel = levels[activeLevelIndex];
  const isActiveLevelPassed = isLevelPassed(activeLevel.location);

  const handleGoToInfo = () => {
    navigate(appRoutes.INFO);
  };

  const handleOpenChannel = () => {
    const tg = (window as any)?.Telegram?.WebApp;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(CHANNEL_URL);
      return;
    }

    window.open(CHANNEL_URL, "_blank", "noopener,noreferrer");
  };

  const handleGoToGame = () => {
    if (isActiveLevelPassed) return;

    navigate(appRoutes.GAME, {
      state: {
        levelId: activeLevel.id,
      },
    });
  };

  const getOffset = (index: number) => {
    let offset = index - activeLevelIndex;

    if (offset > Math.floor(levels.length / 2)) {
      offset -= levels.length;
    }

    if (offset < -Math.floor(levels.length / 2)) {
      offset += levels.length;
    }

    return offset;
  };

  const goToPrevLevel = () => {
    setActiveLevelIndex((prev) => (prev === 0 ? levels.length - 1 : prev - 1));
  };

  const goToNextLevel = () => {
    setActiveLevelIndex((prev) => (prev === levels.length - 1 ? 0 : prev + 1));
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;

    const touchEndX = event.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        goToNextLevel();
      } else {
        goToPrevLevel();
      }
    }

    setTouchStartX(null);
  };

  const renderGameContent = () => {
    return (
      <>
        <div className="menu__content_main_topside">
          <img src={task} alt="" className="menu__content_main_topside_task" />

          <div className="menu__content_main_topside_energy">
            {levels.map((level, index) => (
              <img
                key={level.id}
                src={index < passedLevelsCount ? plenkaFull : plenkaEmpty}
                alt=""
                className="menu__content_main_topside_energy_plenka"
              />
            ))}
          </div>
        </div>

        <p className="menu__content_main_header">
          Найти 5&nbsp;плёнок в&nbsp;5&nbsp;локациях
        </p>

        <div
          className="menu__level_wheel"
          onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
          onTouchEnd={handleTouchEnd}
        >
          <div className="menu__level_wheel_track">
            {levels.map((level, index) => {
              const offset = getOffset(index);
              const isHidden = Math.abs(offset) > 2;
              const isPassed = isLevelPassed(level.location);

              return (
                <button
                  key={level.id}
                  type="button"
                  className="menu__level_card"
                  data-offset={offset}
                  data-active={offset === 0}
                  data-hidden={isHidden}
                  data-passed={isPassed}
                  onClick={() => setActiveLevelIndex(index)}
                >
                  <div className="menu__level_card_inner">
                    <div className="menu__level_card_photo">
                      <img
                        src={level.image}
                        alt=""
                        className="menu__level_card_img"
                      />
                    </div>

                    <span className="menu__level_card_title">
                      {level.title}
                    </span>
                  </div>

                  {isPassed && (
                    <div className="menu__level_card_passed">
                      <img
                        src={checkIcon}
                        alt=""
                        className="menu__level_card_passed_check"
                      />

                      <img
                        src={foundPlenka}
                        alt=""
                        className="menu__level_card_passed_plenka"
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <img src={treug} alt="" className="menu__level_pointer" />
        </div>

        <div className="menu__content_main_btnblock">
          <Button
            variant={isActiveLevelPassed ? "secondary2" : "primary"}
            disabled={isActiveLevelPassed}
            onClick={handleGoToGame}
          >
            {isActiveLevelPassed ? "Плёнка найдена" : "Изучить фото"}
          </Button>

          <Button variant="secondary" onClick={handleGoToInfo}>
            о розыгрыше
          </Button>
        </div>
      </>
    );
  };

  const renderAllFoundContent = () => {
    return (
      <div className="menu__result">
        <div className="menu__result_card">
          <img src={checkIcon} alt="" className="menu__result_check" />

          <h1 className="menu__result_title">Все плёнки найдены!</h1>

          <p className="menu__result_text">
            Ты нашел все плёнки и&nbsp;участвуешь в&nbsp;розыгрыше! Итоги
            подведём до&nbsp;__
          </p>
        </div>

        <div className="menu__result_buttons">
          <Button variant="secondary2" onClick={handleOpenChannel}>
            Канал РИИЛ
          </Button>

          <Button variant="secondary" onClick={handleGoToInfo}>
            о розыгрыше
          </Button>
        </div>
      </div>
    );
  };

  const renderFinishedContent = () => {
    return (
      <div className="menu__finished">
        <h1 className="menu__finished_title">
          Игра завершена&nbsp;— подводим итоги и&nbsp;поздравляем победителей!
        </h1>

        <p className="menu__finished_text">
          Если ты нашёл себя в&nbsp;списке призёров&nbsp;— напиши нам
          в&nbsp;личные сообщения сообщества МТС в&nbsp;ВК, укажи своё ФИО
          и&nbsp;название приза&nbsp;— мы свяжемся с&nbsp;вами и&nbsp;расскажем,
          как его получить. Спасибо за&nbsp;участие!
        </p>

        <Button variant="secondary2" onClick={handleOpenLink}>
          Я победитель!
        </Button>

        <div className="menu__winners">
          {winners.map((winner) => (
            <div
              key={winner.id}
              className={`menu__winner ${
                winner.isCurrentUser ? "menu__winner--active" : ""
              }`}
            >
              <div className="menu__winner_place">{winner.id}</div>

              <div className="menu__winner_content">
                <p className="menu__winner_username">{winner.username}</p>

                {winner.isCurrentUser && (
                  <div className="menu__winner_wrap">
                    <img src={win} alt="" className="menu__winner_prize" />
                    <p className="menu__winner_label">Вы победитель</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="menu" data-state={menuContentState}>
      <div className="menu__content">
        <img src={plenka} alt="" className="menu__content_plenka" />

        <div className="menu__content_main">
          {menuContentState === "game" && renderGameContent()}
          {menuContentState === "all-found" && renderAllFoundContent()}
          {menuContentState === "finished" && renderFinishedContent()}
        </div>
      </div>
    </div>
  );
}

export default Menu;
