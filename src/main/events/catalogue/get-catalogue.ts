import { formatName, getSteamAppAsset, repackerFormatter } from "@main/helpers";
import type { CatalogueCategory, CatalogueEntry, GameShop } from "@types";

import { stateManager } from "@main/state-manager";
import { searchGames, searchRepacks } from "../helpers/search-games";
import { registerEvent } from "../register-event";
import { requestSteam250 } from "@main/services";

const repacks = stateManager.getValue("repacks");

const getCatalogue = async (
  _event: Electron.IpcMainInvokeEvent,
  category: CatalogueCategory
) => {
  return getRecentlyAddedCatalogue(resultSize);
};

const getTrendingCatalogue = async (
  resultSize: number
): Promise<CatalogueEntry[]> => {
  const results: CatalogueEntry[] = [];
  const trendingGames = await requestSteam250("/90day");

  for (
    let i = 0;
    i < trendingGames.length && results.length < resultSize;
    i++
  ) {
    if (!trendingGames[i]) continue;

    const { title, objectID } = trendingGames[i]!;
    const repacks = searchRepacks(title);

    if (title && repacks.length) {
      const catalogueEntry = {
        objectID,
        title,
        shop: "steam" as GameShop,
        cover: getSteamAppAsset("library", objectID),
      };

      results.push({ ...catalogueEntry, repacks });
    }
  }
  return results;
};

    for (const game of games) {
      const isAlreadyIncluded = results.some(
        (result) => result.objectID === game?.objectID
      );

      if (!game || !game.repacks.length || isAlreadyIncluded) {
        continue;
      }

      results.push(game);
    }
  }

  return results.slice(0, resultSize);
};

registerEvent(getCatalogue, {
  name: "getCatalogue",
  memoize: true,
});
