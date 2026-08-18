import { useMemo, useState } from "react";
import {
  Anchor,
  Badge,
  Button,
  Checkbox,
  Group,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import {
  IconArrowsSort,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import type { GameBuild } from "@/features/game/types";
import { PlayerActionsMenu } from "./PlayerActionsMenu";
import {
  accessLevelColor,
  accessLevelKey,
  filterAndSortPlayers,
  lastSeenLabel,
  playerAccessLevel,
  type PlayerSorting,
  type SortColumn,
} from "./playerTable";

interface SortableHeaderProps {
  column: SortColumn;
  label: string;
  onSort: (column: SortColumn) => void;
  sorting: PlayerSorting;
  width?: number | string;
}

function SortableHeader({
  column,
  label,
  onSort,
  sorting,
  width,
}: SortableHeaderProps) {
  const active = sorting.column === column;
  const Icon = active
    ? sorting.direction === "asc"
      ? IconChevronUp
      : IconChevronDown
    : IconArrowsSort;

  return (
    <Table.Th
      w={width}
      aria-sort={
        active
          ? sorting.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <UnstyledButton w="100%" py="xs" onClick={() => onSort(column)}>
        <Group gap="xs" wrap="nowrap">
          <Text fw={600} size="xs">
            {label}
          </Text>
          <Icon
            aria-hidden="true"
            color="var(--mantine-color-dimmed)"
            size={14}
          />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

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

interface PlayerTableProps {
  build: GameBuild;
  language: string;
  loading: boolean;
  onAddXp: (players: Player[]) => void;
  onGiveItems: (players: Player[]) => void;
  onSpawnVehicle: (players: Player[]) => void;
  onAddLocalPlayer: () => void;
  onAddServerUser: () => void;
  onBan: (players: Player[]) => void;
  onCreateHorde: (players: Player[]) => void;
  onGodModeChange: (players: Player[], enabled: boolean) => void;
  onInvisibleChange: (players: Player[], enabled: boolean) => void;
  onNoClipChange: (players: Player[], enabled: boolean) => void;
  onKick: (players: Player[]) => void;
  onLightning: (players: Player[]) => void;
  onRemoveFromWhitelist: (players: Player[]) => void;
  onSelectionChange: (playerIds: Set<string>) => void;
  onSetAccessLevel: (players: Player[]) => void;
  onTeleport: (players: Player[]) => void;
  onThunder: (players: Player[]) => void;
  onUnban: (players: Player[]) => void;
  onVoiceBanChange: (players: Player[], banned: boolean) => void;
  players: Player[];
  selectedPlayerIds: ReadonlySet<string>;
  showEmptyState: boolean;
  showInvisible: boolean;
  showNoClip: boolean;
}

export function PlayerTable({
  build,
  language,
  loading,
  onAddXp,
  onGiveItems,
  onSpawnVehicle,
  onAddLocalPlayer,
  onAddServerUser,
  onBan,
  onCreateHorde,
  onGodModeChange,
  onInvisibleChange,
  onNoClipChange,
  onKick,
  onLightning,
  onRemoveFromWhitelist,
  onSelectionChange,
  onSetAccessLevel,
  onTeleport,
  onThunder,
  onUnban,
  onVoiceBanChange,
  players,
  selectedPlayerIds,
  showEmptyState,
  showInvisible,
  showNoClip,
}: PlayerTableProps) {
  const { t } = useTranslation("players");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<PlayerSorting>({
    column: "status",
    direction: "desc",
  });
  const relativeTime = useMemo(
    () =>
      new Intl.RelativeTimeFormat(language, {
        numeric: "auto",
        style: "narrow",
      }),
    [language],
  );
  const visiblePlayers = useMemo(
    () => filterAndSortPlayers(players, search, language, sorting),
    [language, players, search, sorting],
  );
  const visiblePlayerIds = visiblePlayers.map((player) => player.id);
  const selectedVisibleCount = visiblePlayerIds.filter((id) =>
    selectedPlayerIds.has(id),
  ).length;
  const allVisibleSelected =
    visiblePlayerIds.length > 0 &&
    selectedVisibleCount === visiblePlayerIds.length;

  function handleSort(column: SortColumn) {
    setSorting((current) => ({
      column,
      direction:
        current.column === column && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  }

  function toggleVisiblePlayers() {
    const next = new Set(selectedPlayerIds);
    if (allVisibleSelected) {
      visiblePlayerIds.forEach((id) => next.delete(id));
    } else {
      visiblePlayerIds.forEach((id) => next.add(id));
    }
    onSelectionChange(next);
  }

  function togglePlayer(playerId: string) {
    const next = new Set(selectedPlayerIds);
    if (next.has(playerId)) {
      next.delete(playerId);
    } else {
      next.add(playerId);
    }
    onSelectionChange(next);
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <TextInput
          aria-label={t("table.searchLabel")}
          autoComplete="off"
          leftSection={<IconSearch size={16} aria-hidden="true" />}
          maw={360}
          name="player-search"
          placeholder={t("table.searchPlaceholder")}
          spellCheck={false}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <Button onClick={onAddServerUser}>{t("table.addPlayerButton")}</Button>
      </Group>

      <Paper withBorder style={{ overflow: "hidden" }}>
        <Table.ScrollContainer minWidth={680} type="native">
          <Table
            aria-label={t("table.accessibleLabel")}
            highlightOnHover
            layout="fixed"
            stickyHeader
            styles={{
              td: { userSelect: "none", WebkitUserSelect: "none" },
              th: { userSelect: "none", WebkitUserSelect: "none" },
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={44}>
                  <Checkbox
                    aria-label={t("table.selectAllLabel")}
                    checked={allVisibleSelected}
                    disabled={visiblePlayers.length === 0}
                    indeterminate={
                      selectedVisibleCount > 0 && !allVisibleSelected
                    }
                    onChange={toggleVisiblePlayers}
                  />
                </Table.Th>
                <SortableHeader
                  column="username"
                  label={t("table.playerColumn")}
                  onSort={handleSort}
                  sorting={sorting}
                  width="34%"
                />
                <SortableHeader
                  column="status"
                  label={t("table.statusColumn")}
                  onSort={handleSort}
                  sorting={sorting}
                  width="34%"
                />
                <SortableHeader
                  column="accessLevel"
                  label={t("table.accessLevelColumn")}
                  onSort={handleSort}
                  sorting={sorting}
                  width="22%"
                />
                <Table.Th w={44} aria-label={t("table.actionsColumnLabel")} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading && players.length === 0
                ? Array.from({ length: 5 }, (_, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>
                        <Skeleton h={20} w={20} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton h={20} w="60%" />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton h={20} w={120} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton h={20} w={80} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton h={28} w={28} />
                      </Table.Td>
                    </Table.Tr>
                  ))
                : visiblePlayers.map((player) => {
                    const effectiveAccessLevel = playerAccessLevel(player);
                    const accessLevel = accessLevelKey(effectiveAccessLevel);
                    return (
                      <Table.Tr key={player.id}>
                        <Table.Td>
                          <Checkbox
                            aria-label={t("table.selectPlayerLabel", {
                              username: player.username,
                            })}
                            checked={selectedPlayerIds.has(player.id)}
                            onChange={() => togglePlayer(player.id)}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text
                            fw={500}
                            size="sm"
                            style={{
                              userSelect: "text",
                              WebkitUserSelect: "text",
                            }}
                            translate="no"
                            truncate
                          >
                            {player.username}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <PlayerStatus
                            player={player}
                            relativeTime={relativeTime}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={accessLevelColor(effectiveAccessLevel)}
                            style={{
                              userSelect: "text",
                              WebkitUserSelect: "text",
                            }}
                            variant={
                              accessLevel === "unknown" ? "outline" : "light"
                            }
                          >
                            {t(`accessLevels.${accessLevel}`)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <PlayerActionsMenu
                            build={build}
                            onAddXp={onAddXp}
                            onGiveItems={onGiveItems}
                            onSpawnVehicle={onSpawnVehicle}
                            onBan={onBan}
                            onCreateHorde={onCreateHorde}
                            onGodModeChange={onGodModeChange}
                            onInvisibleChange={onInvisibleChange}
                            onNoClipChange={onNoClipChange}
                            onKick={onKick}
                            onLightning={onLightning}
                            onRemoveFromWhitelist={onRemoveFromWhitelist}
                            onSetAccessLevel={onSetAccessLevel}
                            onTeleport={onTeleport}
                            onThunder={onThunder}
                            onUnban={onUnban}
                            onVoiceBanChange={onVoiceBanChange}
                            player={player}
                            showInvisible={showInvisible}
                            showNoClip={showNoClip}
                          />
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}

              {!loading && showEmptyState && visiblePlayers.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center" py="xl">
                      {players.length === 0
                        ? t("table.empty")
                        : t("table.noSearchResults")}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Anchor
        component="button"
        size="sm"
        ta="center"
        onClick={onAddLocalPlayer}
      >
        {t("table.missingPlayerLink")}
      </Anchor>
    </Stack>
  );
}
