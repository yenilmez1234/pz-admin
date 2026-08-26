import { Button, ColorPicker, ColorSwatch, Popover, Stack } from "@mantine/core";
import {
  RichTextEditor,
  useRichTextEditorContext,
} from "@mantine/tiptap";
import { useTranslation } from "react-i18next";
import { defaultGameMessageColor } from "@/features/messages/lib/gameMessageCodec";

const colorSwatches = [
  "#ffffff",
  "#ff8033",
  "#e6cc1a",
  "#b3e6b3",
  "#33b3ff",
  defaultGameMessageColor,
  "#b399ff",
  "#ff80b3",
  "#ff8080",
];

export function MessageColorControl() {
  const { t } = useTranslation("messages");
  const { editor } = useRichTextEditorContext();
  const color = editor?.getAttributes("textStyle").color as
    | string
    | undefined;

  return (
    <Popover position="bottom-start" shadow="md" width={220}>
      <Popover.Target>
        <RichTextEditor.Control
          aria-label={t("editor.color")}
          title={t("editor.color")}
        >
          <ColorSwatch
            color={color ?? defaultGameMessageColor}
            radius={5}
            size={16}
            withShadow
          />
        </RichTextEditor.Control>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm">
          <ColorPicker
            focusable
            format="hex"
            fullWidth
            hueLabel={t("editor.colorPicker.hue")}
            onChange={(value) => editor?.chain().focus().setColor(value).run()}
            saturationLabel={t("editor.colorPicker.saturation")}
            swatches={colorSwatches}
            swatchesPerRow={9}
            value={color ?? defaultGameMessageColor}
          />
          <Button
            disabled={!color}
            onClick={() => editor?.chain().focus().unsetColor().run()}
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
