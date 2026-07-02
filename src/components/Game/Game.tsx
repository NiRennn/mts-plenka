import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type WheelEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Game.scss";

import Button from "../Button/Button";
import appRoutes from "../../routes/routes";

import {
  gameLevels,
  savePassedLevelId,
  type GameLevel,
  type GameVariant,
} from "../../data/gameLevels";
import { useAppStore } from "../../store/appStore";
import { saveGameResult } from "../../api/gameResult";

import plenkaFull from "../../assets/icons/pl.png";
// import foundPlenka from "../../assets/icons/done-plenka.png";
import checkIcon from "../../assets/icons/done.png";
import locat from "../../assets/icons/loc1.png";
import finger from "../../assets/icons/finger.png";
import cross from "../../assets/icons/cross.png";

const GAME_TIME_SECONDS = 1 * 10;

const DEBUG_TARGET = true;

type GameLocationState = {
  levelId?: number;
};

const getRandomVariant = (level: GameLevel): GameVariant => {
  const randomIndex = Math.floor(Math.random() * level.variants.length);
  return level.variants[randomIndex];
};

function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppStore((state) => state.user);
  const resultSentRef = useRef(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    didMove: false,
  });

  const [isSceneDragging, setIsSceneDragging] = useState(false);

  const locationState = location.state as GameLocationState | null;

  const level = useMemo(() => {
    return (
      gameLevels.find((item) => item.id === locationState?.levelId) ??
      gameLevels[0]
    );
  }, [locationState?.levelId]);

  const variant = useMemo(() => {
    return getRandomVariant(level);
  }, [level]);

  const sendGameResult = useCallback(
    async (isSuccess: boolean) => {
      if (resultSentRef.current) return;

      if (!user?.user_id) {
        console.error("user_id not found");
        return;
      }

      resultSentRef.current = true;

      try {
        await saveGameResult({
          user_id: user.user_id,
          location: level.apiLocation,
          is_success: isSuccess,
        });
      } catch (error) {
        console.error("Error saving game result:", error);
      }
    },
    [user?.user_id, level.title],
  );

  const [isStarted, setIsStarted] = useState(false);
  const [isFound, setIsFound] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME_SECONDS);

  const isTimeOver = isStarted && !isFound && timeLeft === 0;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const canMoveScene = isStarted && !isFound && !isTimeOver;

  const handleSceneWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!sceneRef.current || !canMoveScene) return;

    const delta =
      Math.abs(event.deltaY) > Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;

    sceneRef.current.scrollLeft += delta;

    event.preventDefault();
  };

  const handleSceneMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!sceneRef.current || !canMoveScene || event.button !== 0) return;

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: sceneRef.current.scrollLeft,
      didMove: false,
    };

    setIsSceneDragging(true);
  };

  const handleSceneMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!sceneRef.current || !dragState.isDragging) return;

    const diff = event.clientX - dragState.startX;

    if (Math.abs(diff) > 3) {
      dragState.didMove = true;
    }

    sceneRef.current.scrollLeft = dragState.scrollLeft - diff;
  };

  const stopSceneDrag = () => {
    dragStateRef.current.isDragging = false;
    setIsSceneDragging(false);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleStart = () => {
    resultSentRef.current = false;

    setIsStarted(true);

    requestAnimationFrame(() => {
      sceneRef.current?.scrollTo({
        left: 0,
        behavior: "instant",
      });
    });
  };

  const handleFindPlenka = async () => {
    if (!isStarted || isFound || isTimeOver) return;

    if (dragStateRef.current.didMove) return;

    setIsFound(true);
    savePassedLevelId(level.id);

    await sendGameResult(true);
  };

  const handleGoMenu = () => {
    navigate(appRoutes.MENU);
  };

  const handleRestart = () => {
    resultSentRef.current = false;

    setTimeLeft(GAME_TIME_SECONDS);
    setIsStarted(false);
    setIsFound(false);

    requestAnimationFrame(() => {
      sceneRef.current?.scrollTo({
        left: 0,
        behavior: "instant",
      });
    });
  };

  useEffect(() => {
    if (!isStarted || isFound || isTimeOver) return;

    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isStarted, isFound, isTimeOver]);

  useEffect(() => {
    if (!isTimeOver) return;

    sendGameResult(false);
  }, [isTimeOver, sendGameResult]);

  return (
    <div
      className="game"
      data-started={isStarted}
      data-found={isFound}
      data-debug-target={DEBUG_TARGET}
    >
      <div
        className="game__scene"
        ref={sceneRef}
        data-dragging={isSceneDragging}
        onWheel={handleSceneWheel}
        onMouseDown={handleSceneMouseDown}
        onMouseMove={handleSceneMouseMove}
        onMouseUp={stopSceneDrag}
        onMouseLeave={stopSceneDrag}
      >
        {" "}
        <div className="game__scene_inner">
          <img src={variant.image} alt="" className="game__image" />

          <button
            type="button"
            className="game__target"
            style={{
              left: `${variant.target.x}%`,
              top: `${variant.target.y}%`,
              width: `${variant.target.width}%`,
              height: `${variant.target.height}%`,
            }}
            onClick={handleFindPlenka}
            aria-label="Найти плёнку"
          >
            {/* {isFound && (
              <img src={foundPlenka} alt="" className="game__target_plenka" />
            )} */}
          </button>
        </div>
      </div>
      {isStarted && !isFound && (
        <div className="game__top">
          <div className="game__task">
            <img src={plenkaFull} alt="" className="game__task_icon" />

            <span>
              Найди
              <br />
              плёнку РИИЛЛ
            </span>
          </div>
          <div className="game__timer">{formattedTime}</div>
        </div>
      )}

      {isStarted && !isFound && !isTimeOver && (
        <div className="Game__hint_wrapper">
          <div className="game__hint">
            <img src={finger} alt="" className="game__hint_icon" />

            <p className="game__hint_text">
              Перемещай экран,
              <br />
              чтобы увидеть всю комнату
            </p>
          </div>
        </div>
      )}

      {!isStarted && (
        <div className="game__intro">
          <div className="game__intro_card">
            <img src={locat} alt="" className="game__intro_loc" />
            <h1 className="game__intro_title">{level.title}</h1>

            <p className="game__intro_text">{level.description}</p>
          </div>

          <Button variant="primary" onClick={handleStart}>
            Начать
          </Button>
        </div>
      )}

      {isFound && (
        <div className="game__found">
          <div className="game__found_card">
            <img src={checkIcon} alt="" className="game__found_check" />

            <h2 className="game__found_title">Плёнка найдена!</h2>

            <p className="game__found_text">
              Отлично! Ищи катушку в других локациях, чтобы стать участником
              розыгрыша реальной плёнки
            </p>
          </div>

          <Button variant="primary" onClick={handleGoMenu}>
            В меню
          </Button>
        </div>
      )}

      {isTimeOver && (
        <div className="game__over">
          <div className="game__over_card">
            <img src={cross} alt="" className="game__over_card_img" />
            <h2 className="game__over_card_header">Время закончилось</h2>

            <p className="game__over_card_text">
              Но всегда можно повторить попытку ещё раз
            </p>
          </div>
          <div className="game__over_btnblock">
            <Button variant="primary" onClick={handleRestart}>
              Повторить
            </Button>

            <Button variant="secondary" onClick={handleBack}>
              В меню
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;
