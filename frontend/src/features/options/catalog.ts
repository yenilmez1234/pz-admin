import type { GameBuild } from "@/features/game/types";

export type OptionValue = boolean | number | string;

export type OptionType = "boolean" | "integer" | "number" | "string" | "text";

export interface OptionChoice {
  id: string;
  requirements?: OptionRequirement[];
  value: OptionValue;
}

export interface OptionRequirement {
  equals: OptionValue;
  option: string;
}

export interface OptionSpecialValue {
  meaning:
    | "disabled"
    | "forever"
    | "instant"
    | "never"
    | "noCooldown"
    | "noRequirement"
    | "unlimited"
    | "useSpawnRegions";
  value: OptionValue;
}

export interface OptionDefinition {
  choices?: OptionChoice[];
  defaultValue?: OptionValue;
  dynamicDefault?: boolean;
  editor?: "items" | "message";
  maximum?: number;
  maximumLength?: number;
  minimum?: number;
  multiple?: boolean;
  name: string;
  readOnly?: boolean;
  requirements?: OptionRequirement[];
  specialValue?: OptionSpecialValue;
  type: OptionType;
}

export interface OptionCategory {
  id: string;
  sections: OptionSection[];
}

export interface OptionSection {
  id: string;
  options: OptionDefinition[];
}

type OptionMetadata = Omit<OptionDefinition, "name">;

