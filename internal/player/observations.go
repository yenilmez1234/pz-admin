package player

import "strings"

func isB41StaffAccess(accessLevel string) bool {
	switch strings.ToLower(accessLevel) {
	case "observer", "gm", "overseer", "moderator", "admin":
		return true
	default:
		return false
	}
}

func isB42RegularAccess(accessLevel string) bool {
	switch strings.ToLower(accessLevel) {
	case "user", "priority", "banned":
		return true
	default:
		return false
	}
}

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

func onlineObservation() Observation {
	return Observation{
		Online: Known(true),
		Banned: Known(false),
	}
}

func bannedObservation(build string, accessLevel *string) Observation {
	observation := offlineObservation(build, accessLevel)
	observation.Banned = Known(true)
	if build != "41" {
		observation.AccessLevel = Known("user")
	}
	return observation
}

func unbannedObservation(string) Observation {
	return Observation{Banned: Known(false)}
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

func accessLevelObservation(build, level string, player *Player) Observation {
	observation := Observation{AccessLevel: Known(level)}
	if build == "41" {
		if strings.EqualFold(level, "none") {
			observation.GodMode = Known(false)
			observation.Invisible = Known(false)
			observation.NoClip = Known(false)
		} else if isB41StaffAccess(level) {
			observation.GodMode = Known(true)
			observation.Invisible = Known(true)
		}
		return observation
	}

	observation.Banned = Known(strings.EqualFold(level, "banned"))
	if player.isOnline() && player.AccessLevel != nil {
		previousStaff := isB41StaffAccess(*player.AccessLevel)
		newStaff := isB41StaffAccess(level)
		switch {
		case isB42RegularAccess(*player.AccessLevel) && newStaff:
			observation.GodMode = Known(true)
			observation.Invisible = Known(true)
			observation.NoClip = Known(true)
		case previousStaff && isB42RegularAccess(level):
			observation.GodMode = Known(false)
			observation.Invisible = Known(false)
			observation.NoClip = Known(false)
		}
	}
	if strings.EqualFold(level, "banned") {
		banned := bannedObservation(build, nil)
		observation.Online = banned.Online
		observation.AccessLevel = banned.AccessLevel
		observation.Banned = banned.Banned
		observation.VoiceBanned = banned.VoiceBanned
	}
	return observation
}
