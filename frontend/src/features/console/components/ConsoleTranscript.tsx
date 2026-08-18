import { useEffect, useRef } from "react";
import { Box, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { ConsoleEntry } from "@/features/console/types";
import classes from "./ConsolePage.module.css";

interface ConsoleTranscriptProps {
  entries: ConsoleEntry[];
}

export function ConsoleTranscript({ entries }: ConsoleTranscriptProps) {
  const { t } = useTranslation("servers");
  const viewport = useRef<HTMLDivElement>(null);
  const followLatestOutput = useRef(true);

  useEffect(() => {
    if (entries.length === 0) followLatestOutput.current = true;
    if (viewport.current && followLatestOutput.current) {
      viewport.current.scrollTop = viewport.current.scrollHeight;
    }
  }, [entries]);

  return (
    <Box
      ref={viewport}
      className={classes.transcript}
      role="log"
      aria-live="polite"
      aria-label={t("console.outputLabel")}
      onScroll={(event) => {
        const element = event.currentTarget;
        followLatestOutput.current =
          element.scrollHeight - element.scrollTop - element.clientHeight <= 24;
      }}
    >
      {entries.length === 0 ? (
        <Box className={classes.emptyMessage}>
          <Text size="sm">{t("console.welcome")}</Text>
          <Text c="dimmed" size="sm">
            {t("console.usageHint")}
          </Text>
        </Box>
      ) : (
        entries.map((entry) => (
          <Box
            key={entry.id}
            className={classes.entry}
            data-status={entry.status}
          >
            <Text component="div" className={classes.command}>
              <Text component="span" className={classes.prompt} inherit>
                {">"}{" "}
              </Text>
              {entry.command}
            </Text>
            {entry.status === "pending" ? null : (
              <Text
                component="pre"
                className={classes.result}
                data-empty={entry.result ? undefined : true}
              >
                {entry.result || t("console.noOutput")}
              </Text>
            )}
          </Box>
        ))
      )}
    </Box>
  );
}
