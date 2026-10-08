import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/section.dart';
import '../repositories/schedule_repository.dart';

class GetSections {
  final ScheduleRepository repository;

  GetSections(this.repository);

  Future<Either<Failure, List<Section>>> call({int? conferenceId}) async {
    return await repository.getSections(conferenceId: conferenceId);
  }
}
