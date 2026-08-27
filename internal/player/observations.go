package player

import "strings"

// addedUserObservation uses false defaults for the common case of a genuinely
// new player.
func addedUserObservation(build, username string) Observation {
	accessLevel := "none"
	if build != "41" {
		accessLevel = "user"
	}
	return Observation{
		Username:    username,
		AccessLevel: Known(accessLevel),
		GodMode:     Known(false),
		Invisible:   Known(false),
		NoClip:      Known(false),
		Banned:      Known(false),
		VoiceBanned: Known(false),
	}
}

func offlineObservation(build string, accessLevel *string) Observation {
	observation := Observation{
		Online:      Known(false),
		VoiceBanned: Unknown[bool](),
	}
	if build != "41" {
		return observation
	}
	if accessLevel == nil {
		observation.GodMode = Unknown[bool]()
		observation.Invisible = Unknown[bool]()
		observation.NoClip = Unknown[bool]()
		return observation
	}
	staff := isB41StaffAccess(*accessLevel)
	observation.GodMode = Known(staff)
	observation.Invisible = Known(staff)
	observation.NoClip = Known(false)
	return observation
}

func isB41StaffAccess(accessLevel string) bool {
	switch strings.ToLower(accessLevel) {
	case "observer", "gm", "overseer", "moderator", "admin":
		return true
	default:
		return false
	}
}

func onlineObservation() Observation {
	return Observation{
		Online: Known(true),
		Banned: Known(false),
	}
}

func bannedObservation(build string) Observation {
	accessLevel := "banned"
	if build == "41" {
		accessLevel = "none"
	}
	return Observation{
		Online:      Known(false),
		AccessLevel: Known(accessLevel),
		GodMode:     Known(false),
		Invisible:   Known(false),
		NoClip:      Known(false),
		Banned:      Known(true),
	}
}

func unbannedObservation(build string) Observation {
	observation := Observation{Banned: Known(false)}
	if build != "41" {
		accessLevel := "user"
		observation.AccessLevel = Known(accessLevel)
	}
	return observation
}

func godModeObservation(enabled bool) Observation {
	return Observation{GodMode: Known(enabled)}
}

func invisibleObservation(enabled bool) Observation {
	return Observation{Invisible: Known(enabled)}
}

func noClipObservation(enabled bool) Observation {
	return Observation{NoClip: Known(enabled)}
}

func voiceBannedObservation(banned bool) Observation {
	return Observation{VoiceBanned: Known(banned)}
}

func whitelistedObservation(whitelisted bool) Observation {
	return Observation{Delete: !whitelisted}
}

func accessLevelObservation(build, level string) Observation {
	observation := Observation{AccessLevel: Known(level)}
	if build != "41" {
		observation.Banned = Known(strings.EqualFold(level, "banned"))
	}
	return observation
}
