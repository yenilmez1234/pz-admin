package player

import (
	"regexp"
	"strings"
	"time"

	"github.com/beyenilmez/pz-admin/internal/profile"
)

type consoleObservationRule struct {
	input     *regexp.Regexp
	responses []consoleResponseRule
}

type consoleResponseRule struct {
	build   string
	output  *regexp.Regexp
	observe func(build, username string, captures map[string]string) Observation
}

var consoleObservationRules = []consoleObservationRule{
	{
		input: regexp.MustCompile(`(?i)^adduser\s+(?P<username>"[^"]+"|'[^']+'|\S+)\s+.+$`),
		responses: []consoleResponseRule{
			{
				build:  "41",
				output: regexp.MustCompile(`^User (?P<username>.+?) created with the password .+$`),
				observe: func(build, username string, _ map[string]string) Observation {
					return addedUserObservation(build, username)
				},
			},
			{
				build:  "42",
				output: regexp.MustCompile(`^User (?P<username>.+?) created with password\.?$`),
				observe: func(build, username string, _ map[string]string) Observation {
					return addedUserObservation(build, username)
				},
			},
		},
	},
	{
		input: regexp.MustCompile(`(?i)^banuser\s+(?P<username>"[^"]+"|'[^']+'|\S+)(?:\s+.*)?$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) is now banned\.?$`, func(build string) Observation {
				return bannedObservation(build, nil)
			}),
			observationResponse(`^System banned user (?P<username>.+?)\.?$`, func(build string) Observation {
				return bannedObservation(build, nil)
			}),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^unbanuser\s+(?P<username>"[^"]+"|'[^']+'|\S+)$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) is now un-banned\.?$`, unbannedObservation),
			observationResponse(`^System unbanned user (?P<username>.+?)\.?$`, unbannedObservation),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^kick\s+(?P<username>"[^"]+"|'[^']+'|\S+)(?:\s+.*)?$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) kicked\.?$`, func(build string) Observation {
				return offlineObservation(build, nil)
			}),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^(?:godmode|godmodeplayer|godmod|godmodplayer)\s+(?P<username>"[^"]+"|'[^']+'|\S+)(?:\s+-(?:true|false))?$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) is now invincible\.?$`, func(string) Observation {
				return godModeObservation(true)
			}),
			observationResponse(`^User (?P<username>.+?) is (?:no more|no longer) invincible\.?$`, func(string) Observation {
				return godModeObservation(false)
			}),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^invisibleplayer\s+(?P<username>"[^"]+"|'[^']+'|\S+)(?:\s+-(?:true|false))?$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) is now invisible\.?$`, func(string) Observation {
				return invisibleObservation(true)
			}),
			observationResponse(`^User (?P<username>.+?) is no longer invisible\.?$`, func(string) Observation {
				return invisibleObservation(false)
			}),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^noclip\s+(?P<username>"[^"]+"|'[^']+'|\S+)(?:\s+-(?:true|false))?$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) won't collide\.?$`, func(string) Observation {
				return noClipObservation(true)
			}),
			observationResponse(`^User (?P<username>.+?) will collide\.?$`, func(string) Observation {
				return noClipObservation(false)
			}),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^removeuserfromwhitelist\s+(?P<username>"[^"]+"|'[^']+'|\S+)$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) removed from white list\.?$`, func(string) Observation {
				return whitelistedObservation(false)
			}),
		},
	},
	{
		input: regexp.MustCompile(`(?i)^setaccesslevel\s+(?P<username>"[^"]+"|'[^']+'|\S+)\s+(?:"[^"]+"|'[^']+'|\S+)$`),
		responses: []consoleResponseRule{
			{
				output: regexp.MustCompile(`^User (?P<username>.+?) is now (?P<accessLevel>\S+)\.?$`),
				observe: func(build, username string, captures map[string]string) Observation {
					level := strings.TrimSuffix(captures["accessLevel"], ".")
					observation := accessLevelObservation(build, level)
					observation.Username = username
					return observation
				},
			},
			{
				build:  "41",
				output: regexp.MustCompile(`^User (?P<username>.+?) no longer has access level\.?$`),
				observe: func(build, username string, _ map[string]string) Observation {
					observation := accessLevelObservation(build, "none")
					observation.Username = username
					return observation
				},
			},
		},
	},
	{
		input: regexp.MustCompile(`(?i)^grantadmin\s+(?P<username>"[^"]+"|'[^']+'|\S+)$`),
		responses: []consoleResponseRule{
			{
				output: regexp.MustCompile(`^User (?P<username>.+?) is now admin\.?$`),
				observe: func(build, username string, _ map[string]string) Observation {
					observation := accessLevelObservation(build, "admin")
					observation.Username = username
					return observation
				},
			},
		},
	},
	{
		input: regexp.MustCompile(`(?i)^removeadmin\s+(?P<username>"[^"]+"|'[^']+'|\S+)$`),
		responses: []consoleResponseRule{
			{
				build:  "41",
				output: regexp.MustCompile(`^User (?P<username>.+?) no longer has access level\.?$`),
				observe: func(build, username string, _ map[string]string) Observation {
					observation := accessLevelObservation(build, "none")
					observation.Username = username
					return observation
				},
			},
		},
	},
	{
		input: regexp.MustCompile(`(?i)^voiceban\s+(?P<username>"[^"]+"|'[^']+'|\S+)(?:\s+-(?:true|false))?$`),
		responses: []consoleResponseRule{
			observationResponse(`^User (?P<username>.+?) voice is banned\.?$`, func(string) Observation {
				return voiceBannedObservation(true)
			}),
			observationResponse(`^User (?P<username>.+?) voice is unbanned\.?$`, func(string) Observation {
				return voiceBannedObservation(false)
			}),
		},
	},
}

