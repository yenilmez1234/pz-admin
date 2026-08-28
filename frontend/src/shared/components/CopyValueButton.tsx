import { CopyButton, Group, Tooltip, UnstyledButton } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import type { ReactNode } from "react";
import classes from "./CopyValueButton.module.css";

interface CopyValueButtonProps {
  children: ReactNode;
  copiedLabel: string;
  copyLabel: string;
  disabled?: boolean;
  value: string;
}

export function CopyValueButton({
  children,
  copiedLabel,
  copyLabel,
  disabled,
  value,
}: CopyValueButtonProps) {
  return (
    <CopyButton timeout={2000} value={value}>
      {({ copied, copy }) => {
        const label = copied ? copiedLabel : copyLabel;

        return (
          <Tooltip label={label} withArrow>
            <UnstyledButton
              aria-label={label}
              className={classes.root}
              data-copied={copied || undefined}
              disabled={disabled}
              onClick={copy}
            >
              <Group gap="xs" wrap="nowrap">
                {children}
                {copied ? (
                  <IconCheck aria-hidden="true" size={14} />
                ) : (
                  <IconCopy aria-hidden="true" size={14} />
                )}
              </Group>
            </UnstyledButton>
          </Tooltip>
        );
      }}
    </CopyButton>
  );
}
