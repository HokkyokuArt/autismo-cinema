import type { Config } from "@react-router/dev/config";

export default {
  // Sem backend/API própria — persistência é 100% localStorage no navegador,
  // então rodamos como SPA em vez de SSR.
  ssr: false,
} satisfies Config;
