import { ResultFilters } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  createOptimisticAction,
  useLiveQuery,
} from "@tanstack/solid-db";
import Ape from "../ape";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import {
  replaceSpacesWithUnderscores,
  replaceUnderscoresWithSpaces,
} from "../utils/strings";
import { applyIdWorkaround, tempId } from "./utils/misc";
import { fetchUserFromApi } from "../ape/user";
import { isAuthenticated } from "../states/core";
import { envConfig } from "virtual:env-config";

const queryKeys = {
  root: () => [...baseKey("resultFilterPresets", { isUserSpecific: true })],
};

async function loadDesktopResultFilterPresets(): Promise<ResultFilters[]> {
  const { initializeDesktopStorage, loadDesktopData } =
    await import("../desktop/storage");
  await initializeDesktopStorage();
  return loadDesktopData().resultFilterPresets;
}

async function persistDesktopResultFilterPresets(): Promise<void> {
  if (!envConfig.isDesktop) return;
  const { saveDesktopData } = await import("../desktop/storage");
  await saveDesktopData({
    resultFilterPresets: [...resultFilterPresetsCollection.values()].sort(
      (left, right) => left.name.localeCompare(right.name),
    ),
  });
}

const resultFilterPresetsCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    gcTime: Infinity,
    queryKey: queryKeys.root(),
    queryClient,
    enabled: () => isAuthenticated() || envConfig.isDesktop,
    getKey: (it) => it._id,
    queryFn: async () => {
      if (envConfig.isDesktop) return loadDesktopResultFilterPresets();
      const userData = await fetchUserFromApi();
      if (userData === undefined) return [];

      return (userData.resultFilterPresets ?? [])
        .map((it) => ({
          ...it,
          name: replaceUnderscoresWithSpaces(it.name),
        }))
        .map(applyIdWorkaround);
    },
  }),
);

// oxlint-disable-next-line typescript/explicit-function-return-type
export function useResultFilterPresetsLiveQuery() {
  return useLiveQuery((q) => {
    if (!isAuthenticated() && !envConfig.isDesktop) return undefined;
    return q.from({ presets: resultFilterPresetsCollection });
  });
}

type ActionType = {
  insertResultFilterPreset: {
    name: string;
    filters: ResultFilters;
  };
  deleteResultFilterPreset: {
    presetId: string;
  };
};

const actions = {
  insertResultFilterPreset: createOptimisticAction<
    ActionType["insertResultFilterPreset"]
  >({
    onMutate: ({ name, filters }) => {
      resultFilterPresetsCollection.insert({
        ...structuredClone(filters),
        _id: tempId(),
        name,
      });
    },
    mutationFn: async ({ name, filters }) => {
      const response = await Ape.users.addResultFilterPreset({
        body: {
          ...structuredClone(filters),
          name: replaceSpacesWithUnderscores(name),
        },
      });
      if (response.status !== 200) {
        throw new Error(
          `Failed to insert result filter presets: ${response.body.message}`,
        );
      }

      const newPreset: ResultFilters = {
        ...structuredClone(filters),
        _id: response.body.data,
        name,
      };

      resultFilterPresetsCollection.utils.writeInsert(newPreset);
    },
  }),
  deleteResultFilterPreset: createOptimisticAction<
    ActionType["deleteResultFilterPreset"]
  >({
    onMutate: ({ presetId }) => {
      resultFilterPresetsCollection.delete(presetId);
    },
    mutationFn: async ({ presetId }) => {
      const response = await Ape.users.removeResultFilterPreset({
        params: { presetId },
      });

      if (response.status !== 200) {
        throw new Error(
          `Failed to delete result filter presets: ${response.body.message}`,
        );
      }

      resultFilterPresetsCollection.utils.writeDelete(presetId);
    },
  }),
};

export async function insertResultFilterPreset(
  params: ActionType["insertResultFilterPreset"],
): Promise<void> {
  if (envConfig.isDesktop) {
    resultFilterPresetsCollection.utils.writeInsert({
      ...structuredClone(params.filters),
      _id: crypto.randomUUID().replaceAll("-", ""),
      name: params.name.replace(/_/g, " "),
    });
    await persistDesktopResultFilterPresets();
    return;
  }
  const transaction = actions.insertResultFilterPreset(params);
  await transaction.isPersisted.promise;
}

export async function deleteResultFilterPreset(
  params: ActionType["deleteResultFilterPreset"],
): Promise<void> {
  if (envConfig.isDesktop) {
    resultFilterPresetsCollection.utils.writeDelete(params.presetId);
    await persistDesktopResultFilterPresets();
    return;
  }
  const transaction = actions.deleteResultFilterPreset(params);
  await transaction.isPersisted.promise;
}
