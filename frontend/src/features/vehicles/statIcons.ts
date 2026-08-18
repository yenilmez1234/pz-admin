import type { VehicleStats } from "./types";

// Project Zomboid UI icons sourced from PZwiki's vehicle stat legend.
// Game artwork is copyright The Indie Stone: https://pzwiki.net/wiki/Vehicle
export const vehicleStatIcons: Partial<Record<keyof VehicleStats, string>> = {
  animalSize: "/vehicles/stats/animal-size.png",
  doors: "/vehicles/stats/doors.png",
  engineLoudness: "/vehicles/stats/engine-loudness.png",
  enginePower: "/vehicles/stats/engine-power.png",
  engineQuality: "/vehicles/stats/engine-quality.png",
  gloveBox: "/vehicles/stats/glove-box.png",
  lightbar: "/vehicles/stats/lightbar.png",
  occupantProtection: "/vehicles/stats/occupant-protection.png",
  seats: "/vehicles/stats/seats.png",
  suspensionStiffness: "/vehicles/stats/suspension-stiffness.png",
  topSpeed: "/vehicles/stats/top-speed.png",
  totalStorage: "/vehicles/stats/storage.png",
  trunkStorage: "/vehicles/stats/trunk-storage.png",
  weight: "/vehicles/stats/weight.png",
  wheels: "/vehicles/stats/wheels.png",
};
