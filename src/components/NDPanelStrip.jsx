import React from "react";
import SafeBoundary from "./SafeBoundary.jsx";

// Namespace-imports so we work with default or named exports
import * as AuthCardMod from "./AuthCard.jsx";
import * as VillagePanelMod from "./VillagePanel.jsx";
import * as CloudSyncCardMod from "./CloudSyncCard.jsx";
import * as ReflectionLauncherMod from "./ReflectionLauncher.jsx";
import * as CommunityStreamMod from "./CommunityStream.jsx";

// Feature flags (env-driven). Set VITE_FEAT_* to "false" to hide a panel.
const SHOW_AUTH = import.meta.env.VITE_FEAT_AUTH !== "false";
const SHOW_VILLAGE = import.meta.env.VITE_FEAT_VILLAGE !== "false";
const SHOW_SYNC = import.meta.env.VITE_FEAT_SYNC !== "false";
const SHOW_REFLECTION = import.meta.env.VITE_FEAT_REFLECTION !== "false";
const SHOW_COMMUNITY = import.meta.env.VITE_FEAT_COMMUNITY !== "false";

// Pick the first exported component
function pick(mod) {
  if (!mod || typeof mod !== "object") return () => null;
  if (typeof mod.default === "function") return mod.default;
  for (const v of Object.values(mod)) if (typeof v === "function") return v;
  return () => null;
}

const AuthCard = pick(AuthCardMod);
const VillagePanel = pick(VillagePanelMod);
const CloudSyncCard = pick(CloudSyncCardMod);
const ReflectionLauncher = pick(ReflectionLauncherMod);
const CommunityStream = pick(CommunityStreamMod);

/**
 * NDPanelStrip — resilient stack of V2 panels.
 * Each child is wrapped in an error boundary so a failure won’t blank the tab.
 */
export default function NDPanelStrip() {
  return (
    <div className="space-y-4">
      {SHOW_AUTH && (
        <SafeBoundary name="AuthCard">
          <AuthCard />
        </SafeBoundary>
      )}
      {SHOW_VILLAGE && (
        <SafeBoundary name="VillagePanel">
          <VillagePanel />
        </SafeBoundary>
      )}
      {SHOW_SYNC && (
        <SafeBoundary name="CloudSyncCard">
          <CloudSyncCard />
        </SafeBoundary>
      )}
      {SHOW_REFLECTION && (
        <SafeBoundary name="ReflectionLauncher">
          <ReflectionLauncher />
        </SafeBoundary>
      )}
      {SHOW_COMMUNITY && (
        <SafeBoundary name="CommunityStream">
          <CommunityStream />
        </SafeBoundary>
      )}
    </div>
  );
}
