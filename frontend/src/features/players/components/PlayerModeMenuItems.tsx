import { Fragment } from "react";
import { Menu, VisuallyHidden } from "@mantine/core";
import { IconCheck, IconQuestionMark, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { useSession } from "@/features/session/useSession";
import { playerModes, type PlayerModeDefinition } from "../playerModes";

function useAvailablePlayerModes() {
  const { supports } = useSession();
  return playerModes.filter(
    (definition) => !definition.feature || supports(definition.feature),
  );
}

function ModeStateIcon({ value }: { value: boolean | null | undefined }) {
  if (value === true) return <IconCheck size={14} aria-hidden="true" />;
  if (value === false) return <IconX size={14} aria-hidden="true" />;
  return <IconQuestionMark size={14} aria-hidden="true" />;
}

function stateLabel(
  definition: PlayerModeDefinition,
  value: boolean | null | undefined,
) {
  if (value === true) return definition.enabledStateLabel;
  if (value === false) return definition.disabledStateLabel;
  return definition.unknownStateLabel;
}

export function PlayerModeMenuItems({ player }: { player: Player }) {
  const { t } = useTranslation("players");
  const availableModes = useAvailablePlayerModes();

  return availableModes.map((definition) => {
    const value = definition.value(player);
    return (
      <Menu.Item
        key={definition.label}
        onClick={() => void definition.execute([player], value !== true)}
        rightSection={<ModeStateIcon value={value} />}
      >
        {t(definition.label)}
        <VisuallyHidden> {t(stateLabel(definition, value))}</VisuallyHidden>
      </Menu.Item>
    );
  });
}

interface BulkPlayerModeMenuItemsProps {
  disabled: boolean;
  players: Player[];
}

export function BulkPlayerModeMenuItems({
  disabled,
  players,
}: BulkPlayerModeMenuItemsProps) {
  const { t } = useTranslation("players");
  const availableModes = useAvailablePlayerModes();

  return availableModes.map((definition) => (
    <Fragment key={definition.label}>
      <Menu.Item
        disabled={disabled}
        onClick={() => void definition.execute(players, true)}
      >
        {t(definition.enableLabel)}
      </Menu.Item>
      <Menu.Item
        disabled={disabled}
        onClick={() => void definition.execute(players, false)}
      >
        {t(definition.disableLabel)}
      </Menu.Item>
    </Fragment>
  ));
}
