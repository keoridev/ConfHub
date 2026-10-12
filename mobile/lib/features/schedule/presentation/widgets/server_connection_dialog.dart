import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/conf_button.dart';
import '../cubit/schedule_cubit.dart';
import '../cubit/schedule_state.dart';

class ServerConnectionDialog extends StatefulWidget {
  const ServerConnectionDialog({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const ServerConnectionDialog(),
    );
  }

  @override
  State<ServerConnectionDialog> createState() => _ServerConnectionDialogState();
}

class _ServerConnectionDialogState extends State<ServerConnectionDialog> {
  late final TextEditingController _urlController;
  bool _isChecking = false;
  bool? _pingSuccess;
  String? _pingMessage;

  @override
  void initState() {
    super.initState();
    final dioClient = sl<DioClient>();
    _urlController = TextEditingController(text: dioClient.currentBaseUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testPing(String url) async {
    setState(() {
      _isChecking = true;
      _pingSuccess = null;
      _pingMessage = null;
    });

    final dioClient = sl<DioClient>();
    final isOk = await dioClient.checkHealth(url);

    if (!mounted) return;
    setState(() {
      _isChecking = false;
      _pingSuccess = isOk;
      _pingMessage = isOk
          ? 'Связь установлена! Backend доступен (/api/health OK).'
          : 'Не удалось подключиться к серверу по этому адресу.';
    });
  }

  void _applyUrl(String url) {
    context.read<ScheduleCubit>().changeServerUrl(url);
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Сервер изменен: $url. Загружаем данные...'),
        backgroundColor: AppColors.primary,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ScheduleCubit, ScheduleState>(
      builder: (context, state) {
        final isOnline = state is ScheduleLoaded ? state.isBackendOnline : false;
        final currentUrl = sl<DioClient>().currentBaseUrl;

        return Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: EdgeInsets.only(
            top: 14,
            left: 20,
            right: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 28,
          ),
          child: SafeArea(
            top: false,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Drag handle
                  Center(
                    child: Container(
                      width: 44,
                      height: 5,
                      decoration: BoxDecoration(
                        color: AppColors.muted,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Header
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isOnline ? AppColors.statusCanMakeItBg : AppColors.statusHurryBg,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          isOnline ? Icons.dns_rounded : Icons.cloud_off_rounded,
                          color: isOnline ? AppColors.statusCanMakeIt : AppColors.statusHurry,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Подключение к Backend',
                              style: AppTypography.titleLarge,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isOnline ? 'Онлайн (реальные данные из БД)' : 'Демо-режим (офлайн заглушка)',
                              style: AppTypography.bodySmall.copyWith(
                                color: isOnline ? AppColors.statusCanMakeIt : AppColors.statusHurry,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, color: AppColors.textMuted),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Current URL & explanation
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Активный адрес сервера:', style: AppTypography.labelSmall),
                        const SizedBox(height: 4),
                        Text(
                          currentUrl,
                          style: AppTypography.monoTime.copyWith(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Quick presets
                  Text('Быстрый выбор адреса:', style: AppTypography.titleSmall),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildPresetChip('Локальный (127.0.0.1:8080)', ApiConstants.defaultLocalhostUrl),
                      _buildPresetChip('Эмулятор (10.0.2.2:8080)', ApiConstants.defaultEmulatorUrl),
                      _buildPresetChip('Wi-Fi LAN (192.168.68.101:8080)', ApiConstants.defaultLanUrl),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Custom URL input
                  Text('Или введите свой адрес:', style: AppTypography.titleSmall),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _urlController,
                    decoration: InputDecoration(
                      hintText: 'http://192.168.x.x:8080',
                      prefixIcon: const Icon(Icons.link_rounded, size: 20),
                      suffixIcon: IconButton(
                        icon: _isChecking
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.wifi_find_rounded, color: AppColors.primary),
                        tooltip: 'Проверить связь (/api/health)',
                        onPressed: _isChecking ? null : () => _testPing(_urlController.text),
                      ),
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                    ),
                  ),
                  if (_pingMessage != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: _pingSuccess == true ? AppColors.statusCanMakeItBg : AppColors.statusMissedBg,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _pingSuccess == true ? Icons.check_circle_rounded : Icons.error_outline_rounded,
                            size: 16,
                            color: _pingSuccess == true ? AppColors.statusCanMakeIt : AppColors.statusMissed,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _pingMessage!,
                              style: AppTypography.bodySmall.copyWith(
                                color: _pingSuccess == true ? AppColors.statusCanMakeIt : AppColors.statusMissed,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),

                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: ConfButton(
                          text: 'Проверить',
                          variant: ConfButtonVariant.outline,
                          icon: Icons.network_check_rounded,
                          onPressed: () => _testPing(_urlController.text),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ConfButton(
                          text: 'Подключиться',
                          icon: Icons.sync_rounded,
                          onPressed: () => _applyUrl(_urlController.text),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildPresetChip(String label, String url) {
    final isSelected = _urlController.text.trim() == url.trim();
    return ActionChip(
      avatar: Icon(
        isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
        size: 16,
        color: isSelected ? AppColors.primary : AppColors.textMuted,
      ),
      label: Text(label),
      backgroundColor: isSelected ? AppColors.secondaryLight : AppColors.surfaceSubtle,
      side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
      onPressed: () {
        setState(() {
          _urlController.text = url;
          _pingSuccess = null;
          _pingMessage = null;
        });
        _testPing(url);
      },
    );
  }
}
