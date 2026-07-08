import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
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
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const WHEEL_ZOOM_SPEED = 0.0012;

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

  const pointersRef = useRef(
    new Map<number, { x: number; y: number; pointerType: string }>(),
  );

  const dragStateRef = useRef({
    isDragging: false,
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    didMove: false,
  });

  const pinchStateRef = useRef({
    isPinching: false,
    startDistance: 0,
    startZoom: 1,
    lastCenterX: 0,
    lastCenterY: 0,
  });

  const wheelFrameRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef(0);
  const wheelPointRef = useRef({ x: 0, y: 0 });

  const [isSceneDragging, setIsSceneDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
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

    const shouldShowTelegramBackButton =
  isStarted && !isFound && !isTimeOver && !isExitConfirmOpen;

  const clampZoom = (value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  };

  const getPointersArray = () => {
    return Array.from(pointersRef.current.values());
  };

  const getDistance = (
    first: { x: number; y: number },
    second: { x: number; y: number },
  ) => {
    return Math.hypot(second.x - first.x, second.y - first.y);
  };

  const getCenter = (
    first: { x: number; y: number },
    second: { x: number; y: number },
  ) => {
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    };
  };

  const applyZoom = useCallback(
    (nextZoomRaw: number, clientX: number, clientY: number) => {
      const scene = sceneRef.current;

      if (!scene) return;

      const previousZoom = zoomRef.current;
      const nextZoom = clampZoom(nextZoomRaw);

      if (Math.abs(nextZoom - previousZoom) < 0.001) return;

      const rect = scene.getBoundingClientRect();

      const pointerX = clientX - rect.left;
      const pointerY = clientY - rect.top;

      const contentX = scene.scrollLeft + pointerX;
      const contentY = scene.scrollTop + pointerY;

      const zoomRatio = nextZoom / previousZoom;

      zoomRef.current = nextZoom;
      setZoom(nextZoom);

      requestAnimationFrame(() => {
        scene.scrollLeft = contentX * zoomRatio - pointerX;
        scene.scrollTop = contentY * zoomRatio - pointerY;
      });
    },
    [],
  );

  useEffect(() => {
    const scene = sceneRef.current;

    if (!scene) return;

    const normalizeWheelDelta = (event: globalThis.WheelEvent) => {
      let delta = event.deltaY;

      if (event.deltaMode === 1) {
        delta *= 16;
      }

      if (event.deltaMode === 2) {
        delta *= scene.clientHeight;
      }

      return delta;
    };

    const handleWheel = (event: globalThis.WheelEvent) => {
      if (!canMoveScene) return;

      event.preventDefault();

      wheelDeltaRef.current += normalizeWheelDelta(event);
      wheelPointRef.current = {
        x: event.clientX,
        y: event.clientY,
      };

      if (wheelFrameRef.current !== null) return;

      wheelFrameRef.current = requestAnimationFrame(() => {
        const delta = wheelDeltaRef.current;
        const point = wheelPointRef.current;

        wheelDeltaRef.current = 0;
        wheelFrameRef.current = null;

        const factor = Math.exp(-delta * WHEEL_ZOOM_SPEED);
        const nextZoom = zoomRef.current * factor;

        applyZoom(nextZoom, point.x, point.y);
      });
    };

    scene.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      scene.removeEventListener("wheel", handleWheel);

      if (wheelFrameRef.current !== null) {
        cancelAnimationFrame(wheelFrameRef.current);
        wheelFrameRef.current = null;
      }
    };
  }, [applyZoom, canMoveScene]);

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

  // const handleSceneMouseDown = (event: MouseEvent<HTMLDivElement>) => {
  //   if (!sceneRef.current || !canMoveScene || event.button !== 0) return;

  //   dragStateRef.current = {
  //     isDragging: true,
  //     startX: event.clientX,
  //     startY: event.clientY,
  //     scrollLeft: sceneRef.current.scrollLeft,
  //     scrollTop: sceneRef.current.scrollTop,
  //     didMove: false,
  //   };

  //   setIsSceneDragging(true);
  // };

  // const handleSceneMouseMove = (event: MouseEvent<HTMLDivElement>) => {
  //   const dragState = dragStateRef.current;

  //   if (!sceneRef.current || !dragState.isDragging) return;

  //   event.preventDefault();

  //   const diffX = event.clientX - dragState.startX;
  //   const diffY = event.clientY - dragState.startY;

  //   if (Math.abs(diffX) > 3 || Math.abs(diffY) > 3) {
  //     dragState.didMove = true;
  //   }

  //   sceneRef.current.scrollLeft = dragState.scrollLeft - diffX;
  //   sceneRef.current.scrollTop = dragState.scrollTop - diffY;
  // };

  // const stopSceneDrag = () => {
  //   dragStateRef.current.isDragging = false;
  //   setIsSceneDragging(false);
  // };

  const stopSceneDrag = () => {
    dragStateRef.current.isDragging = false;
    dragStateRef.current.pointerId = null;
    pinchStateRef.current.isPinching = false;
    setIsSceneDragging(false);
  };

  const handleScenePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!sceneRef.current || !canMoveScene) return;

    if (event.pointerType === "mouse" && event.button !== 0) return;

    sceneRef.current.setPointerCapture(event.pointerId);

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      pointerType: event.pointerType,
    });

    const pointers = getPointersArray();

    if (pointers.length === 1) {
      dragStateRef.current = {
        isDragging: true,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: sceneRef.current.scrollLeft,
        scrollTop: sceneRef.current.scrollTop,
        didMove: false,
      };

      setIsSceneDragging(true);
      return;
    }

    if (pointers.length === 2) {
      const [first, second] = pointers;
      const center = getCenter(first, second);

      pinchStateRef.current = {
        isPinching: true,
        startDistance: getDistance(first, second),
        startZoom: zoomRef.current,
        lastCenterX: center.x,
        lastCenterY: center.y,
      };

      dragStateRef.current.isDragging = false;
      dragStateRef.current.pointerId = null;
      setIsSceneDragging(false);
    }
  };

  const handleScenePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const scene = sceneRef.current;

    if (!scene || !canMoveScene) return;

    if (!pointersRef.current.has(event.pointerId)) return;

    event.preventDefault();

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      pointerType: event.pointerType,
    });

    const pointers = getPointersArray();

    if (pinchStateRef.current.isPinching && pointers.length >= 2) {
      const [first, second] = pointers;
      const distance = getDistance(first, second);
      const center = getCenter(first, second);

      const diffCenterX = center.x - pinchStateRef.current.lastCenterX;
      const diffCenterY = center.y - pinchStateRef.current.lastCenterY;

      scene.scrollLeft -= diffCenterX;
      scene.scrollTop -= diffCenterY;

      pinchStateRef.current.lastCenterX = center.x;
      pinchStateRef.current.lastCenterY = center.y;

      const nextZoom =
        pinchStateRef.current.startZoom *
        (distance / pinchStateRef.current.startDistance);

      applyZoom(nextZoom, center.x, center.y);

      return;
    }

    const dragState = dragStateRef.current;

    if (!dragState.isDragging || dragState.pointerId !== event.pointerId)
      return;

    const diffX = event.clientX - dragState.startX;
    const diffY = event.clientY - dragState.startY;

    if (Math.abs(diffX) > 3 || Math.abs(diffY) > 3) {
      dragState.didMove = true;
    }

    scene.scrollLeft = dragState.scrollLeft - diffX;
    scene.scrollTop = dragState.scrollTop - diffY;
  };

  const handleScenePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const scene = sceneRef.current;

    pointersRef.current.delete(event.pointerId);

    if (scene?.hasPointerCapture(event.pointerId)) {
      scene.releasePointerCapture(event.pointerId);
    }

    const pointers = getPointersArray();

    if (pointers.length < 2) {
      pinchStateRef.current.isPinching = false;
    }

    if (pointers.length === 1 && scene && canMoveScene) {
      const [remainingPointer] = pointers;

      dragStateRef.current = {
        isDragging: true,
        pointerId: null,
        startX: remainingPointer.x,
        startY: remainingPointer.y,
        scrollLeft: scene.scrollLeft,
        scrollTop: scene.scrollTop,
        didMove: dragStateRef.current.didMove,
      };

      return;
    }

    if (pointers.length === 0) {
      stopSceneDrag();
    }
  };

  const resetSceneView = () => {
    pointersRef.current.clear();

    dragStateRef.current = {
      isDragging: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      scrollLeft: 0,
      scrollTop: 0,
      didMove: false,
    };

    pinchStateRef.current = {
      isPinching: false,
      startDistance: 0,
      startZoom: 1,
      lastCenterX: 0,
      lastCenterY: 0,
    };

    setIsSceneDragging(false);

    zoomRef.current = 1;
    setZoom(1);

    requestAnimationFrame(() => {
      sceneRef.current?.scrollTo({
        left: 0,
        top: 0,
        behavior: "instant",
      });
    });
  };

  const handleBack = () => {
    // handleOpenExitConfirm();
    navigate(appRoutes.MENU, { replace: true });
  };

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

  if (!shouldShowTelegramBackButton) {
    backButton.offClick(handleOpenExitConfirm);
    backButton.hide();
    return;
  }

  backButton.show();
  backButton.onClick(handleOpenExitConfirm);

  return () => {
    backButton.offClick(handleOpenExitConfirm);
    backButton.hide();
  };
}, [shouldShowTelegramBackButton, handleOpenExitConfirm]);

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
        onPointerDown={handleScenePointerDown}
        onPointerMove={handleScenePointerMove}
        onPointerUp={handleScenePointerUp}
        onPointerCancel={handleScenePointerUp}
      >
        {" "}
        <div
          className="game__scene_inner"
          style={{
            height: `${zoom * 100}%`,
            minWidth: `${zoom * 100}vw`,
          }}
        >
          {" "}
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
            onPointerDown={(event) => {
              dragStateRef.current.didMove = false;
              event.stopPropagation();
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
