import Color from "color";
import { average } from "color.js";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import type {
  Game,
  GameRepack,
  GameShop,
  HowLongToBeatCategory,
  ShopDetails,
  SteamAppDetails,
} from "@types";

import { Button } from "@renderer/components";
import { setHeaderTitle } from "@renderer/features";
import { getSteamLanguage, steamUrlBuilder } from "@renderer/helpers";
import { useAppDispatch, useDownload } from "@renderer/hooks";

import starsAnimation from "@renderer/assets/lottie/stars.json";

import Lottie from "lottie-react";
import { useTranslation } from "react-i18next";
import { SkeletonTheme } from "react-loading-skeleton";
import { DescriptionHeader } from "./description-header";
import { GameDetailsSkeleton } from "./game-details-skeleton";
import * as styles from "./game-details.css";
import { HeroPanel } from "./hero";
import { HowLongToBeatSection } from "./how-long-to-beat-section";
import { RepacksModal } from "./repacks-modal";

import { vars } from "../../theme.css";
import {
  DODIInstallationGuide,
  DONT_SHOW_DODI_INSTRUCTIONS_KEY,
  DONT_SHOW_ONLINE_FIX_INSTRUCTIONS_KEY,
  OnlineFixInstallationGuide,
} from "./installation-guides";
import { GallerySlider } from "./gallery-slider";

