import { useState } from "react";
import { IconPackage } from "@tabler/icons-react";
import type { GameBuild } from "@/features/game/types";

interface ItemIdThumbnailProps {
  build: GameBuild;
  itemId: string;
  size: number;
}

/** Loads the first generated image directly without loading the item catalog. */
export function ItemIdThumbnail({ build, itemId, size }: ItemIdThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return <IconPackage aria-hidden="true" size={size * 0.65} />;

  return (
    <img
      alt=""
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      src={`/items/${build}/${itemId}_0.png`}
      width={size}
    />
  );
}
