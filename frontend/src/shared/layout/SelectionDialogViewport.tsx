import type { ReactNode } from "react";
import { Box } from "@mantine/core";
import classes from "./SelectionDialogViewport.module.css";

interface SelectionDialogViewportProps {
  busy?: boolean;
  children: ReactNode;
}

export function SelectionDialogViewport({
  busy,
  children,
}: SelectionDialogViewportProps) {
  return (
    <Box aria-busy={busy} className={classes.root}>
      {children}
    </Box>
  );
}
