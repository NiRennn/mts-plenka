import cafe1 from "../assets/images/game/game11.jpg";
import cafe2 from "../assets/images/game/game12.jpg";
import cafe3 from "../assets/images/game/game13.jpg";
import cafe4 from "../assets/images/game/game14.jpg";

import tusovka1 from "../assets/images/game/game21.jpg";
import tusovka2 from "../assets/images/game/game22.jpg";
import tusovka3 from "../assets/images/game/game23.jpg";
import tusovka4 from "../assets/images/game/game24.jpg";

import picnic1 from "../assets/images/game/game31.jpg";
import picnic2 from "../assets/images/game/game32.jpg";
import picnic3 from "../assets/images/game/game33.jpg";
import picnic4 from "../assets/images/game/game34.jpg";

import velo1 from "../assets/images/game/game41.jpg";
import velo2 from "../assets/images/game/game42.jpg";
import velo3 from "../assets/images/game/game43.jpg";
import velo4 from "../assets/images/game/game44.jpg";

import room1 from "../assets/images/game/game51.jpg";
import room2 from "../assets/images/game/game52.jpg";
import room3 from "../assets/images/game/game53.jpg";
import room4 from "../assets/images/game/game54.jpg";

export const PASSED_LEVELS_STORAGE_KEY = "riil-passed-levels";

export type GameTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GameVariant = {
  id: number;
  image: string;
  sceneWidth: number;
  target: GameTarget;
};

export type GameLevel = {
  id: number;
  title: string;
  menuTitle: string;
  description: string;
  variants: GameVariant[];
  location: string;
  apiLocation: string;
};

export const gameLevels: GameLevel[] = [
  {
    id: 1,
    title: "ЛЕТНЯЯ ТУСОВКА",
    apiLocation: "ЛЕТНЯЯ ТУСОВКА",

    menuTitle: "ЛЕТНЯЯ ТУСОВКА",
    description:
      "Тёплый вечер, звёздное небо, друзья и\u00A0приятная музыка Тут точно у\u00A0кого‑то есть плёнка!",
    variants: [
      {
        id: 1,
        image: tusovka1,
        sceneWidth: 900,
        target: { x: 43.5, y: 64, width: 2, height: 4 },
      },
      {
        id: 2,
        image: tusovka2,
        sceneWidth: 900,
        target: { x: 55, y: 67, width: 2, height: 4 },
      },
      {
        id: 3,
        image: tusovka3,
        sceneWidth: 900,
        target: { x: 74.5, y: 65, width: 2, height: 4 },
      },
      {
        id: 4,
        image: tusovka4,
        sceneWidth: 900,
        target: { x: 79.8, y: 77, width: 2, height: 4 },
      },
    ],
    location: "Локация А",
  },
  {
    id: 2,
    title: "КОФЕЙНЯ",
    apiLocation: "МОДНАЯ КОФЕЙНЯ",

    menuTitle: "МОДНАЯ КОФЕЙНЯ",
    description:
      "Ты\u00A0зашёл в\u00A0модную кофейню за\u00A0своим фильтр-кофе. Посмотри внимательнее по\u00A0сторонам, где‑то тут спрятана катушка плёнки…",
    variants: [
      {
        id: 1,
        image: cafe1,
        sceneWidth: 900,
        target: { x: 57, y: 34, width: 2, height: 4 },
      },
      {
        id: 2,
        image: cafe2,
        sceneWidth: 900,
        target: { x: 89, y: 62, width: 2, height: 4 },
      },
      {
        id: 3,
        image: cafe3,
        sceneWidth: 900,
        target: { x: 32.5, y: 64.5, width: 2, height: 4 },
      },
      {
        id: 4,
        image: cafe4,
        sceneWidth: 900,
        target: { x: 83.5, y: 33, width: 2, height: 4 },
      },
    ],
    location: "Локация Б",
  },
  {
    id: 3,
    title: "ПИКНИК",
    apiLocation: "ПИКНИК",
    menuTitle: "ПИКНИК",
    description:
      "Если в\u00A0галлерее нет фотографии с\u00A0пикника\u00A0– значит не\u00A0было и\u00A0лета! Найди среди отдыхающих катушку плёнки",
    variants: [
      {
        id: 1,
        image: picnic1,
        sceneWidth: 900,
        target: { x: 56.5, y: 69.5, width: 2, height: 4 },
      },
      {
        id: 2,
        image: picnic2,
        sceneWidth: 900,
        target: { x: 29, y: 78, width: 2, height: 4 },
      },
      {
        id: 3,
        image: picnic3,
        sceneWidth: 900,
        target: { x: 63, y: 78, width: 2, height: 4 },
      },
      {
        id: 4,
        image: picnic4,
        sceneWidth: 900,
        target: { x: 91.5, y: 80, width: 2, height: 4 },
      },
    ],
    location: "Локация В",
  },
  {
    id: 4,
    title: "ВЕЛОЗАЕЗД",
    apiLocation: "ВЕЛОЗАЕЗД",

    menuTitle: "ВЕЛОЗАЕЗД",
    description:
      "Вечная дилемма\u00A0– взять электросамокат или\u00A0велосипед для\u00A0прогулки с\u00A0ветерком? Компания друзей уже решила за\u00A0тебя. Кстати, у\u00A0кого-то из\u00A0них есть катушка плёнки.",
    variants: [
      {
        id: 1,
        image: velo1,
        sceneWidth: 900,
        target: { x: 50.5, y: 56, width: 2, height: 4 },
      },
      {
        id: 2,
        image: velo2,
        sceneWidth: 900,
        target: { x: 85, y: 78.5, width: 2, height: 4 },
      },
      {
        id: 3,
        image: velo3,
        sceneWidth: 900,
        target: { x: 93.5, y: 54, width: 2, height: 4 },
      },
      {
        id: 4,
        image: velo4,
        sceneWidth: 900,
        target: { x: 42.5, y: 55.5, width: 2, height: 4 },
      },
    ],
    location: "Локация Г",
  },
  {
    id: 5,
    title: "ТВОЯ КОМНАТА",
    apiLocation: "ТВОЯ КОМНАТА",

    menuTitle: "ТВОЯ КОМНАТА",
    description:
      "Даже летом иногда хочется почиллить дома, в\u00A0своей комнате. И\u00A0где‑то среди всех вещей можно найти плёнку..",
    variants: [
      {
        id: 1,
        image: room1,
        sceneWidth: 900,
        target: { x: 36, y: 57, width: 2, height: 4 },
      },
      {
        id: 2,
        image: room2,
        sceneWidth: 900,
        target: { x: 33.7, y: 80.5, width: 2, height: 4 },
      },
      {
        id: 3,
        image: room3,
        sceneWidth: 900,
        target: { x: 82, y: 55, width: 2, height: 4 },
      },
      {
        id: 4,
        image: room4,
        sceneWidth: 900,
        target: { x: 67.5, y: 67, width: 2, height: 4 },
      },
    ],
    location: "Локация Д",
  },
];

export const getPassedLevelIds = (): number[] => {
  try {
    const value = localStorage.getItem(PASSED_LEVELS_STORAGE_KEY);

    if (!value) return [];

    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id) => typeof id === "number");
  } catch {
    return [];
  }
};

export const savePassedLevelId = (levelId: number) => {
  const passedLevelIds = getPassedLevelIds();

  if (passedLevelIds.includes(levelId)) return;

  localStorage.setItem(
    PASSED_LEVELS_STORAGE_KEY,
    JSON.stringify([...passedLevelIds, levelId]),
  );
};
