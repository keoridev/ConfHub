package models

import (
	"sort"
	"time"
)

// TimedTalk is a scheduled talk reduced to what reflowing needs.
type TimedTalk struct {
	ID         int64
	Start, End time.Time
}

// TimeChange is a new slot for one talk.
type TimeChange struct {
	ID         int64
	Start, End time.Time
}

// PlanDurationReflow resizes target to newDuration (keeping its start) and moves the talks
// after it in the same room and day so nothing overlaps:
//   - longer: following talks are pushed later one by one until a gap absorbs the extra time;
//     a talk that would run into lunch moves to the end of lunch;
//   - shorter: talks that ran back-to-back after target are pulled earlier, stopping at the first gap.
//
// following must be the talks starting after target in that room and day. The changes are
// returned in an order that never makes two talks overlap when applied one UPDATE at a time.
func PlanDurationReflow(target TimedTalk, newDuration time.Duration, following []TimedTalk, lunchStart, lunchEnd *time.Time) []TimeChange {
	newEnd := target.Start.Add(newDuration)
	if newEnd.Equal(target.End) {
		return nil
	}
	sorted := append([]TimedTalk(nil), following...)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].Start.Before(sorted[j].Start) })

	self := TimeChange{ID: target.ID, Start: target.Start, End: newEnd}
	var moved []TimeChange

	if newEnd.After(target.End) {
		cursor := newEnd
		for _, t := range sorted {
			if !t.Start.Before(cursor) {
				break // a gap absorbs the extra time
			}
			dur := t.End.Sub(t.Start)
			start := cursor
			if lunchStart != nil && lunchEnd != nil && start.Before(*lunchEnd) && start.Add(dur).After(*lunchStart) {
				start = *lunchEnd
			}
			moved = append(moved, TimeChange{ID: t.ID, Start: start, End: start.Add(dur)})
			cursor = start.Add(dur)
		}
		// Pushing later: move the last talk first, the resized target last
		changes := make([]TimeChange, 0, len(moved)+1)
		for i := len(moved) - 1; i >= 0; i-- {
			changes = append(changes, moved[i])
		}
		return append(changes, self)
	}

	cursor := newEnd
	prevEnd := target.End
	for _, t := range sorted {
		if !t.Start.Equal(prevEnd) {
			break // not back-to-back: leave the rest where it is
		}
		dur := t.End.Sub(t.Start)
		moved = append(moved, TimeChange{ID: t.ID, Start: cursor, End: cursor.Add(dur)})
		prevEnd = t.End
		cursor = cursor.Add(dur)
	}
	// Pulling earlier: shrink the target first, then move talks in order
	return append([]TimeChange{self}, moved...)
}
