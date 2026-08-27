package command

import "testing"

func TestChangeOptionParserAcceptsServerNormalizedValues(t *testing.T) {
	definition, ok := Lookup("changeoption", "42")
	if !ok {
		t.Fatal("Lookup(changeoption) failed")
	}

	tests := []struct {
		name     string
		option   string
		value    string
		response string
	}{
		{"integer formatted as float", "VoiceMaxDistance", "99", "Option : VoiceMaxDistance is now : 99.0"},
		{"boolean true", "NoFire", "true", "Option : NoFire is now : true"},
		{"numeric boolean true", "NoFire", "1", "Option : NoFire is now : true"},
		{"numeric boolean false", "NoFire", "0", "Option : NoFire is now : false"},
		{"string", "ServerWelcomeMessage", "hello", "Option : ServerWelcomeMessage is now : hello"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			args := map[string]string{"option": test.option, "value": test.value}
			if _, err := definition.Parse(test.response, args); err != nil {
				t.Fatalf("Parse() returned %v", err)
			}
		})
	}
}

func TestChangeOptionParserRejectsDifferentValue(t *testing.T) {
	definition, ok := Lookup("changeoption", "42")
	if !ok {
		t.Fatal("Lookup(changeoption) failed")
	}
	args := map[string]string{"option": "VoiceMaxDistance", "value": "99"}
	if _, err := definition.Parse("Option : VoiceMaxDistance is now : 100.0", args); err == nil {
		t.Fatal("Parse() accepted a different option value")
	}
}

func TestVersionedCommandResponses(t *testing.T) {
	tests := []struct {
		command  string
		build    string
		args     map[string]string
		response string
	}{
		{"adduser", "41", map[string]string{"username": "Alice", "password": "secret"}, "User Alice created with the password hash"},
		{"adduser", "42", map[string]string{"username": "Alice", "password": "secret"}, "User Alice created with password"},
		{"addxp", "41", map[string]string{"username": "Alice", "perk": "Fitness=90000"}, "Added 90000 Fitness xp's to Alice"},
		{"addxp", "42", map[string]string{"username": "Alice", "perk": "Fitness=90000"}, "Added 90000.0 Fitness xp's to Alice"},
		{"addtosafehouse", "42", map[string]string{"safehouse": "ev", "username": "Alice"}, "Player Alice invited to safehouse ev"},
		{"banid", "41", map[string]string{"steamid": "000000"}, "SteamID 000000 is now banned"},
		{"banid", "42", map[string]string{"steamid": "000000"}, "System banned SteamID 000000()"},
		{"banid", "42", map[string]string{"steamid": "00000000000000000"}, "System banned SteamID 00000000000000000(test, )"},
		{"banuser", "41", map[string]string{"username": "Alice"}, "User Alice is now banned"},
		{"banuser", "42", map[string]string{"username": "Alice"}, "System banned user Alice"},
		{"godmodeplayer", "42", map[string]string{"username": "Alice", "state": "true"}, "User Alice is now invincible."},
		{"godmodeplayer", "42", map[string]string{"username": "Alice", "state": "false"}, "User Alice is no longer invincible."},
		{"invisibleplayer", "42", map[string]string{"username": "Alice", "state": "true"}, "User Alice is now invisible."},
		{"kickfromsafehouse", "42", map[string]string{"safehouse": "ev", "username": "Alice"}, "Player Alice kicked from a safehouse ev"},
		{"releasesafehouse", "42", map[string]string{"safehouse": "ev"}, "Safehouse ev released"},
		{"setpassword", "42", map[string]string{"username": "Alice", "password": "secret"}, "Your new password is $2a$12$O/BFHoDFPrfFaNPAACmWpuMCmHRg5rkwMMGiwJ/VXw4XEzM52qB8q"},
		{"invisibleplayer", "42", map[string]string{"username": "Alice", "state": "false"}, "User Alice is no longer invisible."},
		{"noclip", "42", map[string]string{"username": "Alice", "state": "true"}, "User Alice won't collide."},
		{"noclip", "42", map[string]string{"username": "Alice", "state": "false"}, "User Alice will collide."},
		{"teleportplayer", "42", map[string]string{"player1": "Alice", "player2": "Bob"}, "teleported Alice to Bob"},
		{"unbanid", "41", map[string]string{"steamid": "000000"}, "SteamID 000000 is now unbanned"},
		{"unbanid", "42", map[string]string{"steamid": "000000"}, "SteamID 000000 is now unbanned"},
		{"unbanuser", "41", map[string]string{"username": "Alice"}, "User Alice is now un-banned"},
		{"unbanuser", "42", map[string]string{"username": "Alice"}, "System unbanned user Alice"},
	}

	for _, test := range tests {
		t.Run("Build "+test.build+"/"+test.command, func(t *testing.T) {
			definition, ok := Lookup(test.command, test.build)
			if !ok {
				t.Fatalf("Lookup(%s, %s) failed", test.command, test.build)
			}
			if _, err := definition.Parse(test.response, test.args); err != nil {
				t.Fatalf("Parse() returned %v", err)
			}
		})
	}
}