const build41Options = {
  AdminSafehouse: { type: "boolean", defaultValue: false },
  AllowCoop: { type: "boolean", defaultValue: true },
  AllowDestructionBySledgehammer: { type: "boolean", defaultValue: true },
  AllowNonAsciiUsername: { type: "boolean", defaultValue: false },
  AnnounceDeath: { type: "boolean", defaultValue: false },
  AntiCheatProtectionType1: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType10: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType11: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType12: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType13: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType14: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType15: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType15ThresholdMultiplier: {
    type: "number",
    defaultValue: 1,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType15", equals: true }],
  },
  AntiCheatProtectionType16: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "NoFire", equals: true }],
  },
  AntiCheatProtectionType17: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType18: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType19: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType2: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType20: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType20ThresholdMultiplier: {
    type: "number",
    defaultValue: 1,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType20", equals: true }],
  },
  AntiCheatProtectionType21: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType22: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType22ThresholdMultiplier: {
    type: "number",
    defaultValue: 1,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType22", equals: true }],
  },
  AntiCheatProtectionType23: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType24: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType24ThresholdMultiplier: {
    type: "number",
    defaultValue: 6,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType24", equals: true }],
  },
  AntiCheatProtectionType2ThresholdMultiplier: {
    type: "number",
    defaultValue: 3,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType2", equals: true }],
  },
  AntiCheatProtectionType3: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType3ThresholdMultiplier: {
    type: "number",
    defaultValue: 1,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType3", equals: true }],
  },
  AntiCheatProtectionType4: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType4ThresholdMultiplier: {
    type: "number",
    defaultValue: 1,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType4", equals: true }],
  },
  AntiCheatProtectionType5: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType6: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType7: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType8: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType9: { type: "boolean", defaultValue: true },
  AntiCheatProtectionType9ThresholdMultiplier: {
    type: "number",
    defaultValue: 1,
    minimum: 1,
    maximum: 10,
    requirements: [{ option: "AntiCheatProtectionType9", equals: true }],
  },
  AutoCreateUserInWhiteList: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "Open", equals: true }],
  },
  BackupsCount: { type: "integer", defaultValue: 5, minimum: 1, maximum: 300 },
  BackupsOnStart: { type: "boolean", defaultValue: true },
  BackupsOnVersionChange: { type: "boolean", defaultValue: true },
  BackupsPeriod: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 1500,
    specialValue: { value: 0, meaning: "disabled" },
  },
  BanKickGlobalSound: { type: "boolean", defaultValue: true },
  BloodSplatLifespanDays: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 365,
    specialValue: { value: 0, meaning: "forever" },
  },
  CarEngineAttractionModifier: {
    type: "number",
    defaultValue: 0.5,
    minimum: 0,
    maximum: 10,
  },
  ChatStreams: {
    type: "string",
    defaultValue: "s,r,a,w,y,sh,f,all",
    multiple: true,
    choices: [
      { id: "say", value: "s" },
      { id: "radio", value: "r" },
      { id: "admin", value: "a" },
      { id: "whisper", value: "w" },
      { id: "yell", value: "y" },
      { id: "safehouse", value: "sh" },
      { id: "faction", value: "f" },
      {
        id: "global",
        value: "all",
        requirements: [{ option: "GlobalChat", equals: true }],
      },
    ],
  },
  ClientActionLogs: {
    type: "string",
    defaultValue: "ISEnterVehicle;ISExitVehicle;ISTakeEngineParts;",
  },
  ClientCommandFilter: {
    type: "string",
    defaultValue:
      "-vehicle.*;+vehicle.damageWindow;+vehicle.fixPart;+vehicle.installPart;+vehicle.uninstallPart",
  },
  ConstructionPreventsLootRespawn: { type: "boolean", defaultValue: true },
  DefaultPort: {
    type: "integer",
    defaultValue: 16261,
    minimum: 0,
    maximum: 65535,
  },
  DenyLoginOnOverloadedServer: { type: "boolean", defaultValue: true },
  DisableRadioAdmin: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "DisableRadioStaff", equals: false }],
  },
  DisableRadioGM: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "DisableRadioStaff", equals: false }],
  },
  DisableRadioInvisible: { type: "boolean", defaultValue: true },
  DisableRadioModerator: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "DisableRadioStaff", equals: false }],
  },
  DisableRadioOverseer: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "DisableRadioStaff", equals: false }],
  },
  DisableRadioStaff: { type: "boolean", defaultValue: false },
  DisableSafehouseWhenPlayerConnected: { type: "boolean", defaultValue: false },
  DiscordEnable: { type: "boolean", defaultValue: false },
  DisplayUserName: { type: "boolean", defaultValue: true },
  DoLuaChecksum: { type: "boolean", defaultValue: true },
  DropOffWhiteListAfterDeath: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "Open", equals: false }],
  },
  Faction: { type: "boolean", defaultValue: true },
  FactionDaySurvivedToCreate: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    requirements: [{ option: "Faction", equals: true }],
    specialValue: { value: 0, meaning: "noRequirement" },
  },
  FactionPlayersRequiredForTag: {
    type: "integer",
    defaultValue: 1,
    minimum: 1,
    maximum: 2147483647,
    requirements: [{ option: "Faction", equals: true }],
  },
  FastForwardMultiplier: {
    type: "number",
    defaultValue: 40,
    minimum: 1,
    maximum: 100,
    requirements: [{ option: "SleepAllowed", equals: true }],
  },
  GlobalChat: { type: "boolean", defaultValue: true },
  HidePlayersBehindYou: { type: "boolean", defaultValue: true },
  HoursForLootRespawn: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    specialValue: { value: 0, meaning: "never" },
  },
  ItemNumbersLimitPerContainer: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 9000,
    specialValue: { value: 0, meaning: "unlimited" },
  },
  KickFastPlayers: { type: "boolean", defaultValue: false },
  KnockedDownAllowed: { type: "boolean", defaultValue: true },
  LoginQueueConnectTimeout: {
    type: "integer",
    defaultValue: 60,
    minimum: 20,
    maximum: 1200,
    requirements: [{ option: "LoginQueueEnabled", equals: true }],
  },
  LoginQueueEnabled: { type: "boolean", defaultValue: false },
  Map: { type: "string", defaultValue: "Muldraugh, KY" },
  MapRemotePlayerVisibility: {
    type: "integer",
    defaultValue: 1,
    minimum: 1,
    maximum: 3,
    choices: [
      { id: "hidden", value: 1 },
      { id: "factionAndSafehouseMembers", value: 2 },
      { id: "everyone", value: 3 },
    ],
  },
  MaxAccountsPerUser: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    requirements: [{ option: "Open", equals: true }],
    specialValue: { value: 0, meaning: "unlimited" },
  },
  MaxItemsForLootRespawn: {
    type: "integer",
    defaultValue: 4,
    minimum: 1,
    maximum: 2147483647,
  },
  MaxPlayers: { type: "integer", defaultValue: 32, minimum: 1, maximum: 100 },
  MinutesPerPage: { type: "number", defaultValue: 1, minimum: 0, maximum: 60 },
  Mods: { type: "string", defaultValue: "" },
  MouseOverToSeeDisplayName: { type: "boolean", defaultValue: true },
  NoFire: { type: "boolean", defaultValue: false },
  Open: { type: "boolean", defaultValue: true },
  PVP: { type: "boolean", defaultValue: true },
  PVPFirearmDamageModifier: {
    type: "number",
    defaultValue: 50,
    minimum: 0,
    maximum: 500,
    requirements: [{ option: "PVP", equals: true }],
  },
  PVPMeleeDamageModifier: {
    type: "number",
    defaultValue: 30,
    minimum: 0,
    maximum: 500,
    requirements: [{ option: "PVP", equals: true }],
  },
  PVPMeleeWhileHitReaction: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "PVP", equals: true }],
  },
  PauseEmpty: { type: "boolean", defaultValue: true },
  PerkLogs: { type: "boolean", defaultValue: true },
  PingLimit: {
    type: "integer",
    defaultValue: 400,
    minimum: 100,
    maximum: 2147483647,
    specialValue: { value: 100, meaning: "disabled" },
  },
  PlayerBumpPlayer: { type: "boolean", defaultValue: false },
  PlayerRespawnWithOther: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "AllowCoop", equals: true }],
  },
  PlayerRespawnWithSelf: { type: "boolean", defaultValue: false },
  PlayerSafehouse: { type: "boolean", defaultValue: false },
  Public: { type: "boolean", defaultValue: false },
  PublicDescription: { type: "text", defaultValue: "", maximumLength: 256 },
  PublicName: {
    type: "string",
    defaultValue: "My PZ Server",
    maximumLength: 64,
  },
  RemovePlayerCorpsesOnCorpseRemoval: { type: "boolean", defaultValue: false },
  ResetID: {
    type: "integer",
    dynamicDefault: true,
    minimum: 0,
    maximum: 2147483647,
    readOnly: true,
  },
  SafeHouseRemovalTime: {
    type: "integer",
    defaultValue: 144,
    minimum: 0,
    maximum: 2147483647,
    specialValue: { value: 0, meaning: "never" },
  },
  SafehouseAllowFire: { type: "boolean", defaultValue: true },
  SafehouseAllowLoot: { type: "boolean", defaultValue: true },
  SafehouseAllowNonResidential: { type: "boolean", defaultValue: false },
  SafehouseAllowRespawn: { type: "boolean", defaultValue: false },
  SafehouseAllowTrepass: { type: "boolean", defaultValue: true },
  SafehouseDaySurvivedToClaim: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    specialValue: { value: 0, meaning: "noRequirement" },
  },
  SafetyCooldownTimer: {
    type: "integer",
    defaultValue: 3,
    minimum: 0,
    maximum: 1000,
    requirements: [
      { option: "PVP", equals: true },
      { option: "SafetySystem", equals: true },
    ],
    specialValue: { value: 0, meaning: "noCooldown" },
  },
  SafetySystem: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "PVP", equals: true }],
  },
  SafetyToggleTimer: {
    type: "integer",
    defaultValue: 2,
    minimum: 0,
    maximum: 1000,
    requirements: [
      { option: "PVP", equals: true },
      { option: "SafetySystem", equals: true },
    ],
    specialValue: { value: 0, meaning: "instant" },
  },
  SaveWorldEveryMinutes: {
    type: "integer",
    defaultValue: 0,
    minimum: 0,
    maximum: 2147483647,
    specialValue: { value: 0, meaning: "disabled" },
  },
  ServerPlayerID: { type: "string", dynamicDefault: true, readOnly: true },
  ServerWelcomeMessage: {
    type: "text",
    defaultValue:
      "Welcome to Project Zomboid Multiplayer! <LINE> <LINE> To interact with the Chat panel: press Tab, T, or Enter. <LINE> <LINE> The Tab key will change the target stream of the message. <LINE> <LINE> Global Streams: /all <LINE> Local Streams: /say, /yell <LINE> Special Steams: /whisper, /safehouse, /faction. <LINE> <LINE> Press the Up arrow to cycle through your message history. Click the Gear icon to customize chat. <LINE> <LINE> Happy surviving!",
    editor: "message",
  },
  ShowFirstAndLastName: { type: "boolean", defaultValue: false },
  ShowSafety: {
    type: "boolean",
    defaultValue: true,
    requirements: [
      { option: "PVP", equals: true },
      { option: "SafetySystem", equals: true },
    ],
  },
  SledgehammerOnlyInSafehouse: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "AllowDestructionBySledgehammer", equals: true }],
  },
  SleepAllowed: { type: "boolean", defaultValue: false },
  SleepNeeded: {
    type: "boolean",
    defaultValue: false,
    requirements: [{ option: "SleepAllowed", equals: true }],
  },
  SneakModeHideFromOtherPlayers: { type: "boolean", defaultValue: true },
  SpawnItems: { type: "string", defaultValue: "", editor: "items" },
  SpawnPoint: {
    type: "string",
    defaultValue: "0,0,0",
    specialValue: { value: "0,0,0", meaning: "useSpawnRegions" },
  },
  SpeedLimit: { type: "number", defaultValue: 70, minimum: 10, maximum: 150 },
  SteamScoreboard: {
    type: "string",
    defaultValue: "true",
    choices: [
      { id: "everyone", value: "true" },
      { id: "administrators", value: "admin" },
      { id: "nobody", value: "false" },
    ],
  },
  SteamVAC: { type: "boolean", defaultValue: true },
  TrashDeleteAll: { type: "boolean", defaultValue: false },
  UDPPort: { type: "integer", defaultValue: 16262, minimum: 0, maximum: 65535 },
  UPnP: { type: "boolean", defaultValue: true },
  Voice3D: {
    type: "boolean",
    defaultValue: true,
    requirements: [{ option: "VoiceEnable", equals: true }],
  },
  VoiceEnable: { type: "boolean", defaultValue: true },
  VoiceMaxDistance: {
    type: "number",
    defaultValue: 100,
    minimum: 0,
    maximum: 100000,
    requirements: [{ option: "VoiceEnable", equals: true }],
  },
  VoiceMinDistance: {
    type: "number",
    defaultValue: 10,
    minimum: 0,
    maximum: 100000,
    requirements: [{ option: "VoiceEnable", equals: true }],
  },
  WorkshopItems: { type: "string", defaultValue: "" },
  server_browser_announced_ip: { type: "string", defaultValue: "" },
} satisfies Record<string, OptionMetadata>;

