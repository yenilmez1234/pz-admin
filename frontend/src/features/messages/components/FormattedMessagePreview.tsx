import { Code, Group, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { utf8ByteLength } from "@/shared/lib/text";

interface FormattedMessagePreviewProps {
  maxBytes?: number;
  value: string;
}

export function FormattedMessagePreview({
  maxBytes,
  value,
}: FormattedMessagePreviewProps) {
  const { t } = useTranslation("messages");
  const byteLength = utf8ByteLength(value);
  const overLimit = maxBytes !== undefined && byteLength > maxBytes;

  return (
    <Stack gap="xs" style={{ minHeight: 0, minWidth: 0 }}>
      <Group justify="space-between">
        <Text fw={600} size="sm">
          {t("preview.title")}
        </Text>
        <Text
          aria-live="polite"
          c={overLimit ? "red" : "dimmed"}
          ff="monospace"
          size="xs"
        >
          {maxBytes === undefined
            ? t("preview.byteCount", { count: byteLength })
            : t("preview.byteLimit", { count: byteLength, max: maxBytes })}
        </Text>
      </Group>
      <Paper
        component="pre"
        h="8rem"
        m={0}
        p="sm"
        radius="md"
        style={{ maxWidth: "100%", minWidth: 0, overflow: "auto" }}
        withBorder
      >
        {value ? (
          <Code
            bg="transparent"
            p={0}
            style={{
              display: "block",
              maxWidth: "100%",
              overflowWrap: "anywhere",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {value}
          </Code>
        ) : (
          <Text c="dimmed" component="span" size="sm">
            {t("preview.empty")}
          </Text>
        )}
      </Paper>
    </Stack>
  );
}
