import { useState, type ReactNode } from "react";
import { IconCar, IconPackage } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  SectionNavigation,
  SectionNavigationPanel,
} from "@/components/layout/SectionNavigation";
import { ItemsPage } from "./tools/ItemsPage";
import { VehiclesPage } from "./tools/VehiclesPage";

type ToolsPageName = "items" | "vehicles";

export function ToolsPage() {
  const { t } = useTranslation("tools");
  const [activePage, setActivePage] = useState<ToolsPageName>("items");
  const pages = [
    {
      value: "items",
      label: t("navigation.items"),
      icon: <IconPackage size={16} aria-hidden="true" />,
    },
    {
      value: "vehicles",
      label: t("navigation.vehicles"),
      icon: <IconCar size={16} aria-hidden="true" />,
    },
  ] satisfies Array<{
    icon: ReactNode;
    label: string;
    value: ToolsPageName;
  }>;

  return (
    <SectionNavigation
      activePage={activePage}
      items={pages}
      label={t("navigation.accessibleLabel")}
      onPageChange={setActivePage}
    >
      <SectionNavigationPanel page="items" scrollable={false}>
        <ItemsPage />
      </SectionNavigationPanel>

      <SectionNavigationPanel page="vehicles" scrollable={false}>
        <VehiclesPage />
      </SectionNavigationPanel>
    </SectionNavigation>
  );
}
