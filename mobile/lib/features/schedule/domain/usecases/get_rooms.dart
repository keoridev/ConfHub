import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/room.dart';
import '../repositories/schedule_repository.dart';

class GetRooms {
  final ScheduleRepository repository;

  GetRooms(this.repository);

  Future<Either<Failure, List<Room>>> call({int? conferenceId}) async {
    return await repository.getRooms(conferenceId: conferenceId);
  }
}
