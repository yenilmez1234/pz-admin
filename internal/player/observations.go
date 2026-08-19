package player

import "strings"

func addedUserObservation(build, username string) Observation {
	accessLevel := "none"
	if build != "41" {
		accessLevel = "user"
	}
	disabled := false
	whitelisted := true
	return Observation{
		Username:    username,
		AccessLevel: &accessLevel,
		GodMode:     &disabled,
		Invisible:   &disabled,
		NoClip:      &disabled,
		Banned:      &disabled,
		VoiceBanned: &disabled,
		Whitelisted: &whitelisted,
	}
}

func offlineObservation() Observation {
	online := false
	return Observation{Online: &online}
}

func bannedObservation(build string) Observation {
	banned := true
	disabled := false
	online := false
	accessLevel := "banned"
	if build == "41" {
		accessLevel = "none"
	}
	return Observation{
		Online:      &online,
		AccessLevel: &accessLevel,
		GodMode:     &disabled,
		Invisible:   &disabled,
		NoClip:      &disabled,
		Banned:      &banned,
	}
}

func unbannedObservation(build string) Observation {
	banned := false
	observation := Observation{Banned: &banned}
	if build != "41" {
		accessLevel := "user"
		observation.AccessLevel = &accessLevel
	}
	return observation
}

func godModeObservation(enabled bool) Observation {
	return Observation{GodMode: &enabled}
}

func invisibleObservation(enabled bool) Observation {
	return Observation{Invisible: &enabled}
}

func noClipObservation(enabled bool) Observation {
	return Observation{NoClip: &enabled}
}

func voiceBannedObservation(banned bool) Observation {
	return Observation{VoiceBanned: &banned}
}

func whitelistedObservation(whitelisted bool) Observation {
	return Observation{Whitelisted: &whitelisted}
}

func accessLevelObservation(build, level string) Observation {
	observation := Observation{AccessLevel: &level}
	if build != "41" {
		banned := strings.EqualFold(level, "banned")
		observation.Banned = &banned
	}
	return observation
}
