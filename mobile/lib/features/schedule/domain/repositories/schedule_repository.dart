import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/conference.dart';
import '../entities/section.dart';
import '../entities/room.dart';
import '../entities/talk.dart';

abstract class ScheduleRepository {
  Future<Either<Failure, Conference>> getCurrentConference();
  Future<Either<Failure, List<Section>>> getSections({int? conferenceId});
  Future<Either<Failure, List<Room>>> getRooms({int? conferenceId});
  Future<Either<Failure, List<Talk>>> getConferenceTalks({
    required int conferenceId,
    int? sectionId,
    String? query,
    String? tag,
  });
  Future<Either<Failure, Talk>> getTalkDetail(int talkId);
}
