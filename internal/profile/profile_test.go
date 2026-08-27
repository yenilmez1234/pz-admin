package profile

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/connection"
)

func TestOpenMissing(t *testing.T) {
	path := filepath.Join(t.TempDir(), "profiles.json")
	s, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	if got := len(s.List()); got != 0 {
		t.Errorf("List() = %d profiles, want 0", got)
	}
}

func TestOpenCorrupt(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "profiles.json")
	if err := os.WriteFile(path, []byte("not json"), 0o600); err != nil {
		t.Fatal(err)
	}
	s, err := Open(path)
	if err != nil {
		t.Fatalf("Open with corrupt file: %v", err)
	}
	if got := len(s.List()); got != 0 {
		t.Errorf("List() = %d profiles, want 0 after recovery", got)
	}
	if _, err := os.Stat(path + ".bak"); os.IsNotExist(err) {
		t.Error("backup file not created")
	}
}

func TestSaveNew(t *testing.T) {
	s := openEmpty(t)
	if _, err := s.Save(Profile{ConnectionType: connection.TypeRCON, Name: "test", Host: "1.2.3.4", Port: 27015, Version: "42"}); err != nil {
		t.Fatal(err)
	}
	list := s.List()
	if len(list) != 1 {
		t.Fatalf("got %d profiles, want 1", len(list))
	}
	p := list[0]
	if p.ID == "" {
		t.Error("ID not generated")
	}
	if p.Name != "test" || p.Host != "1.2.3.4" || p.Port != 27015 {
		t.Errorf("got %+v", p)
	}
}

func TestSaveUpdate(t *testing.T) {
	s := openEmpty(t)
	if _, err := s.Save(Profile{ConnectionType: connection.TypeRCON, Name: "first", Host: "1.1.1.1", Port: 1111, Version: "42"}); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Save(Profile{ConnectionType: connection.TypeRCON, Name: "second", Host: "3.3.3.3", Port: 3333, Version: "42"}); err != nil {
		t.Fatal(err)
	}
	list := s.List()
	id := list[0].ID

	if _, err := s.Save(Profile{ConnectionType: connection.TypeRCON, ID: id, Name: "updated", Host: "2.2.2.2", Port: 2222, Version: "41"}); err != nil {
		t.Fatal(err)
	}
	list = s.List()
	if len(list) != 2 {
		t.Fatalf("got %d profiles, want 2", len(list))
	}
	if list[0].Name != "updated" {
		t.Errorf("Name = %q, want %q", list[0].Name, "updated")
	}
	if list[1].Name != "second" {
		t.Errorf("second profile moved during update: got %q", list[1].Name)
	}
}

func TestSaveValidation(t *testing.T) {
	s := openEmpty(t)
	tests := []struct {
		name string
		p    Profile
	}{
		{"no name", Profile{ConnectionType: connection.TypeRCON, Host: "h", Port: 1}},
		{"no host", Profile{ConnectionType: connection.TypeRCON, Name: "n", Port: 1}},
		{"no port", Profile{ConnectionType: connection.TypeRCON, Name: "n", Host: "h"}},
		{"unsupported connection type", Profile{ConnectionType: "unknown", Name: "n", Host: "h", Port: 1}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if _, err := s.Save(test.p); err == nil {
				t.Error("expected error, got nil")
			}
		})
	}
}

func TestDelete(t *testing.T) {
	s := openEmpty(t)
	_, _ = s.Save(Profile{ConnectionType: connection.TypeRCON, Name: "test", Host: "h", Port: 1, Version: "42"})
	list := s.List()
	id := list[0].ID

	if err := s.Delete(id); err != nil {
		t.Fatal(err)
	}
	if len(s.List()) != 0 {
		t.Error("profile not deleted")
	}
}

func TestDeleteNotFound(t *testing.T) {
	s := openEmpty(t)
	if err := s.Delete("nonexistent"); err == nil {
		t.Error("expected error, got nil")
	}
}

func TestListIsCopy(t *testing.T) {
	s := openEmpty(t)
	_, _ = s.Save(Profile{ConnectionType: connection.TypeRCON, Name: "test", Host: "h", Port: 1, Version: "42"})
	list := s.List()
	list[0].Name = "mutated"
	if list2 := s.List(); list2[0].Name != "test" {
		t.Error("List() returned a shared slice")
	}
}

func TestPersistence(t *testing.T) {
	path := filepath.Join(t.TempDir(), "profiles.json")

	s1, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s1.Save(Profile{ConnectionType: connection.TypeRCON, Name: "test", Host: "h", Port: 1, Version: "42"}); err != nil {
		t.Fatal(err)
	}

	s2, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	list := s2.List()
	if len(list) != 1 {
		t.Fatalf("got %d profiles, want 1", len(list))
	}
	if list[0].Version != "42" {
		t.Errorf("Version = %q, want %q", list[0].Version, "42")
	}
}

func openEmpty(t *testing.T) *Store {
	t.Helper()
	s, err := Open(filepath.Join(t.TempDir(), "profiles.json"))
	if err != nil {
		t.Fatal(err)
	}
	return s
}
