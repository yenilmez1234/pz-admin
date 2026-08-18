import { useState } from "react";
import {
  ApplicationShell,
  ApplicationShellPanel,
} from "./components/layout/ApplicationShell";
import { ServerPage } from "./pages/ServerPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ToolsPage } from "./pages/ToolsPage";
import type { AppSection } from "./types/navigation";

function App() {
  const [section, setSection] = useState<AppSection>("server");

  return (
    <ApplicationShell activeSection={section} onSectionChange={setSection}>
      <ApplicationShellPanel section="server" fullHeight>
        <ServerPage />
      </ApplicationShellPanel>
      <ApplicationShellPanel section="tools" fullHeight>
        <ToolsPage />
      </ApplicationShellPanel>
      <ApplicationShellPanel section="settings" width="narrow">
        <SettingsPage />
      </ApplicationShellPanel>
    </ApplicationShell>
  );
}

export default App;
