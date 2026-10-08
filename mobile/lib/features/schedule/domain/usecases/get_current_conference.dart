import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/conference.dart';
import '../repositories/schedule_repository.dart';

class GetCurrentConference {
  final ScheduleRepository repository;

  GetCurrentConference(this.repository);

  Future<Either<Failure, Conference>> call() async {
    return await repository.getCurrentConference();
  }
}
