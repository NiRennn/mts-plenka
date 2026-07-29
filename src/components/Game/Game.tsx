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
  getRandomGameVariant,
  savePassedLevelId,
  type GameLevel,
  type GameVariant,
} from "../../data/gameLevels";
import { preloadImageSrc } from "../../utils/preload";
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
  variantId?: number;
};

type SceneView = {
  scale: number;
  x: number;
  y: number;
};

type ScenePointer = {
  x: number;
  y: number;
  pointerType: string;
};

// const getRandomVariant = (level: GameLevel): GameVariant => {
//   const randomIndex = Math.floor(Math.random() * level.variants.length);
//   return level.variants[randomIndex];
// };

const getGameVariant = (level: GameLevel, variantId?: number): GameVariant => {
  const routeVariant = level.variants.find((item) => item.id === variantId);

  if (routeVariant) return routeVariant;

  const randomVariant = getRandomGameVariant(level);

  if (randomVariant) return randomVariant;

  throw new Error(`Level ${level.id} has no variants`);
};

function Game() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAppStore((state) => state.user);
  const locations = useAppStore((state) => state.locations);

  const resultSentRef = useRef(false);

  const sceneRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  const pointersRef = useRef(new Map<number, ScenePointer>());

  const [view, setView] = useState<SceneView>({
    scale: 1,
    x: 0,
    y: 0,
  });

  const viewRef = useRef<SceneView>({
    scale: 1,
    x: 0,
    y: 0,
  });

  const dragStateRef = useRef({
    isDragging: false,
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    startViewX: 0,
    startViewY: 0,
    didMove: false,
  });

  const pinchStateRef = useRef({
    isPinching: false,
    startDistance: 0,
    startScale: 1,
    startContentX: 0,
    startContentY: 0,
  });

  const wheelFrameRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef(0);
  const wheelPointRef = useRef({ x: 0, y: 0 });

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

  const initialVariant = useMemo(() => {
    return getGameVariant(level, locationState?.variantId);
  }, [level, locationState?.variantId]);

  const [variant, setVariant] = useState<GameVariant>(initialVariant);
  const [isRestartLoading, setIsRestartLoading] = useState(false);

  useEffect(() => {
    setVariant(initialVariant);
  }, [initialVariant]);

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

  const canMoveScene =
    isStarted && !isFound && !isTimeOver && !isExitConfirmOpen;

  const shouldShowTelegramBackButton =
    isStarted && !isFound && !isTimeOver && !isExitConfirmOpen;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const clampZoom = (value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
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

  const getScenePoint = (clientX: number, clientY: number) => {
    const scene = sceneRef.current;

    if (!scene) {
      return {
        x: clientX,
        y: clientY,
      };
    }

    const rect = scene.getBoundingClientRect();

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const getPointersEntries = () => {
    return Array.from(pointersRef.current.entries());
  };

  const clampView = useCallback((nextView: SceneView): SceneView => {
    const scene = sceneRef.current;
    const inner = innerRef.current;

    if (!scene || !inner) return nextView;

    const sceneWidth = scene.clientWidth;
    const sceneHeight = scene.clientHeight;

    const contentWidth = inner.offsetWidth;
    const contentHeight = inner.offsetHeight;

    const scaledWidth = contentWidth * nextView.scale;
    const scaledHeight = contentHeight * nextView.scale;

    let x = nextView.x;
    let y = nextView.y;

    if (scaledWidth <= sceneWidth) {
      x = (sceneWidth - scaledWidth) / 2;
    } else {
      const minX = sceneWidth - scaledWidth;
      x = Math.min(0, Math.max(minX, x));
    }

    if (scaledHeight <= sceneHeight) {
      y = (sceneHeight - scaledHeight) / 2;
    } else {
      const minY = sceneHeight - scaledHeight;
      y = Math.min(0, Math.max(minY, y));
    }

    return {
      scale: nextView.scale,
      x,
      y,
    };
  }, []);

  const commitView = useCallback(
    (nextView: SceneView) => {
      const clampedView = clampView(nextView);

      viewRef.current = clampedView;
      setView(clampedView);
    },
    [clampView],
  );

  const zoomAt = useCallback(
    (nextScaleRaw: number, clientX: number, clientY: number) => {
      const currentView = viewRef.current;
      const nextScale = clampZoom(nextScaleRaw);

      if (Math.abs(nextScale - currentView.scale) < 0.001) return;

      const point = getScenePoint(clientX, clientY);

      const contentX = (point.x - currentView.x) / currentView.scale;
      const contentY = (point.y - currentView.y) / currentView.scale;

      commitView({
        scale: nextScale,
        x: point.x - contentX * nextScale,
        y: point.y - contentY * nextScale,
      });
    },
    [commitView],
  );

  const stopSceneDrag = useCallback(() => {
    pointersRef.current.clear();

    dragStateRef.current.isDragging = false;
    dragStateRef.current.pointerId = null;

    pinchStateRef.current.isPinching = false;

    setIsSceneDragging(false);
  }, []);

  const resetSceneView = useCallback(() => {
    pointersRef.current.clear();

    dragStateRef.current = {
      isDragging: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      startViewX: 0,
      startViewY: 0,
      didMove: false,
    };

    pinchStateRef.current = {
      isPinching: false,
      startDistance: 0,
      startScale: 1,
      startContentX: 0,
      startContentY: 0,
    };

    setIsSceneDragging(false);

    commitView({
      scale: 1,
      x: 0,
      y: 0,
    });
  }, [commitView]);

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
    [user?.user_id, level.apiLocation],
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
        const nextScale = viewRef.current.scale * factor;

        zoomAt(nextScale, point.x, point.y);
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
  }, [canMoveScene, zoomAt]);

  const handleOpenExitConfirm = useCallback(() => {
    setIsExitConfirmOpen(true);
    stopSceneDrag();
  }, [stopSceneDrag]);

  const handleCloseExitConfirm = () => {
    setIsExitConfirmOpen(false);
  };

  const handleExitToMenu = async () => {
    if (isStarted && !isFound && !isTimeOver) {
      await sendGameResult(false);
    }

    navigate(appRoutes.MENU, { replace: true });
  };

  const handleScenePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!sceneRef.current || !canMoveScene) return;

    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();

    sceneRef.current.setPointerCapture(event.pointerId);

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      pointerType: event.pointerType,
    });

    const pointers = getPointersEntries();

    if (pointers.length === 1) {
      dragStateRef.current = {
        isDragging: true,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startViewX: viewRef.current.x,
        startViewY: viewRef.current.y,
        didMove: false,
      };

      setIsSceneDragging(true);
      return;
    }

    if (pointers.length >= 2) {
      const [, first] = pointers[0];
      const [, second] = pointers[1];

      const centerClient = getCenter(first, second);
      const centerScene = getScenePoint(centerClient.x, centerClient.y);

      const currentView = viewRef.current;

      pinchStateRef.current = {
        isPinching: true,
        startDistance: getDistance(first, second),
        startScale: currentView.scale,
        startContentX: (centerScene.x - currentView.x) / currentView.scale,
        startContentY: (centerScene.y - currentView.y) / currentView.scale,
      };

      dragStateRef.current.isDragging = false;
      dragStateRef.current.pointerId = null;

      setIsSceneDragging(false);
    }
  };

  const handleScenePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!sceneRef.current || !canMoveScene) return;
    if (!pointersRef.current.has(event.pointerId)) return;

    event.preventDefault();

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      pointerType: event.pointerType,
    });

    const pointers = getPointersEntries();

    if (pinchStateRef.current.isPinching && pointers.length >= 2) {
      const [, first] = pointers[0];
      const [, second] = pointers[1];

      const distance = getDistance(first, second);

      if (distance <= 0 || pinchStateRef.current.startDistance <= 0) return;

      const centerClient = getCenter(first, second);
      const centerScene = getScenePoint(centerClient.x, centerClient.y);

      const nextScale = clampZoom(
        pinchStateRef.current.startScale *
          (distance / pinchStateRef.current.startDistance),
      );

      commitView({
        scale: nextScale,
        x: centerScene.x - pinchStateRef.current.startContentX * nextScale,
        y: centerScene.y - pinchStateRef.current.startContentY * nextScale,
      });

      return;
    }

    const dragState = dragStateRef.current;

    if (!dragState.isDragging || dragState.pointerId !== event.pointerId) {
      return;
    }

    const diffX = event.clientX - dragState.startX;
    const diffY = event.clientY - dragState.startY;

    if (Math.abs(diffX) > 3 || Math.abs(diffY) > 3) {
      dragState.didMove = true;
    }

    commitView({
      scale: viewRef.current.scale,
      x: dragState.startViewX + diffX,
      y: dragState.startViewY + diffY,
    });
  };

  const handleScenePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const scene = sceneRef.current;

    pointersRef.current.delete(event.pointerId);

    if (scene?.hasPointerCapture(event.pointerId)) {
      scene.releasePointerCapture(event.pointerId);
    }

    const pointers = getPointersEntries();

    if (pointers.length >= 2) {
      const [, first] = pointers[0];
      const [, second] = pointers[1];

      const centerClient = getCenter(first, second);
      const centerScene = getScenePoint(centerClient.x, centerClient.y);

      const currentView = viewRef.current;

      pinchStateRef.current = {
        isPinching: true,
        startDistance: getDistance(first, second),
        startScale: currentView.scale,
        startContentX: (centerScene.x - currentView.x) / currentView.scale,
        startContentY: (centerScene.y - currentView.y) / currentView.scale,
      };

      return;
    }

    pinchStateRef.current.isPinching = false;

    if (pointers.length === 1 && canMoveScene) {
      const [remainingPointerId, remainingPointer] = pointers[0];

      dragStateRef.current = {
        isDragging: true,
        pointerId: remainingPointerId,
        startX: remainingPointer.x,
        startY: remainingPointer.y,
        startViewX: viewRef.current.x,
        startViewY: viewRef.current.y,
        didMove: dragStateRef.current.didMove,
      };

      setIsSceneDragging(true);
      return;
    }

    if (pointers.length === 0) {
      stopSceneDrag();
    }
  };

  const handleBack = () => {
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

  const handleRestart = async () => {
    if (isRestartLoading) return;

    setIsRestartLoading(true);
    stopSceneDrag();

    try {
      const nextVariant = getRandomGameVariant(level) ?? variant;

      const preloadResult = await preloadImageSrc(nextVariant.image);

      if (!preloadResult.ok) {
        console.error("Error preloading restart image:", preloadResult.error);
      }

      setVariant(nextVariant);

      setTimeLeft(GAME_TIME_SECONDS);
      setIsStarted(false);
      setIsFound(false);
      setIsExitConfirmOpen(false);

      resetSceneView();

      resultSentRef.current = false;
    } catch (error) {
      console.error("Error restarting game:", error);
    } finally {
      setIsRestartLoading(false);
    }
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
      data-loading={isRestartLoading}
    >
      <div
        className="game__scene"
        ref={sceneRef}
        data-dragging={isSceneDragging}
        onPointerDown={handleScenePointerDown}
        onPointerMove={handleScenePointerMove}
        onPointerUp={handleScenePointerUp}
        onPointerCancel={handleScenePointerUp}
        style={{
          overflow: "hidden",
          touchAction: "none",
        }}
      >
        <div
          ref={innerRef}
          className="game__scene_inner"
          style={{
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          }}
        >
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
              плёнку РИИЛ
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
            <img src={currentLocatImage} alt="" className="game__intro_loc" />

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
            <Button
              variant="primary"
              onClick={handleRestart}
              disabled={isRestartLoading}
            >
              Повторить
            </Button>

            <Button
              variant="secondary3"
              onClick={handleBack}
              disabled={isRestartLoading}
            >
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

      {isRestartLoading && (
        <div className="game__loading" aria-live="polite">
          <div className="game__loading_spinner" />

          <p className="game__loading_text">Загружаем локацию...</p>
        </div>
      )}
    </div>
  );
}

export default Game;
