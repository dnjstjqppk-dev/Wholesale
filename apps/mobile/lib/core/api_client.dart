import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  static const String baseUrl = 'https://wholesale-api.dnjstjqppk.workers.dev/v1';

  final String? token;
  final http.Client _httpClient;

  ApiClient({this.token, http.Client? client}) : _httpClient = client ?? http.Client();

  Map<String, String> _headers() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<dynamic> get(String endpoint) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final response = await _httpClient.get(uri, headers: _headers());
    return _handleResponse(response);
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final response = await _httpClient.post(
      uri,
      headers: _headers(),
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      throw ApiException(
        statusCode: response.statusCode,
        message: 'API Error: ${response.statusCode} ${response.reasonPhrase}',
      );
    }
  }

  void close() {
    _httpClient.close();
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException({required this.statusCode, required this.message});

  @override
  String toString() => 'ApiException($statusCode): $message';
}
