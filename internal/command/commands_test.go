package command

import "testing"

func TestUsernameEchoes(t *testing.T) {
	got := usernameEchoes("AТарас-1")
	want := []string{"AТарас-1", "A??????????-1"}
	if len(got) != len(want) {
		t.Fatalf("usernameEchoes() = %#v, want %#v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("usernameEchoes()[%d] = %q, want %q", i, got[i], want[i])
		}
	}
}

func TestCommandParsersAcceptMangledUnicodeUsernameEchoes(t *testing.T) {
	tests := []struct {
		name     string
		args     map[string]string
		response string
	}{
		{"additem", map[string]string{"username": "Тарас", "item": "Base.Axe"}, "Item Base.Axe Added in ??????????'s inventory."},
		{"adduser", map[string]string{"username": "Тарас", "password": "secret"}, "User ?????????? created with the password hash"},
		{"addxp", map[string]string{"username": "Тарас", "perk": "Fitness=5"}, "Added 5 Fitness xp's to ??????????"},
		{"banuser", map[string]string{"username": "Тарас"}, "User ?????????? is now banned"},
		{"unbanuser", map[string]string{"username": "Тарас"}, "User ?????????? is now un-banned"},
		{"godmode", map[string]string{"username": "Тарас", "state": "true"}, "User ?????????? is now invincible."},
		{"kick", map[string]string{"username": "Тарас"}, "User ?????????? kicked."},
		{"removeuserfromwhitelist", map[string]string{"username": "Тарас"}, "User ?????????? removed from white list"},
		{"setaccesslevel", map[string]string{"username": "Тарас", "level": "none"}, "User ?????????? no longer has access level"},
		{"teleport", map[string]string{"player1": "Тарас", "player2": "Зоя"}, "teleported ?????????? to ??????"},
		{"teleportto", map[string]string{"username": "Тарас", "coordinates": "1,2,0"}, "?????????? teleported to 1,2,0 please wait two seconds to show the map around you."},
		{"voiceban", map[string]string{"username": "Тарас", "state": "false"}, "User ?????????? voice is unbanned."},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			definition, ok := Lookup(tt.name, "41")
			if !ok {
				t.Fatalf("Lookup(%q) failed", tt.name)
			}
			if _, err := definition.Parse(tt.response, tt.args); err != nil {
				t.Fatalf("Parse() returned %v", err)
			}
		})
	}
}

func TestCommandParserRejectsDifferentMangledResponse(t *testing.T) {
	definition, ok := Lookup("setaccesslevel", "41")
	if !ok {
		t.Fatal("Lookup(setaccesslevel) failed")
	}
	args := map[string]string{"username": "Тарас", "level": "moderator"}
	if _, err := definition.Parse("User ????????? is now moderator", args); err == nil {
		t.Fatal("Parse() accepted an incorrectly mangled username")
	}
}

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
