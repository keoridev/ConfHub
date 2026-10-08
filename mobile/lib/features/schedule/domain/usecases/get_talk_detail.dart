import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/talk.dart';
import '../repositories/schedule_repository.dart';

class GetTalkDetail {
  final ScheduleRepository repository;

  GetTalkDetail(this.repository);

  Future<Either<Failure, Talk>> call(int talkId) async {
    return await repository.getTalkDetail(talkId);
  }
}