export function GameDetails() {
  const { objectID, shop } = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRandomGame, setIsLoadingRandomGame] = useState(false);
  const [color, setColor] = useState({ dark: "", light: "" });
  const [gameDetails, setGameDetails] = useState<ShopDetails | null>(null);
  const [howLongToBeat, setHowLongToBeat] = useState<{
    isLoading: boolean;
    data: HowLongToBeatCategory[] | null;
  }>({ isLoading: true, data: null });

  const [game, setGame] = useState<Game | null>(null);
  const [isGamePlaying, setIsGamePlaying] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState<
    null | "onlinefix" | "DODI"
  >(null);

  const [activeRequirement, setActiveRequirement] =
    useState<keyof SteamAppDetails["pc_requirements"]>("minimum");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { t, i18n } = useTranslation("game_details");

  const [showRepacksModal, setShowRepacksModal] = useState(false);

  const dispatch = useAppDispatch();

  const { game: gameDownloading, startDownload } = useDownload();

  const heroImage = steamUrlBuilder.libraryHero(objectID!);

  const handleHeroLoad = () => {
    average(heroImage, { amount: 1, format: "hex" })
      .then((color) => {
        const darkColor = new Color(color).darken(0.6).toString() as string;
        setColor({ light: color as string, dark: darkColor });
      })
      .catch(() => {});
  };

  const getGame = useCallback(() => {
    window.electron
      .getGameByObjectID(objectID!)
      .then((result) => setGame(result));
  }, [setGame, objectID]);

  useEffect(() => {
    getGame();
  }, [getGame, gameDownloading?.id]);
  useEffect(() => {
    setGame(null);
    setIsLoading(true);
    setIsGamePlaying(false);
    dispatch(setHeaderTitle(""));

    window.electron
      .getGameShopDetails(objectID!, "steam", getSteamLanguage(i18n.language))
      .then((result) => {
        if (!result) {
          navigate(-1);
          return;
        }

        window.electron
          .getHowLongToBeat(objectID!, "steam", result.name)
          .then((data) => {
            setHowLongToBeat({ isLoading: false, data });
          });

        setGameDetails(result);
        dispatch(setHeaderTitle(result.name));
        setIsLoadingRandomGame(false);
      })
      .finally(() => {
        setIsLoading(false);
      });

    getGame();
    setHowLongToBeat({ isLoading: true, data: null });
  }, [getGame, dispatch, navigate, objectID, i18n.language]);

  const isGameDownloading = gameDownloading?.id === game?.id;

  useEffect(() => {
    if (isGameDownloading)
      setGame((prev) => {
        if (prev === null || !gameDownloading?.status) return prev;
        return { ...prev, status: gameDownloading?.status };
      });
  }, [isGameDownloading, gameDownloading?.status]);

  useEffect(() => {
    const listeners = [
      window.electron.onGameClose(() => {
        if (isGamePlaying) setIsGamePlaying(false);
      }),
      window.electron.onPlaytime((gameId) => {
        if (gameId === game?.id) {
          if (!isGamePlaying) setIsGamePlaying(true);
          getGame();
        }
      }),
    ];

    return () => {
      listeners.forEach((unsubscribe) => unsubscribe());
    };
  }, [game?.id, isGamePlaying, getGame]);

  const handleStartDownload = async (
    repack: GameRepack,
    downloadPath: string
  ) => {
    if (gameDetails) {
      return startDownload(
        repack.id,
        gameDetails.objectID,
        gameDetails.name,
        shop as GameShop,
        downloadPath
      ).then(() => {
        getGame();
        setShowRepacksModal(false);

        if (
          repack.repacker === "onlinefix" &&
          !window.localStorage.getItem(DONT_SHOW_ONLINE_FIX_INSTRUCTIONS_KEY)
        ) {
          setShowInstructionsModal("onlinefix");
        } else if (
          repack.repacker === "DODI" &&
          !window.localStorage.getItem(DONT_SHOW_DODI_INSTRUCTIONS_KEY)
        ) {
          setShowInstructionsModal("DODI");
        }
      });
    }
  };

  const handleRandomizerClick = async () => {
    setIsLoadingRandomGame(true);
    const randomGameObjectID = await window.electron.getRandomGame();

    const searchParams = new URLSearchParams({
      fromRandomizer: "1",
    });

    navigate(`/game/steam/${randomGameObjectID}?${searchParams.toString()}`);
  };

  const fromRandomizer = searchParams.get("fromRandomizer");

  return (
    <SkeletonTheme baseColor={vars.color.background} highlightColor="#444">
      {gameDetails && (
        <RepacksModal
          visible={showRepacksModal}
          gameDetails={gameDetails}
          startDownload={handleStartDownload}
          onClose={() => setShowRepacksModal(false)}
        />
      )}

      <OnlineFixInstallationGuide
        visible={showInstructionsModal === "onlinefix"}
        onClose={() => setShowInstructionsModal(null)}
      />

      <DODIInstallationGuide
        windowColor={color.light}
        visible={showInstructionsModal === "DODI"}
        onClose={() => setShowInstructionsModal(null)}
      />

      {isLoading ? (
        <GameDetailsSkeleton />
      ) : (
        <section className={styles.container}>
          <div className={styles.hero}>
            <img
              src={heroImage}
              className={styles.heroImage}
              alt={game?.title}
              onLoad={handleHeroLoad}
            />
            <div className={styles.heroBackdrop}>
              <div className={styles.heroContent}>
                <img
                  src={steamUrlBuilder.logo(objectID!)}
                  style={{ width: 300, alignSelf: "flex-end" }}
                  alt={game?.title}
                />
              </div>
            </div>
          </div>

          <HeroPanel
            game={game}
            color={color.dark}
            gameDetails={gameDetails}
            openRepacksModal={() => setShowRepacksModal(true)}
            getGame={getGame}
            isGamePlaying={isGamePlaying}
          />

          <div className={styles.descriptionContainer}>
            <div className={styles.descriptionContent}>
              <DescriptionHeader gameDetails={gameDetails} />

              <GallerySlider gameDetails={gameDetails} />

              <div
                dangerouslySetInnerHTML={{
                  __html: gameDetails?.about_the_game ?? "",
                }}
                className={styles.description}
              />
            </div>

            <div className={styles.contentSidebar}>
              <HowLongToBeatSection
                howLongToBeatData={howLongToBeat.data}
                isLoading={howLongToBeat.isLoading}
              />

              <div
                className={styles.contentSidebarTitle}
                style={{ border: "none" }}
              >
                <h3>{t("requirements")}</h3>
              </div>

              <div className={styles.requirementButtonContainer}>
                <Button
                  className={styles.requirementButton}
                  onClick={() => setActiveRequirement("minimum")}
                  theme={
                    activeRequirement === "minimum" ? "primary" : "outline"
                  }
                >
                  {t("minimum")}
                </Button>
                <Button
                  className={styles.requirementButton}
                  onClick={() => setActiveRequirement("recommended")}
                  theme={
                    activeRequirement === "recommended" ? "primary" : "outline"
                  }
                >
                  {t("recommended")}
                </Button>
              </div>

              <div
                className={styles.requirementsDetails}
                dangerouslySetInnerHTML={{
                  __html:
                    gameDetails?.pc_requirements?.[activeRequirement] ??
                    t(`no_${activeRequirement}_requirements`, {
                      title: gameDetails?.name,
                    }),
                }}
              />
            </div>
          </div>
        </section>
      )}

      {fromRandomizer && (
        <Button
          className={styles.randomizerButton}
          onClick={handleRandomizerClick}
          theme="outline"
          disabled={isLoadingRandomGame}
        >
          <div style={{ width: 16, height: 16, position: "relative" }}>
            <Lottie
              animationData={starsAnimation}
              style={{ width: 70, position: "absolute", top: -28, left: -27 }}
              loop
            />
          </div>
          {t("next_suggestion")}
        </Button>
      )}
    </SkeletonTheme>
  );
}
