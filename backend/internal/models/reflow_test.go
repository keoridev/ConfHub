package models

import (
	"testing"
	"time"
)

func at(hhmm string) time.Time {
	t, err := time.Parse("2006-01-02 15:04", "2026-11-10 "+hhmm)
	if err != nil {
		panic(err)
	}
	return t
}

func slot(id int64, from, to string) TimedTalk { return TimedTalk{ID: id, Start: at(from), End: at(to)} }

func clocks(changes []TimeChange) map[int64]string {
	m := map[int64]string{}
	for _, c := range changes {
		m[c.ID] = c.Start.Format("15:04") + "-" + c.End.Format("15:04")
	}
	return m
}

func noOverlapWhenApplied(t *testing.T, all []TimedTalk, changes []TimeChange) {
	t.Helper()
	cur := map[int64]TimedTalk{}
	for _, s := range all {
		cur[s.ID] = s
	}
	for _, c := range changes {
		cur[c.ID] = TimedTalk{ID: c.ID, Start: c.Start, End: c.End}
		for id, o := range cur {
			if id != c.ID && c.Start.Before(o.End) && o.Start.Before(c.End) {
				t.Fatalf("after moving %d to %s-%s it overlaps %d", c.ID, c.Start.Format("15:04"), c.End.Format("15:04"), id)
			}
		}
	}
}

func TestReflowExtendPushesChain(t *testing.T) {
	target := slot(1, "09:00", "09:10")
	following := []TimedTalk{slot(2, "09:10", "09:20"), slot(3, "09:20", "09:30"), slot(4, "10:00", "10:10")}
	changes := PlanDurationReflow(target, 15*time.Minute, following, nil, nil)
	got := clocks(changes)
	want := map[int64]string{1: "09:00-09:15", 2: "09:15-09:25", 3: "09:25-09:35"}
	if len(got) != len(want) {
		t.Fatalf("changes = %v, want %v (talk 4 is after a gap)", got, want)
	}
	for id, w := range want {
		if got[id] != w {
			t.Errorf("talk %d = %s, want %s", id, got[id], w)
		}
	}
	noOverlapWhenApplied(t, append([]TimedTalk{target}, following...), changes)
}

func TestReflowExtendSkipsLunch(t *testing.T) {
	lunchStart, lunchEnd := at("12:00"), at("13:00")
	target := slot(1, "11:40", "11:50")
	following := []TimedTalk{slot(2, "11:50", "12:00"), slot(3, "13:00", "13:10")}
	changes := PlanDurationReflow(target, 15*time.Minute, following, &lunchStart, &lunchEnd)
	got := clocks(changes)
	if got[2] != "13:00-13:10" || got[3] != "13:10-13:20" {
		t.Errorf("got %v: talk 2 must move past lunch and push talk 3", got)
	}
	noOverlapWhenApplied(t, append([]TimedTalk{target}, following...), changes)
}

func TestReflowShrinkPullsBackToBackOnly(t *testing.T) {
	target := slot(1, "09:00", "09:15")
	following := []TimedTalk{slot(2, "09:15", "09:25"), slot(3, "09:25", "09:35"), slot(4, "10:00", "10:10")}
	changes := PlanDurationReflow(target, 10*time.Minute, following, nil, nil)
	got := clocks(changes)
	want := map[int64]string{1: "09:00-09:10", 2: "09:10-09:20", 3: "09:20-09:30"}
	if len(got) != len(want) {
		t.Fatalf("changes = %v, want %v", got, want)
	}
	for id, w := range want {
		if got[id] != w {
			t.Errorf("talk %d = %s, want %s", id, got[id], w)
		}
	}
	noOverlapWhenApplied(t, append([]TimedTalk{target}, following...), changes)
}

func TestReflowSameDurationIsNoop(t *testing.T) {
	if c := PlanDurationReflow(slot(1, "09:00", "09:15"), 15*time.Minute, nil, nil, nil); c != nil {
		t.Errorf("expected no changes, got %v", c)
	}
}
