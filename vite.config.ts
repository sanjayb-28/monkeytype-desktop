import { defineConfig, PluginOption } from "vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import injectHTML from "vite-plugin-html-inject";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function virtualModules() {
  const modules: Record<string, string> = {
    "virtual:env-config": `export const envConfig = {
  backendUrl: "",
  isDevelopment: false,
  clientVersion: "0.1.0",
  recaptchaSiteKey: "",
  quickLoginEmail: undefined,
  quickLoginPassword: undefined,
};`,
    "virtual:language-hashes": `export const languageHashes = {};`,
  };
  return {
    name: "virtual-modules",
    resolveId(id: string) {
      if (id in modules) return "\0" + id;
    },
    load(id: string) {
      const key = id.replace(/^\0/, "");
      if (key in modules) return modules[key];
    },
  };
}

// Generate $fonts SCSS map from fonts constant (replicates donor's getFontsConfig)
function getFontsScssMap(): string {
  // Import can't be used at runtime, so hardcode the map from constants/fonts.ts
  const fonts: Record<string, { fileName?: string; weight?: number; systemFont?: boolean }> = {
    Roboto_Mono: { fileName: "RobotoMono-Regular.woff2" },
    Noto_Naskh_Arabic: { fileName: "NotoNaskhArabic-Regular.woff2" },
    Source_Code_Pro: { fileName: "SourceCodePro-Regular.woff2" },
    IBM_Plex_Sans: { fileName: "IBMPlexSans-SemiBold.woff2", weight: 600 },
    Inconsolata: { fileName: "Inconsolata-Regular.woff2" },
    Fira_Code: { fileName: "FiraCode-Regular.woff2" },
    JetBrains_Mono: { fileName: "JetBrainsMono-Regular.woff2" },
    Roboto: { fileName: "Roboto-Regular.woff2" },
    Montserrat: { fileName: "Montserrat-Regular.woff2" },
    Titillium_Web: { fileName: "TitilliumWeb-Regular.woff2" },
    Lexend_Deca: { fileName: "LexendDeca-Regular.woff2" },
    Comic_Sans_MS: { systemFont: true },
    Oxygen: { fileName: "Oxygen-Regular.woff2" },
    Nunito: { fileName: "Nunito-Bold.woff2", weight: 700 },
    Itim: { fileName: "Itim-Regular.woff2" },
    Courier: { systemFont: true },
    Comfortaa: { fileName: "Comfortaa-Regular.woff2" },
    Coming_Soon: { fileName: "ComingSoon-Regular.woff2" },
    Atkinson_Hyperlegible: { fileName: "AtkinsonHyperlegible-Regular.woff2" },
    Lato: { fileName: "Lato-Regular.woff2" },
    Lalezar: { fileName: "Lalezar-Regular.woff2" },
    Boon: { fileName: "Boon-Regular.woff2" },
    Open_Dyslexic: { fileName: "OpenDyslexic-Regular.woff2" },
    Ubuntu: { fileName: "Ubuntu-Regular.woff2" },
    Ubuntu_Mono: { fileName: "UbuntuMono-Regular.woff2" },
    Georgia: { systemFont: true },
    Cascadia_Mono: { fileName: "CascadiaMono-Regular.woff2" },
    IBM_Plex_Mono: { fileName: "IBMPlexMono-Regular.woff2" },
    Overpass_Mono: { fileName: "OverpassMono-Regular.woff2" },
    Hack: { fileName: "Hack-Regular.woff2" },
    CommitMono: { fileName: "CommitMono-Regular.woff2" },
    Mononoki: { fileName: "Mononoki-Regular.woff2" },
    Parkinsans: { fileName: "Parkinsans-Regular.woff2" },
    Geist: { fileName: "Geist-Medium.woff2" },
    Sarabun: { fileName: "Sarabun-Bold.woff2" },
    Kanit: { fileName: "Kanit-Regular.woff2" },
    Geist_Mono: { fileName: "GeistMono-Medium.woff2" },
    Iosevka: { fileName: "Iosevka-Regular.woff2" },
    Proto: { fileName: "0xProto-Regular.woff2" },
    Adwaita_Mono: { fileName: "AdwaitaMono-Regular.woff2" },
  };
  const entries = Object.entries(fonts)
    .filter(([, v]) => !v.systemFont)
    .map(([name, v]) => {
      const displayName = name.replaceAll("_", " ");
      return `"${displayName}": ("src": "${v.fileName}", "weight": ${v.weight ?? 400},)`;
    });
  return `(\n${entries.join(",\n")}\n)`;
}

export default defineConfig({
  plugins: [virtualModules(), injectHTML() as PluginOption, solidPlugin(), tailwindcss()],
  root: "src",
  publicDir: path.resolve(__dirname, "static"),
  resolve: {
    alias: {
      // Vendored packages
      "@monkeytype/schemas": path.resolve(__dirname, "src/packages/schemas/src"),
      "@monkeytype/util": path.resolve(__dirname, "src/packages/util/src"),
      "@monkeytype/funbox": path.resolve(__dirname, "src/packages/funbox/src"),
      "@monkeytype/contracts": path.resolve(__dirname, "src/packages/contracts/src"),
      // Firebase stubs — prevent any real Firebase from being bundled
      "firebase/auth": path.resolve(__dirname, "src/ts/stubs/firebase-auth.ts"),
      "firebase/app": path.resolve(__dirname, "src/ts/stubs/firebase-app.ts"),
      "firebase/analytics": path.resolve(__dirname, "src/ts/stubs/firebase-analytics.ts"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        silenceDeprecations: ["import", "global-builtin", "slash-div", "color-functions"],
        loadPaths: [path.resolve(__dirname, "node_modules")],
        additionalData(source: string, _fp: string) {
          return `
            $fontAwesomeOverride: "@fortawesome/fontawesome-free/webfonts";
            $previewFontsPath: "webfonts";
            $fonts: ${getFontsScssMap()};
            ${source}`;
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Vite types lag behind Sass API
      } as any,
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    target: "esnext",
    outDir: path.resolve(__dirname, "dist"),
    chunkSizeWarningLimit: 1200,
  },
});
