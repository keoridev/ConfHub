import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/talk.dart';
import '../repositories/schedule_repository.dart';

class GetTalks {
  final ScheduleRepository repository;

  GetTalks(this.repository);

  Future<Either<Failure, List<Talk>>> call({
    required int conferenceId,
    int? sectionId,
    String? query,
    String? tag,
  }) async {
    return await repository.getConferenceTalks(
      conferenceId: conferenceId,
      sectionId: sectionId,
      query: query,
      tag: tag,
    );
  }
}
