// DESKTOP: No-op server configuration stub — no server in local app

export const configurationPromise: Promise<void> = Promise.resolve();

const defaultConfig = {
  maintenance: false,
  dev: { responseSlowdownMs: 0 },
  results: { savingEnabled: false, objectHashCheckEnabled: false, filterPresetLimit: 0, maxBatchSize: 0 },
  users: {
    signUp: false,
    lastHashesCheck: { enabled: false, maxHashes: 0 },
    autoBan: [],
    profiles: { enabled: false },
    discordIntegration: { enabled: false },
    xp: { enabled: false, funboxBonus: 0, gainMultiplier: 0, maxDailyBonus: 0, minDailyBonus: 0 },
    inbox: { enabled: false, maxMail: 0 },
    premium: { enabled: false },
  },
  quotes: { reporting: { enabled: false, maxReports: 0, contentReportLimit: 0 }, submissionsEnabled: false, maxFavorites: 0 },
  admin: { endpointsEnabled: false },
  apeKeys: { endpointsEnabled: false, acceptKeys: false, maxKeysPerUser: 0, apeKeyBytes: 0, apeKeySaltRounds: 0 },
  rateLimiting: { badAuthentication: { enabled: false, penalty: 0, flaggedStatusCodes: [] } },
  connections: { enabled: false },
};

export function get(): typeof defaultConfig {
  return defaultConfig;
}

export async function sync(): Promise<void> {}
