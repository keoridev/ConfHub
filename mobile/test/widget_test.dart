import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/utils/time_status_helper.dart';

void main() {
  test('TimeStatusHelper commute calculation smoke test', () {
    final now = DateTime.now();
    final startTime = now.add(const Duration(minutes: 15));

    final estimate = TimeStatusHelper.estimateCommute(
      walkingMinutes: 4,
      startTime: startTime,
      currentTime: now,
    );

    expect(estimate.canMakeIt, isTrue);
    expect(estimate.marginMinutes, equals(11));
  });
}
