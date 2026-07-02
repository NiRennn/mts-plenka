import { useEffect, useState } from "react";
import "./Menu.scss";
import { useNavigate } from "react-router-dom";
import appRoutes from "../../routes/routes";

import plenka from "../../assets/images/riil-plenka.png";
import plenkaFull from "../../assets/icons/plenka-full.png";
import plenkaEmpty from "../../assets/icons/plenka-empty.png";
import task from "../../assets/icons/task.png";
import cafe from "../../assets/images/cafe.jpg";
import Button from "../Button/Button";
import treug from "../../assets/icons/treug.svg";

import checkIcon from "../../assets/icons/done.png";
import foundPlenka from "../../assets/icons/done-plenka.png";

import { useAppStore } from "../../store/appStore";

const levels = [
  {
    id: 1,
    title: "ЛЕТНЯЯ ТУСОВКА",
    location: "ЛЕТНЯЯ ТУСОВКА",
    image: cafe,
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
    image: cafe,
  },
  {
    id: 4,
    title: "ВЕЛОЗАЕЗД",
    location: "ВЕЛОЗАЕЗД",
    image: cafe,
  },
  {
    id: 5,
    title: "Твоя комната",
    location: "ТВОЯ КОМНАТА",
    image: cafe,
  },
];

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

  useEffect(() => {
    const firstNotPassedIndex = levels.findIndex(
      (level) => !isLevelPassed(level.location),
    );

    if (firstNotPassedIndex !== -1) {
      setActiveLevelIndex(firstNotPassedIndex);
    }
  }, [locations]);

  const activeLevel = levels[activeLevelIndex];
  const isActiveLevelPassed = isLevelPassed(activeLevel.location);

  const passedLevelsCount = levels.filter((level) =>
    isLevelPassed(level.location),
  ).length;

  const handleGoToInfo = () => {
    navigate(appRoutes.INFO);
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

  return (
    <div className="menu">
      <div className="menu__content">
        <img src={plenka} alt="" className="menu__content_plenka" />

        <div className="menu__content_main">
          <div className="menu__content_main_topside">
            <img
              src={task}
              alt=""
              className="menu__content_main_topside_task"
            />

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
        </div>
      </div>
    </div>
  );
}

export default Menu;
