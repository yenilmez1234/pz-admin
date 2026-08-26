// Package player stores known players for saved server profiles.
package player

import "time"

// Player is a player known to the application.
// Optional fields are nil when the active data source cannot observe them.
type Player struct {
	ID                 string    `json:"id"`
	Username           string    `json:"username"`
	AccessLevel        *string   `json:"accessLevel,omitempty"`
	GodMode            *bool     `json:"godMode,omitempty"`
	Invisible          *bool     `json:"invisible,omitempty"`
	NoClip             *bool     `json:"noClip,omitempty"`
	Banned             *bool     `json:"banned,omitempty"`
	VoiceBanned        *bool     `json:"voiceBanned,omitempty"`
	FirstSeenAt        time.Time `json:"firstSeenAt"`
	LastSeenOnlineAt   time.Time `json:"lastSeenOnlineAt"`
	LastKnownOfflineAt time.Time `json:"lastKnownOfflineAt"`
}

// Observation contains facts reported by a player data source. Nil fields are
// unknown and therefore do not overwrite previously known values.
type Observation struct {
	ID          string
	Username    string
	Online      *bool
	AccessLevel *string
	GodMode     *bool
	Invisible   *bool
	NoClip      *bool
	Banned      *bool
	VoiceBanned *bool
	Whitelisted *bool
}

// ActionResult reports the outcome of a player action for each requested ID.
type ActionResult struct {
	Succeeded []string        `json:"succeeded"`
	Failed    []ActionFailure `json:"failed"`
}

// ActionFailure identifies a player action that could not be completed.
type ActionFailure struct {
	PlayerID string `json:"playerId"`
	Message  string `json:"message"`
}

// ItemGrant describes an item and quantity to give to a player.
type ItemGrant struct {
	Item  string `json:"item"`
	Count int    `json:"count"`
}

// XPGrant describes an amount of XP to give in one perk.
type XPGrant struct {
	Perk   string `json:"perk"`
	Amount int    `json:"amount"`
}

// Update is emitted when the stored players for a server profile change.
type Update struct {
	ProfileID string   `json:"profileId"`
	Players   []Player `json:"players"`
}
