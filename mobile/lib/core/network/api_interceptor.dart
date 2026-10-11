import 'dart:developer' as developer;
import 'package:dio/dio.dart';

class ApiInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Visitor/Guest application headers
    options.headers['Accept'] = 'application/json';
    options.headers['Content-Type'] = 'application/json';
    options.headers['X-Client-Role'] = 'guest';

    developer.log(
      '[DIO REQUEST] ${options.method} ${options.uri}',
      name: 'Network',
    );

    return handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    developer.log(
      '[DIO RESPONSE] ${response.statusCode} ${response.requestOptions.uri}',
      name: 'Network',
    );
    return handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    developer.log(
      '[DIO ERROR] ${err.response?.statusCode} ${err.requestOptions.uri}: ${err.message}',
      name: 'Network',
      error: err.error,
    );
    return handler.next(err);
  }
}
