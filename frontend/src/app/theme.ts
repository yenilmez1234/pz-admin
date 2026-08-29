import { Badge, Modal, createTheme } from "@mantine/core";

export const theme = createTheme({
  components: {
    Badge: Badge.extend({ defaultProps: { tt: "none" } }),
    Modal: Modal.extend({ defaultProps: { centered: true } }),
  },
  fontFamily: '"Inter Variable", sans-serif',
  fontFamilyMonospace: '"JetBrains Mono Variable", monospace',
  headings: { fontFamily: '"Inter Variable", sans-serif' },
});
