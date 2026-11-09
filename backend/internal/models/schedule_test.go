package models

import (
	"reflect"
	"testing"
)

func validSchedule() ScheduleSettings {
	return ScheduleSettings{
		Days:           []string{"2026-11-11", "2026-11-10", "2026-11-10"},
		DayStart:       "09:00",
		DayEnd:         "15:00",
		TalkMinutes:    10,
		KeynoteMinutes: 15,
		LunchStart:     "12:00",
		LunchEnd:       "13:00",
	}
}

func TestScheduleValidateNormalisesDays(t *testing.T) {
	s := validSchedule()
	if err := s.Validate(); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if want := []string{"2026-11-10", "2026-11-11"}; !reflect.DeepEqual(s.Days, want) {
		t.Errorf("days = %v, want %v", s.Days, want)
	}
}

func TestScheduleValidateWithoutLunch(t *testing.T) {
	s := validSchedule()
	s.LunchStart, s.LunchEnd = "", ""
	if err := s.Validate(); err != nil {
		t.Errorf("no lunch should be allowed: %v", err)
	}
}

func TestScheduleValidateRejects(t *testing.T) {
	tests := map[string]func(*ScheduleSettings){
		"no days":            func(s *ScheduleSettings) { s.Days = nil },
		"bad date":           func(s *ScheduleSettings) { s.Days = []string{"10.11.2026"} },
		"bad clock":          func(s *ScheduleSettings) { s.DayStart = "9" },
		"end before start":   func(s *ScheduleSettings) { s.DayStart, s.DayEnd = "15:00", "09:00" },
		"talk too short":     func(s *ScheduleSettings) { s.TalkMinutes = 2 },
		"keynote too long":   func(s *ScheduleSettings) { s.KeynoteMinutes = 200 },
		"only lunch start":   func(s *ScheduleSettings) { s.LunchEnd = "" },
		"lunch outside day":  func(s *ScheduleSettings) { s.LunchStart, s.LunchEnd = "14:30", "16:00" },
		"lunch ends earlier": func(s *ScheduleSettings) { s.LunchStart, s.LunchEnd = "13:00", "12:00" },
	}
	for name, mutate := range tests {
		t.Run(name, func(t *testing.T) {
			s := validSchedule()
			mutate(&s)
			if err := s.Validate(); err == nil {
				t.Error("expected an error")
			}
		})
	}
}
