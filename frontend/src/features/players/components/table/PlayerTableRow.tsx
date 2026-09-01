import { Badge, Checkbox, Group, Table, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import {
  accessLevelColor,
  accessLevelKey,
  playerAccessLevel,
} from "../../lib/accessLevel";
import { lastSeenLabel } from "../../lib/table";
import { PlayerActionsMenu } from "../../actions/menu/PlayerActionsMenu";

interface PlayerStatusProps {
  player: Player;
  relativeTime: Intl.RelativeTimeFormat;
}

function PlayerStatus({ player, relativeTime }: PlayerStatusProps) {
  const { t } = useTranslation("players");
  const lastSeen = lastSeenLabel(player, relativeTime);
  const lastSeenText = lastSeen ?? t("status.neverSeen");

  return (
    <Group gap="xs" wrap="wrap">
      <Badge
        color={lastSeen === "online" ? "green" : "gray"}
        variant="light"
        style={{ userSelect: "text", WebkitUserSelect: "text" }}
      >
        {lastSeen === "online" ? t("status.online") : t("status.offline")}
      </Badge>
      {lastSeen !== "online" ? (
        <Text
          c="dimmed"
          size="xs"
          style={{
            fontVariantNumeric: "tabular-nums",
            userSelect: "text",
            WebkitUserSelect: "text",
          }}
        >
          {lastSeenText}
        </Text>
      ) : null}
    </Group>
  );
}

interface PlayerTableRowProps {
  checked: boolean;
  onToggle: () => void;
  player: Player;
  relativeTime: Intl.RelativeTimeFormat;
}

export function PlayerTableRow({
  checked,
  onToggle,
  player,
  relativeTime,
}: PlayerTableRowProps) {
  const { t } = useTranslation("players");
  const effectiveAccessLevel = playerAccessLevel(player);
  const accessLevel = accessLevelKey(effectiveAccessLevel);

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox
          aria-label={t("selection.selectPlayer", {
            username: player.username,
          })}
          checked={checked}
          onChange={onToggle}
        />
      </Table.Td>
      <Table.Td>
        <Text
          fw={500}
          size="sm"
          style={{ userSelect: "text", WebkitUserSelect: "text" }}
          translate="no"
          truncate
        >
          {player.username}
        </Text>
      </Table.Td>
      <Table.Td>
        <PlayerStatus player={player} relativeTime={relativeTime} />
      </Table.Td>
      <Table.Td>
        <Badge
          color={accessLevelColor(effectiveAccessLevel)}
          style={{ userSelect: "text", WebkitUserSelect: "text" }}
          variant={accessLevel === "unknown" ? "outline" : "light"}
        >
          {t(`roles.${accessLevel}`)}
        </Badge>
      </Table.Td>
      <Table.Td>
        <PlayerActionsMenu player={player} />
      </Table.Td>
    </Table.Tr>
  );
}