// ObserveConsoleCommand records only player facts explicitly confirmed by a
// recognized console response. Ambiguous and unsuccessful responses are ignored.
//
//wails:ignore
func (s *Service) ObserveConsoleCommand(p profile.Profile, input, output string) error {
	for _, rule := range consoleObservationRules {
		inputCaptures := rule.input.FindStringSubmatch(strings.TrimSpace(input))
		if inputCaptures == nil {
			continue
		}
		username := strings.Trim(namedCapture(rule.input, inputCaptures, "username"), `"'`)
		for _, response := range rule.responses {
			if response.build != "" && response.build != p.Version {
				continue
			}
			outputCaptures := response.output.FindStringSubmatch(strings.TrimSpace(output))
			if outputCaptures == nil ||
				!consoleUsernameMatches(username, namedCapture(response.output, outputCaptures, "username")) {
				continue
			}
			observation := response.observe(p.Version, username, namedCaptures(response.output, outputCaptures))
			if observation.Online.operation == setObservation && !observation.Online.value {
				accessLevel, err := s.storedAccessLevel(p.ID, username)
				if err != nil {
					return err
				}
				offline := offlineObservation(p.Version, accessLevel)
				observation.Online = offline.Online
				observation.GodMode = offline.GodMode
				observation.Invisible = offline.Invisible
				observation.NoClip = offline.NoClip
				observation.VoiceBanned = offline.VoiceBanned
			}
			_, err := s.merge(p.ID, []Observation{observation}, time.Now().UTC())
			return err
		}
		return nil
	}
	return nil
}

func (s *Service) storedAccessLevel(profileID, username string) (*string, error) {
	players, err := s.List(profileID)
	if err != nil {
		return nil, err
	}
	for _, player := range players {
		if strings.EqualFold(player.Username, username) {
			return player.AccessLevel, nil
		}
	}
	return nil, nil
}

func observationResponse(pattern string, observation func(string) Observation) consoleResponseRule {
	return consoleResponseRule{
		output: regexp.MustCompile(pattern),
		observe: func(build, username string, _ map[string]string) Observation {
			result := observation(build)
			result.Username = username
			return result
		},
	}
}

func namedCapture(pattern *regexp.Regexp, captures []string, name string) string {
	index := pattern.SubexpIndex(name)
	if index == -1 || index >= len(captures) {
		return ""
	}
	return captures[index]
}

func namedCaptures(pattern *regexp.Regexp, captures []string) map[string]string {
	values := make(map[string]string)
	for index, name := range pattern.SubexpNames() {
		if index > 0 && name != "" && index < len(captures) {
			values[name] = captures[index]
		}
	}
	return values
}

func consoleUsernameMatches(input, output string) bool {
	if input == output {
		return true
	}
	mangled := []byte(input)
	changed := false
	for index, character := range mangled {
		if character > 0x7f {
			mangled[index] = '?'
			changed = true
		}
	}
	return changed && string(mangled) == output
}
