import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
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
import checkIcon from "../../assets/icons/done.png";
import locat1 from "../../assets/icons/loc1.png";
import locat2 from "../../assets/icons/loc2.png";
import locat3 from "../../assets/icons/loc3.png";
import locat4 from "../../assets/icons/loc4.png";
import locat5 from "../../assets/icons/loc5.png";
import finger from "../../assets/icons/finger.png";
import cross from "../../assets/icons/cross.png";
import quest from "../../assets/icons/quest.png";

const GAME_TIME_SECONDS = 1 * 60;

const DEBUG_TARGET = false;

const MIN_PC_ZOOM = 1;
const MAX_PC_ZOOM = 3;
const PC_ZOOM_SENSITIVITY = 0.0015;

// const PC_ZOOM_SENSITIVITY = 0.0015;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

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
  const locations = useAppStore((state) => state.locations);

  const resultSentRef = useRef(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);

  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    didMove: false,
  });

  const [pcZoom, setPcZoom] = useState(1);
  const pcZoomRef = useRef(1);

  const setPcZoomValue = useCallback((value: number) => {
    pcZoomRef.current = value;
    setPcZoom(value);
  }, []);

  const sceneInnerStyle = useMemo<CSSProperties>(() => {
    return {
      height: `${pcZoom * 100}%`,
    };
  }, [pcZoom]);

  //   const nextZoom = clamp(
  //   currentZoom * Math.exp(-event.deltaY * PC_ZOOM_SENSITIVITY),
  //   MIN_PC_ZOOM,
  //   MAX_PC_ZOOM,
  // );

  const [isSceneDragging, setIsSceneDragging] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isFound, setIsFound] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME_SECONDS);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

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

  const locatImages = [locat1, locat2, locat3, locat4, locat5];

  const passedLevelsCount = useMemo(() => {
    return gameLevels.filter((gameLevel) =>
      locations.some(
        (item) => item.location === gameLevel.apiLocation && item.is_success,
      ),
    ).length;
  }, [locations]);

  const currentLocatImage =
    locatImages[Math.min(passedLevelsCount, locatImages.length - 1)];

  const isTimeOver = isStarted && !isFound && timeLeft === 0;

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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const canMoveScene =
    isStarted && !isFound && !isTimeOver && !isExitConfirmOpen;

  useEffect(() => {
    const scene = sceneRef.current;

    if (!scene) return;

    const handleWheel = (event: globalThis.WheelEvent) => {
      if (!canMoveScene) return;

      event.preventDefault();

      const rect = scene.getBoundingClientRect();

      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;

      const currentZoom = pcZoomRef.current;

      const nextZoom = clamp(
        currentZoom * Math.exp(-event.deltaY * PC_ZOOM_SENSITIVITY),
        MIN_PC_ZOOM,
        MAX_PC_ZOOM,
      );

      if (nextZoom === currentZoom) return;

      const contentX = (scene.scrollLeft + localX) / currentZoom;
      const contentY = (scene.scrollTop + localY) / currentZoom;

      setPcZoomValue(nextZoom);

      requestAnimationFrame(() => {
        scene.scrollLeft = contentX * nextZoom - localX;
        scene.scrollTop = contentY * nextZoom - localY;
      });
    };

    scene.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      scene.removeEventListener("wheel", handleWheel);
    };
  }, [canMoveScene, setPcZoomValue]);

  const handleOpenExitConfirm = useCallback(() => {
    setIsExitConfirmOpen(true);
    stopSceneDrag();
  }, []);

  const handleCloseExitConfirm = () => {
    setIsExitConfirmOpen(false);
  };

  const handleExitToMenu = async () => {
    if (isStarted && !isFound && !isTimeOver) {
      await sendGameResult(false);
    }

    navigate(appRoutes.MENU, { replace: true });
  };

  const handleSceneMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!sceneRef.current || !canMoveScene || event.button !== 0) return;

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: sceneRef.current.scrollLeft,
      scrollTop: sceneRef.current.scrollTop,
      didMove: false,
    };

    setIsSceneDragging(true);
  };

  const handleSceneMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!sceneRef.current || !dragState.isDragging) return;

    event.preventDefault();

    const diffX = event.clientX - dragState.startX;
    const diffY = event.clientY - dragState.startY;

    if (Math.abs(diffX) > 3 || Math.abs(diffY) > 3) {
      dragState.didMove = true;
    }

    sceneRef.current.scrollLeft = dragState.scrollLeft - diffX;
    sceneRef.current.scrollTop = dragState.scrollTop - diffY;
  };

  const stopSceneDrag = () => {
    dragStateRef.current.isDragging = false;
    setIsSceneDragging(false);
  };

  const handleBack = () => {
    // handleOpenExitConfirm();
    navigate(appRoutes.MENU, { replace: true });
  };

  const resetSceneView = useCallback(() => {
    setPcZoomValue(1);

    requestAnimationFrame(() => {
      if (!sceneRef.current) return;

      sceneRef.current.scrollLeft = 0;
      sceneRef.current.scrollTop = 0;
    });
  }, [setPcZoomValue]);

  const handleStart = () => {
    resultSentRef.current = false;
    setIsExitConfirmOpen(false);
    setIsStarted(true);

    resetSceneView();
  };

  const handleFindPlenka = async () => {
    if (!isStarted || isFound || isTimeOver) return;

    if (dragStateRef.current.didMove) return;

    setIsFound(true);
    savePassedLevelId(level.id);

    await sendGameResult(true);
  };

  const handleGoMenu = () => {
    navigate(appRoutes.MENU, { replace: true });
  };

  const handleRestart = () => {
    resultSentRef.current = false;

    setTimeLeft(GAME_TIME_SECONDS);
    setIsStarted(false);
    setIsFound(false);
    setIsExitConfirmOpen(false);

    resetSceneView();
  };

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    const backButton = tg?.BackButton;

    if (!backButton) return;

    backButton.show();
    backButton.onClick(handleOpenExitConfirm);

    return () => {
      backButton.offClick(handleOpenExitConfirm);
      backButton.hide();
    };
  }, [handleOpenExitConfirm]);

  useEffect(() => {
    if (!isStarted || isFound || isTimeOver || isExitConfirmOpen) return;

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
  }, [isStarted, isFound, isTimeOver, isExitConfirmOpen]);

  useEffect(() => {
    if (!isTimeOver) return;

    sendGameResult(false);
  }, [isTimeOver, sendGameResult]);

  return (
    <div
      className="game"
      data-started={isStarted}
      data-found={isFound}
      data-time-over={isTimeOver}
      data-exit-confirm={isExitConfirmOpen}
      data-debug-target={DEBUG_TARGET}
    >
      <div
        className="game__scene"
        ref={sceneRef}
        data-dragging={isSceneDragging}
        onMouseDown={handleSceneMouseDown}
        onMouseMove={handleSceneMouseMove}
        onMouseUp={stopSceneDrag}
        onMouseLeave={stopSceneDrag}
      >
        <div className="game__scene_inner" style={sceneInnerStyle}>
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
          ></button>
        </div>
      </div>
      {isStarted && !isFound && !isTimeOver && !isExitConfirmOpen && (
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

      {isStarted && !isFound && !isTimeOver && !isExitConfirmOpen && (
        <div className="Game__hint_wrapper">
          <div className="game__hint">
            <img src={finger} alt="" className="game__hint_icon" />

            <p className="game__hint_text">
              Перемещай экран, чтобы увидеть всю локацию
            </p>
          </div>
        </div>
      )}

      {!isStarted && (
        <div className="game__intro">
          <div className="game__intro_card">
            <img src={currentLocatImage} alt="" className="game__intro_loc" />{" "}
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
              Отлично! Ищи катушку в&nbsp;других локациях, чтобы стать
              участником розыгрыша реальной плёнки
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

            <Button variant="secondary3" onClick={handleBack}>
              В&nbsp;меню
            </Button>
          </div>
        </div>
      )}
      {isExitConfirmOpen && !isFound && !isTimeOver && (
        <div className="game__exit">
          <div className="game__exit_card">
            <img src={quest} alt="" className="game__exit_icon" />
            <h2 className="game__exit_title">Хочешь выйти?</h2>

            <p className="game__exit_text">
              Время ещё есть, да и плёнка не найдена.
              <br />
              Может, продолжим?
            </p>
          </div>

          <div className="game__exit_btnblock">
            <Button variant="primary" onClick={handleCloseExitConfirm}>
              Продолжить
            </Button>

            <Button variant="secondary3" onClick={handleExitToMenu}>
              В меню
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;
