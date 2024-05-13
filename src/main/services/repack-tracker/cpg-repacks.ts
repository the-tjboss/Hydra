import { JSDOM } from "jsdom";

import { Repack } from "@main/entity";

import { requestWebPage, savePage } from "./helpers";
import { logger } from "../logger";
import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

export const getNewRepacksFromCPG = async (
  existingRepacks: Repack[] = [],
  page = 1
): Promise<void> => {
  const data = await requestWebPage(`https://cpgrepacks.site/page/${page}`);

  const { window } = new JSDOM(data);

  const repacks: QueryDeepPartialEntity<Repack>[] = [];

  try {
    Array.from(window.document.querySelectorAll(".post")).forEach(($post) => {
      const $title = $post.querySelector(".entry-title")!;
      const uploadDate = $post.querySelector("time")?.getAttribute("datetime");

      const $downloadInfo = Array.from(
        $post.querySelectorAll(".wp-block-heading")
      ).find(($heading) => $heading.textContent?.startsWith("Download"));

      /* Side note: CPG often misspells "Magnet" as "Magent" */
      const $magnet = Array.from($post.querySelectorAll("a")).find(
        ($a) =>
          $a.textContent?.startsWith("Magnet") ||
          $a.textContent?.startsWith("Magent")
      );

      const fileSize = ($downloadInfo?.textContent ?? "")
        .split("Download link => ")
        .at(1);

      repacks.push({
        title: $title.textContent!,
        fileSize: fileSize ?? "N/A",
        magnet: $magnet!.href,
        repacker: "CPG",
        page,
        uploadDate: uploadDate ? new Date(uploadDate) : new Date(),
      });
    });
  } catch (err: unknown) {
    logger.error((err as Error).message, { method: "getNewRepacksFromCPG" });
  }

  const newRepacks = repacks.filter(
    (repack) =>
      !existingRepacks.some(
        (existingRepack) => existingRepack.title === repack.title
      )
  );

  if (!newRepacks.length) return;

  await savePage(newRepacks);

  return getNewRepacksFromCPG(existingRepacks, page + 1);
};
