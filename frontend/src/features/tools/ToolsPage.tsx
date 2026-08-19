import type { ReactNode } from "react";
import { IconCar, IconPackage } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  SectionNavigation,
  SectionNavigationPanel,
} from "@/shared/layout/SectionNavigation";
import { ItemsPage } from "@/features/items/ItemsPage";
import { VehiclesPage } from "@/features/vehicles/VehiclesPage";
import { usePersistentNavigation } from "@/shared/hooks/usePersistentNavigation";

type ToolsPageName = "items" | "vehicles";

export function ToolsPage() {
  const { t } = useTranslation("tools");
  const navigation = usePersistentNavigation<ToolsPageName>("items");
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
      activePage={navigation.activePage}
      items={pages}
      label={t("navigation.accessibleLabel")}
      onPageChange={navigation.changePage}
    >
      <SectionNavigationPanel page="items" scrollable={false}>
        <ItemsPage />
      </SectionNavigationPanel>

      <SectionNavigationPanel page="vehicles" scrollable={false}>
        {navigation.isVisited("vehicles") ? <VehiclesPage /> : null}
      </SectionNavigationPanel>
    </SectionNavigation>
  );
}
