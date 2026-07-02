import plenka from "../assets/images/riil-plenka.png";
import mtsLogo from "../assets/icons/mts-logo.svg";

import onboardingCards from "../assets/images/ob-cards.png";
import onboardingRiil from "../assets/images/ob-riil.png";

import li1 from "../assets/icons/li-1.png";
import li2 from "../assets/icons/li-2.png";

import plenkaFullIcon from "../assets/icons/pl.png";
import foundPlenka from "../assets/icons/done-plenka.png";
import checkIcon from "../assets/icons/done.png";
import locat from "../assets/icons/loc1.png";
import finger from "../assets/icons/finger.png";
import cross from "../assets/icons/cross.png";

import cards from "../assets/images/ob-cards.png";
import luch from "../assets/images/ob-riil.png";

import menuPlenkaFull from "../assets/icons/plenka-full.png";
import menuPlenkaEmpty from "../assets/icons/plenka-empty.png";
import task from "../assets/icons/task.png";
import cafe from "../assets/images/cafe.jpg";
import treug from "../assets/icons/treug.svg";

import game11 from "../assets/images/game/game11.jpg";
import game12 from "../assets/images/game/game12.jpg";
import game13 from "../assets/images/game/game13.jpg";
import game14 from "../assets/images/game/game14.jpg";

import game21 from "../assets/images/game/game21.jpg";
import game22 from "../assets/images/game/game22.jpg";
import game23 from "../assets/images/game/game23.jpg";
import game24 from "../assets/images/game/game24.jpg";

import game31 from "../assets/images/game/game31.jpg";
import game32 from "../assets/images/game/game32.jpg";
import game33 from "../assets/images/game/game33.jpg";
import game34 from "../assets/images/game/game34.jpg";

import game41 from "../assets/images/game/game41.jpg";
import game42 from "../assets/images/game/game42.jpg";
import game43 from "../assets/images/game/game43.jpg";
import game44 from "../assets/images/game/game44.jpg";

import game51 from "../assets/images/game/game51.jpg";
import game52 from "../assets/images/game/game52.jpg";
import game53 from "../assets/images/game/game53.jpg";
import game54 from "../assets/images/game/game54.jpg";

import { gameLevels } from "./gameLevels";

const gameLevelImages = gameLevels.flatMap((level) =>
  level.variants.map((variant) => variant.image),
);

export const APP_PRELOAD_IMAGES = Array.from(
  new Set([
    plenka,
    mtsLogo,

    onboardingCards,
    onboardingRiil,

    li1,
    li2,

    plenkaFullIcon,
    foundPlenka,
    checkIcon,
    locat,
    finger,
    cross,

    cards,
    luch,

    menuPlenkaFull,
    menuPlenkaEmpty,
    task,
    cafe,
    treug,

    game11,
    game12,
    game13,
    game14,

    game21,
    game22,
    game23,
    game24,

    game31,
    game32,
    game33,
    game34,

    game41,
    game42,
    game43,
    game44,

    game51,
    game52,
    game53,
    game54,

    ...gameLevelImages,
  ]),
);
