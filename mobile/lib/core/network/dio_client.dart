import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../error/exceptions.dart';
import '../storage/local_storage_service.dart';
import 'api_interceptor.dart';

class DioClient {
  late final Dio _dio;
  final LocalStorageService? localStorageService;

  DioClient({this.localStorageService, String? customBaseUrl}) {
    final activeBaseUrl = customBaseUrl ??
        localStorageService?.customApiUrl ??
        ApiConstants.defaultBaseUrl;

    final baseOptions = BaseOptions(
      baseUrl: ApiConstants.sanitizeUrl(activeBaseUrl),
      connectTimeout: ApiConstants.connectTimeout,
      receiveTimeout: ApiConstants.receiveTimeout,
      sendTimeout: ApiConstants.sendTimeout,
      responseType: ResponseType.json,
    );

    _dio = Dio(baseOptions);
    _dio.interceptors.add(ApiInterceptor());
  }

  Dio get dio => _dio;

  String get currentBaseUrl => _dio.options.baseUrl;

  void setBaseUrl(String newBaseUrl) {
    final sanitized = ApiConstants.sanitizeUrl(newBaseUrl);
    _dio.options.baseUrl = sanitized;
    localStorageService?.setCustomApiUrl(sanitized);
  }

  /// Pings the backend /api/health endpoint to confirm connectivity
  Future<bool> checkHealth([String? testBaseUrl]) async {
    try {
      final targetDio = testBaseUrl != null
          ? Dio(BaseOptions(
              baseUrl: ApiConstants.sanitizeUrl(testBaseUrl),
              connectTimeout: const Duration(seconds: 3),
              receiveTimeout: const Duration(seconds: 3),
            ))
          : _dio;

      final res = await targetDio.get(ApiConstants.health);
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

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
          message: 'Таймаут соединения с сервером конференции. Проверьте сеть.',
        );
      case DioExceptionType.connectionError:
        return NetworkException(
          message: 'Не удалось подключиться к серверу (${_dio.options.baseUrl}).',
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
