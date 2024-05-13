import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import type { Game } from "@types";

import { TextField } from "@renderer/components";
import { useDownload, useLibrary } from "@renderer/hooks";

import { routes } from "./routes";

import { MarkGithubIcon } from "@primer/octicons-react";
import TelegramLogo from "@renderer/assets/telegram-icon.svg?react";
import XLogo from "@renderer/assets/x-icon.svg?react";

import * as styles from "./sidebar.css";
import { GameStatus, GameStatusHelper } from "@shared";

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_INITIAL_WIDTH = 250;
const SIDEBAR_MAX_WIDTH = 450;

const initialSidebarWidth = window.localStorage.getItem("sidebarWidth");

export function Sidebar() {
  const { t } = useTranslation("sidebar");
  const { library, updateLibrary } = useLibrary();
  const navigate = useNavigate();

  const [filteredLibrary, setFilteredLibrary] = useState<Game[]>([]);

  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(
    initialSidebarWidth ? Number(initialSidebarWidth) : SIDEBAR_INITIAL_WIDTH
  );

  const socials = [
    {
      url: "https://t.me/hydralauncher",
      icon: <TelegramLogo />,
      label: t("telegram"),
    },
    {
      url: "https://twitter.com/hydralauncher",
      icon: <XLogo />,
      label: t("x"),
    },
    {
      url: "https://github.com/hydralauncher/hydra",
      icon: <MarkGithubIcon size={16} />,
      label: t("github"),
    },
  ];

  const location = useLocation();

  const { game: gameDownloading, progress } = useDownload();

  useEffect(() => {
    updateLibrary();
  }, [gameDownloading?.id, updateLibrary]);

  const isDownloading = library.some((game) =>
    GameStatusHelper.isDownloading(game.status)
  );

  const sidebarRef = useRef<HTMLElement>(null);

  const cursorPos = useRef({ x: 0 });
  const sidebarInitialWidth = useRef(0);

  const handleMouseDown: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    setIsResizing(true);
    cursorPos.current.x = event.screenX;
    sidebarInitialWidth.current =
      sidebarRef.current?.clientWidth || SIDEBAR_INITIAL_WIDTH;
  };

  const handleFilter: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setFilteredLibrary(
      library.filter((game) =>
        game.title
          .toLowerCase()
          .includes(event.target.value.toLocaleLowerCase())
      )
    );
  };

  useEffect(() => {
    setFilteredLibrary(library);
  }, [library]);

  useEffect(() => {
    window.onmousemove = (event: MouseEvent) => {
      if (isResizing) {
        const cursorXDelta = event.screenX - cursorPos.current.x;
        const newWidth = Math.max(
          SIDEBAR_MIN_WIDTH,
          Math.min(
            sidebarInitialWidth.current + cursorXDelta,
            SIDEBAR_MAX_WIDTH
          )
        );

        setSidebarWidth(newWidth);
        window.localStorage.setItem("sidebarWidth", String(newWidth));
      }
    };

    window.onmouseup = () => {
      if (isResizing) setIsResizing(false);
    };

    return () => {
      window.onmouseup = null;
      window.onmousemove = null;
    };
  }, [isResizing]);

  const getGameTitle = (game: Game) => {
    if (game.status === GameStatus.Paused)
      return t("paused", { title: game.title });

    if (gameDownloading?.id === game.id) {
      const isVerifying = GameStatusHelper.isVerifying(gameDownloading.status);

      if (isVerifying)
        return t(gameDownloading.status!, {
          title: game.title,
          percentage: progress,
        });

      return t("downloading", {
        title: game.title,
        percentage: progress,
      });
    }

    return game.title;
  };

  const handleSidebarItemClick = (path: string) => {
    if (path !== location.pathname) {
      navigate(path);
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className={styles.sidebar({ resizing: isResizing })}
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
      }}
    >
      <div
        className={styles.content({
          macos: window.electron.platform === "darwin",
        })}
      >
        {window.electron.platform === "darwin" && <h2>Hydra</h2>}

        <section className={styles.section}>
          <ul className={styles.menu}>
            {routes.map(({ nameKey, path, render }) => (
              <li
                key={nameKey}
                className={styles.menuItem({
                  active: location.pathname === path,
                })}
              >
                <button
                  type="button"
                  className={styles.menuItemButton}
                  onClick={() => handleSidebarItemClick(path)}
                >
                  {render(isDownloading)}
                  <span>{t(nameKey)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <small className={styles.sectionTitle}>{t("my_library")}</small>

          <TextField
            placeholder={t("filter")}
            onChange={handleFilter}
            theme="dark"
          />

          <ul className={styles.menu}>
            {filteredLibrary.map((game) => (
              <li
                key={game.id}
                className={styles.menuItem({
                  active:
                    location.pathname === `/game/${game.shop}/${game.objectID}`,
                  muted: game.status === GameStatus.Cancelled,
                })}
              >
                <button
                  type="button"
                  className={styles.menuItemButton}
                  onClick={() =>
                    handleSidebarItemClick(
                      `/game/${game.shop}/${game.objectID}`
                    )
                  }
                >
                  <img
                    className={styles.gameIcon}
                    src={game.iconUrl}
                    alt={game.title}
                  />
                  <span className={styles.menuItemButtonLabel}>
                    {getGameTitle(game)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <button
        type="button"
        className={styles.handle}
        onMouseDown={handleMouseDown}
      />

      <footer className={styles.sidebarFooter}>
        <div className={styles.footerText}>{t("follow_us")}</div>

        <span className={styles.footerSocialsContainer}>
          {socials.map((item) => {
            return (
              <button
                key={item.url}
                className={styles.footerSocialsItem}
                onClick={() => window.electron.openExternal(item.url)}
                title={item.label}
                aria-label={item.label}
              >
                {item.icon}
              </button>
            );
          })}
        </span>
      </footer>
    </aside>
  );
}
