import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/utils/time_status_helper.dart';

void main() {
  group('TimeStatusHelper commute calculation tests', () {
    test('Calculates safe margin when guest has plenty of time', () {
      final now = DateTime.now();
      final startTime = now.add(const Duration(minutes: 20));

      final estimate = TimeStatusHelper.estimateCommute(
        walkingMinutes: 5,
        startTime: startTime,
        currentTime: now,
      );

      expect(estimate.canMakeIt, isTrue);
      expect(estimate.marginMinutes, equals(15));
      expect(estimate.isLive, isFalse);
      expect(estimate.isFinished, isFalse);
    });

    test('Calculates hurry warning when margin is tight (less than 7 mins)', () {
      final now = DateTime.now();
      final startTime = now.add(const Duration(minutes: 6));

      final estimate = TimeStatusHelper.estimateCommute(
        walkingMinutes: 4,
        startTime: startTime,
        currentTime: now,
      );

      expect(estimate.canMakeIt, isTrue);
      expect(estimate.marginMinutes, equals(2));
      expect(estimate.verdict, contains('Успеваете впритык'));
    });

    test('Calculates late warning when guest walks slower than time left', () {
      final now = DateTime.now();
      final startTime = now.add(const Duration(minutes: 2));

      final estimate = TimeStatusHelper.estimateCommute(
        walkingMinutes: 5,
        startTime: startTime,
        currentTime: now,
      );

      expect(estimate.canMakeIt, isFalse);
      expect(estimate.marginMinutes, equals(-3));
      expect(estimate.verdict, contains('Опоздание на ~3 мин'));
    });

    test('Handles live talk in progress correctly', () {
      final now = DateTime.now();
      final startTime = now.subtract(const Duration(minutes: 10));
      final endTime = now.add(const Duration(minutes: 30));

      final estimate = TimeStatusHelper.estimateCommute(
        walkingMinutes: 5,
        startTime: startTime,
        endTime: endTime,
        currentTime: now,
      );

      expect(estimate.isLive, isTrue);
      expect(estimate.canMakeIt, isTrue);
      expect(estimate.verdict, contains('Доклад идёт уже 10 мин'));
    });

    test('Handles talk that already finished', () {
      final now = DateTime.now();
      final startTime = now.subtract(const Duration(minutes: 60));
      final endTime = now.subtract(const Duration(minutes: 15));

      final estimate = TimeStatusHelper.estimateCommute(
        walkingMinutes: 5,
        startTime: startTime,
        endTime: endTime,
        currentTime: now,
      );

      expect(estimate.isFinished, isTrue);
      expect(estimate.canMakeIt, isFalse);
      expect(estimate.verdict, contains('завершился'));
    });
  });

  group('TimeStatusHelper calculateStatus tests', () {
    test('Correctly identifies live talk', () {
      final now = DateTime.now();
      final startTime = now.subtract(const Duration(minutes: 5));
      final endTime = now.add(const Duration(minutes: 25));

      final status = TimeStatusHelper.calculateStatus(
        startTime: startTime,
        endTime: endTime,
        currentTime: now,
      );

      expect(status.urgency, equals(TalkUrgency.live));
      expect(status.label, equals('Идёт сейчас'));
    });

    test('Correctly identifies imminent hurry talk (<= 10 mins)', () {
      final now = DateTime.now();
      final startTime = now.add(const Duration(minutes: 8));

      final status = TimeStatusHelper.calculateStatus(
        startTime: startTime,
        endTime: null,
        currentTime: now,
      );

      expect(status.urgency, equals(TalkUrgency.hurry));
      expect(status.label, contains('Впритык! Через 8 мин'));
    });

    test('Correctly identifies canMakeIt upcoming talk (11..45 mins)', () {
      final now = DateTime.now();
      final startTime = now.add(const Duration(minutes: 25));

      final status = TimeStatusHelper.calculateStatus(
        startTime: startTime,
        endTime: null,
        currentTime: now,
      );

      expect(status.urgency, equals(TalkUrgency.canMakeIt));
      expect(status.label, contains('Успеваете! (через 25 мин)'));
    });
  });
}
