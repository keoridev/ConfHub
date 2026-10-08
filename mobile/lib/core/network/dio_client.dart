import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../error/exceptions.dart';
import 'api_interceptor.dart';

class DioClient {
  late final Dio _dio;

  DioClient({String? customBaseUrl}) {
    final baseOptions = BaseOptions(
      baseUrl: customBaseUrl ?? ApiConstants.baseUrl,
      connectTimeout: ApiConstants.connectTimeout,
      receiveTimeout: ApiConstants.receiveTimeout,
      sendTimeout: ApiConstants.sendTimeout,
      responseType: ResponseType.json,
    );

    _dio = Dio(baseOptions);
    _dio.interceptors.add(ApiInterceptor());
  }

  Dio get dio => _dio;

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response;
    } on DioException catch (e) {
      throw _handleDioException(e);
    } catch (e) {
      throw ServerException(message: 'Непредвиденная ошибка: $e');
    }
  }

  Exception _handleDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const NetworkException(
          message: 'Таймаут соединения с сервером конференции. Проверьте интернет.',
        );
      case DioExceptionType.connectionError:
        return const NetworkException(
          message: 'Не удалось подключиться к серверу конференции.',
        );
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final responseData = e.response?.data;
        String message = 'Ошибка сервера ($statusCode)';

        if (responseData is Map<String, dynamic>) {
          if (responseData.containsKey('error')) {
            final err = responseData['error'];
            if (err is Map && err.containsKey('message')) {
              message = err['message'].toString();
            } else if (err is String) {
              message = err;
            }
          } else if (responseData.containsKey('message')) {
            message = responseData['message'].toString();
          }
        }
        return ServerException(message: message, statusCode: statusCode);
      case DioExceptionType.cancel:
        return const NetworkException(message: 'Запрос был отменен');
      default:
        return ServerException(message: e.message ?? 'Ошибка сети');
    }
  }
}
