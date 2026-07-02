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

    ...gameLevelImages,
  ]),
);