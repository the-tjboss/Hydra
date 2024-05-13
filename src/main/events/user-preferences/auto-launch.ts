import { registerEvent } from "../register-event";
import AutoLaunch from "auto-launch";
import { app } from "electron";

const autoLaunch = async (
  _event: Electron.IpcMainInvokeEvent,
  enabled: boolean
) => {
  const appLauncher = new AutoLaunch({
    name: app.getName(),
  });
  if (enabled) {
    appLauncher.enable().catch();
  } else {
    appLauncher.disable().catch();
  }
};

registerEvent(autoLaunch, {
  name: "autoLaunch",
});
