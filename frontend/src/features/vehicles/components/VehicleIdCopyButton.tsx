import {
  CopyButton,
  Group,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import classes from "./VehicleIdCopyButton.module.css";

interface VehicleIdCopyButtonProps {
  id: string;
}

export function VehicleIdCopyButton({ id }: VehicleIdCopyButtonProps) {
  const { t } = useTranslation("vehicles");

  return (
    <CopyButton timeout={2000} value={id}>
      {({ copied, copy }) => (
        <Tooltip
          label={copied ? t("details.copied") : t("details.copyId")}
          withArrow
        >
          <UnstyledButton
            aria-label={copied ? t("details.copied") : t("details.copyId")}
            className={classes.root}
            data-copied={copied || undefined}
            onClick={copy}
          >
            <Group gap="xs" wrap="nowrap">
              <Text
                ff="monospace"
                size="xs"
                style={{ overflowWrap: "anywhere" }}
                translate="no"
              >
                {id}
              </Text>
              {copied ? (
                <IconCheck size={14} aria-hidden="true" />
              ) : (
                <IconCopy size={14} aria-hidden="true" />
              )}
            </Group>
          </UnstyledButton>
        </Tooltip>
      )}
    </CopyButton>
  );
}
