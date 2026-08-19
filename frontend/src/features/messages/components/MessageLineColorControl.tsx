import {
  Button,
  ColorPicker,
  ColorSwatch,
  Popover,
  Stack,
  UnstyledButton,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import classes from "./MessageEditor.module.css";

export const defaultMessageColor = "#077ef5";

const colorSwatches = [
  "#ffffff",
  "#ff8033",
  "#e6cc1a",
  "#b3e6b3",
  "#33b3ff",
  defaultMessageColor,
  "#b399ff",
  "#ff80b3",
  "#ff8080",
];

interface MessageLineColorControlProps {
  color: string | null;
  lineNumber: number;
  onChange: (color: string | null) => void;
}

export function MessageLineColorControl({
  color,
  lineNumber,
  onChange,
}: MessageLineColorControlProps) {
  const { t } = useTranslation("messages");

  function handleColorChange(nextColor: string) {
    onChange(
      nextColor.toLowerCase() === defaultMessageColor ? null : nextColor,
    );
  }

  return (
    <Popover position="bottom-start" shadow="md" width={220}>
      <Popover.Target>
        <UnstyledButton
          aria-label={t("editor.changeLineColor", { line: lineNumber })}
          className={classes.colorButton}
        >
          <ColorSwatch
            color={color ?? defaultMessageColor}
            radius={5}
            size={16}
            withShadow
          />
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm">
          <ColorPicker
            focusable
            format="hex"
            fullWidth
            hueLabel={t("editor.colorPicker.hue")}
            onChange={handleColorChange}
            saturationLabel={t("editor.colorPicker.saturation")}
            swatches={colorSwatches}
            swatchesPerRow={9}
            value={color ?? defaultMessageColor}
          />
          <Button
            disabled={!color}
            onClick={() => onChange(null)}
            size="xs"
            variant="default"
          >
            {t("editor.useDefaultColor")}
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