function selectOptions<T extends Record<string, OptionMetadata>>(
  definitions: T,
  names: readonly Extract<keyof T, string>[],
): OptionDefinition[] {
  return names.map((name) => ({ name, ...definitions[name] }));
}

const b41 = (names: readonly (keyof typeof build41Options)[]) =>
  selectOptions(build41Options, names);

export const optionCatalogs: Record<GameBuild, OptionCategory[]> = {
  "41": [
    {
      id: "server",
      sections: [
        {
          id: "identityAndListing",
          // Listing identity first, followed by whether the server is publicly listed.
          options: b41(["PublicName", "PublicDescription", "Public"]),
        },
        {
          id: "accessAndCapacity",
          options: b41([
            // General access policy and concurrent capacity.
            "Open",
            "MaxPlayers",
            // Account creation, limits, and lifecycle.
            "AutoCreateUserInWhiteList",
            "MaxAccountsPerUser",
            "DropOffWhiteListAfterDeath",
            // Username compatibility and additional local players.
            "AllowNonAsciiUsername",
            "AllowCoop",
          ]),
        },
        {
          id: "networkAndConnection",
          options: b41([
            // Player traffic ports and automatic router configuration.
            "DefaultPort",
            "UDPPort",
            "UPnP",
            // Optional advertised address for multi-address network setups.
            "server_browser_announced_ip",
          ]),
        },
      ],
    },
    {
      id: "gameplay",
      sections: [
        {
          id: "players",
          options: b41([
            // World time and sleeping behavior.
            "PauseEmpty",
            "SleepAllowed",
            "SleepNeeded",
            "FastForwardMultiplier",
            // Respawn locations for local and Remote Play players.
            "PlayerRespawnWithSelf",
            "PlayerRespawnWithOther",
            // Player identity and visibility in-game and in player lists.
            "DisplayUserName",
            "ShowFirstAndLastName",
            "MouseOverToSeeDisplayName",
            "SteamScoreboard",
            // Reading speed.
            "MinutesPerPage",
          ]),
        },
        {
          id: "world",
          options: b41([
            // Fire and persistent world cleanup.
            "NoFire",
            "BloodSplatLifespanDays",
            "RemovePlayerCorpsesOnCorpseRemoval",
            "TrashDeleteAll",
            // Vehicle behavior.
            "SpeedLimit",
            "CarEngineAttractionModifier",
          ]),
        },
        {
          id: "lootAndConstruction",
          options: b41([
            // Loot respawn interval and eligibility.
            "HoursForLootRespawn",
            "MaxItemsForLootRespawn",
            "ConstructionPreventsLootRespawn",
            // Player storage limits.
            "ItemNumbersLimitPerContainer",
            // Sledgehammer destruction policy.
            "AllowDestructionBySledgehammer",
            "SledgehammerOnlyInSafehouse",
          ]),
        },
        {
          id: "pvpAndSafety",
          options: b41([
            // Global PvP policy and the per-player safety system.
            "PVP",
            "SafetySystem",
            "ShowSafety",
            "SafetyToggleTimer",
            "SafetyCooldownTimer",
            // PvP damage behavior.
            "PVPFirearmDamageModifier",
            "PVPMeleeDamageModifier",
            "PVPMeleeWhileHitReaction",
            // Player collisions and visibility.
            "PlayerBumpPlayer",
            "KnockedDownAllowed",
            "SneakModeHideFromOtherPlayers",
            "HidePlayersBehindYou",
          ]),
        },
      ],
    },
    {
      id: "communities",
      sections: [
        {
          id: "safehouses",
          options: b41([
            // Who can claim a safehouse and which buildings are eligible.
            "PlayerSafehouse",
            "AdminSafehouse",
            "SafehouseDaySurvivedToClaim",
            "SafehouseAllowNonResidential",
            // Member-specific behavior and safehouse lifecycle.
            "SafehouseAllowRespawn",
            "SafeHouseRemovalTime",
            "DisableSafehouseWhenPlayerConnected",
            // Protections governing non-members and environmental damage.
            "SafehouseAllowFire",
            "SafehouseAllowTrepass",
            "SafehouseAllowLoot",
          ]),
        },
        {
          id: "factions",
          // Feature availability first, followed by creation and tag requirements.
          options: b41([
            "Faction",
            "FactionDaySurvivedToCreate",
            "FactionPlayersRequiredForTag",
          ]),
        },
        {
          id: "chatAndVoice",
          options: b41([
            // Messages and available text-chat channels.
            "ServerWelcomeMessage",
            "GlobalChat",
            "ChatStreams",
            "AnnounceDeath",
            "BanKickGlobalSound",
            // Voice chat availability, positioning, and range.
            "VoiceEnable",
            "Voice3D",
            "VoiceMinDistance",
            "VoiceMaxDistance",
            // Radio restrictions, from the broad override to narrower cases.
            "DisableRadioStaff",
            "DisableRadioAdmin",
            "DisableRadioModerator",
            "DisableRadioOverseer",
            "DisableRadioGM",
            "DisableRadioInvisible",
            // External chat integration.
            "DiscordEnable",
          ]),
        },
      ],
    },
    {
      id: "content",
      sections: [
        {
          id: "mapAndSpawning",
          options: b41([
            "Map",
            // New-player location and inventory.
            "SpawnPoint",
            "SpawnItems",
            // Visibility of other players on the in-game map.
            "MapRemotePlayerVisibility",
          ]),
        },
        {
          id: "modsAndWorkshop",
          // Workshop content first, followed by the mod IDs loaded by the server.
          options: b41(["WorkshopItems", "Mods"]),
        },
      ],
    },
    {
      id: "operations",
      sections: [
        {
          id: "savingAndBackups",
          // World saving first, then backup triggers and retention, followed by generated IDs.
          options: b41([
            "SaveWorldEveryMinutes",
            "BackupsOnStart",
            "BackupsOnVersionChange",
            "BackupsPeriod",
            "BackupsCount",
            "ResetID",
            "ServerPlayerID",
          ]),
        },
        {
          id: "loginAndPerformance",
          // Admission controls first, followed by connection-quality protections.
          options: b41([
            "DenyLoginOnOverloadedServer",
            "LoginQueueEnabled",
            "LoginQueueConnectTimeout",
            "PingLimit",
            "KickFastPlayers",
          ]),
        },
        {
          id: "loggingAndDiagnostics",
          options: b41(["PerkLogs", "ClientActionLogs", "ClientCommandFilter"]),
        },
      ],
    },
    {
      id: "security",
      sections: [
        { id: "protections", options: b41(["SteamVAC", "DoLuaChecksum"]) },
        {
          id: "antiCheat",
          // Keep the game's numbered order and each configurable threshold together.
          options: b41([
            "AntiCheatProtectionType1",
            "AntiCheatProtectionType2",
            "AntiCheatProtectionType2ThresholdMultiplier",
            "AntiCheatProtectionType3",
            "AntiCheatProtectionType3ThresholdMultiplier",
            "AntiCheatProtectionType4",
            "AntiCheatProtectionType4ThresholdMultiplier",
            "AntiCheatProtectionType5",
            "AntiCheatProtectionType6",
            "AntiCheatProtectionType7",
            "AntiCheatProtectionType8",
            "AntiCheatProtectionType9",
            "AntiCheatProtectionType9ThresholdMultiplier",
            "AntiCheatProtectionType10",
            "AntiCheatProtectionType11",
            "AntiCheatProtectionType12",
            "AntiCheatProtectionType13",
            "AntiCheatProtectionType14",
            "AntiCheatProtectionType15",
            "AntiCheatProtectionType15ThresholdMultiplier",
            "AntiCheatProtectionType16",
            "AntiCheatProtectionType17",
            "AntiCheatProtectionType18",
            "AntiCheatProtectionType19",
            "AntiCheatProtectionType20",
            "AntiCheatProtectionType20ThresholdMultiplier",
            "AntiCheatProtectionType21",
            "AntiCheatProtectionType22",
            "AntiCheatProtectionType22ThresholdMultiplier",
            "AntiCheatProtectionType23",
            "AntiCheatProtectionType24",
            "AntiCheatProtectionType24ThresholdMultiplier",
          ]),
        },
      ],
    },
  ],
  "42": [],
};
