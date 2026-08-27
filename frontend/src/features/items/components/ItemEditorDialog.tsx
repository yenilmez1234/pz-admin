import { useLayoutEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconAlertCircle, IconEdit } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { GameBuild } from "@/features/game/types";
import { utf8ByteLength } from "@/shared/lib/text";
import { useItemCatalog } from "../hooks/useItemCatalog";
import { useItemSelection } from "../hooks/useItemSelection";
import {
  parseItemSelection,
  serializeItemSelection,
} from "../lib/itemSelection";
import { ItemBrowser } from "./ItemBrowser";
import { ItemIdThumbnail } from "./ItemIdThumbnail";
import classes from "./ItemEditorDialog.module.css";

interface ItemEditorDialogProps {
  build: GameBuild;
  descriptionId?: string;
  disabled?: boolean;
  invalid?: boolean;
  maxBytes?: number;
  onChange: (value: string) => void;
  value: string;
}

interface ItemEditorDialogContentProps {
  build: GameBuild;
  maxBytes?: number;
  onApply: (value: string) => void;
  onClose: () => void;
  opened: boolean;
  value: string;
}

function ItemEditorDialogContent({
  build,
  maxBytes,
  onApply,
  onClose,
  opened,
  value,
}: ItemEditorDialogContentProps) {
  const { i18n, t } = useTranslation(["items", "common"]);
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { catalog, error, loading, reload } = useItemCatalog(build, language);
  const selection = useItemSelection();
  const replaceSelection = selection.replace;
  const serializedSelection = serializeItemSelection(selection.selection);
  const overLimit =
    maxBytes !== undefined && utf8ByteLength(serializedSelection) > maxBytes;

  useLayoutEffect(() => {
    if (opened) replaceSelection(parseItemSelection(value));
  }, [opened, replaceSelection, value]);

  return (
    <Stack gap="md">
      {error ? (
        <Alert
          color="red"
          icon={<IconAlertCircle aria-hidden="true" size={20} />}
          title={t("errors.loadTitle")}
        >
          <Stack align="flex-start" gap="xs">
            <Text size="sm">{error}</Text>
            <Button onClick={reload} size="xs" variant="light">
              {t("actions.retry", { ns: "common" })}
            </Button>
          </Stack>
        </Alert>
      ) : (
        <Box
          aria-busy={loading}
          h="min(62vh, 34rem)"
          style={{ display: "flex", minHeight: 0, overflow: "hidden" }}
        >
          <ItemBrowser
            catalog={catalog}
            loading={loading}
            selection={selection}
          />
        </Box>
      )}

      {maxBytes !== undefined ? (
        <Text
          c={overLimit ? "red" : "dimmed"}
          ff="monospace"
          size="xs"
          ta="end"
        >
          {t("editor.byteLimit", {
            count: utf8ByteLength(serializedSelection),
            max: maxBytes,
          })}
        </Text>
      ) : null}

      <Group justify="flex-end">
        <Button onClick={onClose} variant="default">
          {t("actions.cancel", { ns: "common" })}
        </Button>
        <Button
          disabled={overLimit}
          onClick={() => onApply(serializedSelection)}
        >
          {t("editor.apply")}
        </Button>
      </Group>
    </Stack>
  );
}

/** Encapsulates the game's repeated-ID format behind a selection editor. */
export function ItemEditorDialog({
  build,
  descriptionId,
  disabled,
  invalid,
  maxBytes,
  onChange,
  value,
}: ItemEditorDialogProps) {
  const { t } = useTranslation("items");
  const [opened, modal] = useDisclosure(false);
  const [visited, setVisited] = useState(false);
  const selectedItems = [...parseItemSelection(value)];
  const totalQuantity = selectedItems.reduce(
    (total, [, quantity]) => total + quantity,
    0,
  );

  function handleOpen() {
    setVisited(true);
    modal.open();
  }

  return (
    <>
      <div className={classes.control}>
        <div
          aria-label={t("editor.summary", { count: totalQuantity })}
          className={classes.summary}
        >
          {selectedItems.length > 0 ? (
            selectedItems.map(([itemId, quantity]) => (
              <Tooltip key={itemId} label={`${itemId} ×${quantity}`}>
                <div aria-hidden="true" className={classes.thumbnail}>
                  <ItemIdThumbnail
                    build={build}
                    itemId={itemId}
                    key={`${build}:${itemId}`}
                    size={30}
                  />
                  {quantity > 1 ? (
                    <span className={classes.quantity}>{quantity}</span>
                  ) : null}
                </div>
              </Tooltip>
            ))
          ) : (
            <Text c="dimmed" size="sm" truncate>
              {t("editor.empty")}
            </Text>
          )}
        </div>
        <Tooltip label={t("editor.edit")}>
          <ActionIcon
            aria-describedby={descriptionId}
            aria-invalid={invalid || undefined}
            aria-label={t("editor.edit")}
            disabled={disabled}
            onClick={handleOpen}
            size={36}
            type="button"
            variant="default"
          >
            <IconEdit aria-hidden="true" size={16} />
          </ActionIcon>
        </Tooltip>
      </div>

      <Modal
        centered
        keepMounted
        onClose={modal.close}
        opened={opened}
        size="xl"
        title={t("editor.title")}
      >
        {visited ? (
          <ItemEditorDialogContent
            build={build}
            maxBytes={maxBytes}
            onApply={(nextValue) => {
              onChange(nextValue);
              modal.close();
            }}
            onClose={modal.close}
            opened={opened}
            value={value}
          />
        ) : null}
      </Modal>
    </>
  );
}
