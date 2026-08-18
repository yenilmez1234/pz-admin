import { PlayerActionsProvider } from "@/features/players/actions/PlayerActionsProvider";
import { PlayersWorkspace } from "@/features/players/components/PlayersWorkspace";

export function PlayersPage() {
  return (
    <PlayerActionsProvider>
      <PlayersWorkspace />
    </PlayerActionsProvider>
  );
}
