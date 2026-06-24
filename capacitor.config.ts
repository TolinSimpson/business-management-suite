import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "engineering.happy.schedule",
  appName: "Schedule",
  webDir: "dist",
  android: {
    // Keep the WebView background dark to avoid a white flash on launch.
    backgroundColor: "#0f1115",
  },
};

export default config;
