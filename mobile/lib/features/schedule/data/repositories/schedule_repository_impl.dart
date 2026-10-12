import 'package:fpdart/fpdart.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/conference.dart';
import '../../domain/entities/section.dart';
import '../../domain/entities/room.dart';
import '../../domain/entities/talk.dart';
import '../../domain/repositories/schedule_repository.dart';
import '../datasources/schedule_remote_datasource.dart';

class ScheduleRepositoryImpl implements ScheduleRepository {
  final ScheduleRemoteDataSource remoteDataSource;

  ScheduleRepositoryImpl({required this.remoteDataSource});

  @override
  bool get isBackendConnected => remoteDataSource.isBackendConnected;

  @override
  Future<Either<Failure, Conference>> getCurrentConference() async {
    try {
      final model = await remoteDataSource.getCurrentConference();
      return Right(model);
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message, statusCode: e.statusCode));
    } catch (e) {
      return Left(ServerFailure('Не удалось загрузить конференцию: $e'));
    }
  }

  @override
  Future<Either<Failure, List<Section>>> getSections({int? conferenceId}) async {
    try {
      final list = await remoteDataSource.getSections(conferenceId: conferenceId);
      return Right(list);
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message, statusCode: e.statusCode));
    } catch (e) {
      return Left(ServerFailure('Не удалось загрузить секции: $e'));
    }
  }

  @override
  Future<Either<Failure, List<Room>>> getRooms({int? conferenceId}) async {
    try {
      final list = await remoteDataSource.getRooms(conferenceId: conferenceId);
      return Right(list);
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message, statusCode: e.statusCode));
    } catch (e) {
      return Left(ServerFailure('Не удалось загрузить аудитории: $e'));
    }
  }

  @override
  Future<Either<Failure, List<Talk>>> getConferenceTalks({
    required int conferenceId,
    int? sectionId,
    String? query,
    String? tag,
  }) async {
    try {
      final list = await remoteDataSource.getConferenceTalks(
        conferenceId: conferenceId,
        sectionId: sectionId,
        query: query,
        tag: tag,
      );
      return Right(list);
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message, statusCode: e.statusCode));
    } catch (e) {
      return Left(ServerFailure('Не удалось загрузить доклады: $e'));
    }
  }

  @override
  Future<Either<Failure, Talk>> getTalkDetail(int talkId) async {
    try {
      final talk = await remoteDataSource.getTalkDetail(talkId);
      return Right(talk);
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message, statusCode: e.statusCode));
    } catch (e) {
      return Left(ServerFailure('Не удалось загрузить детали доклада: $e'));
    }
  }
}
