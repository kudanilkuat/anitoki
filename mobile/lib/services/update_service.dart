import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/constants/api_endpoints.dart';
import '../models/app_version_model.dart';
import '../services/api_service.dart';
import '../widgets/update_dialog.dart';

class UpdateService {
  static final ApiService _apiService = ApiService();
  static bool _hasAutoChecked = false;

  /// Compares semantic versions (e.g. "1.1.0" vs "1.0.0")
  static bool isRemoteVersionNewer(String remoteVersion, String localVersion) {
    try {
      final remoteParts = remoteVersion.split('.').map((e) => int.tryParse(e) ?? 0).toList();
      final localParts = localVersion.split('.').map((e) => int.tryParse(e) ?? 0).toList();

      final maxLength = remoteParts.length > localParts.length ? remoteParts.length : localParts.length;

      for (int i = 0; i < maxLength; i++) {
        final remote = i < remoteParts.length ? remoteParts[i] : 0;
        final local = i < localParts.length ? localParts[i] : 0;

        if (remote > local) return true;
        if (remote < local) return false;
      }
    } catch (_) {}
    return false;
  }

  /// Determines if an update is available based on build number or version string
  static bool checkIsUpdateAvailable(AppVersionModel remote) {
    if (remote.latestBuildNumber > ApiEndpoints.currentAppBuildNumber) {
      return true;
    }
    return isRemoteVersionNewer(remote.latestVersion, ApiEndpoints.currentAppVersion);
  }

  /// Checks for updates.
  /// If [isManual] is true, shows feedback snackbars for loading and up-to-date status.
  /// If [forceCheck] is true, bypasses the session auto-check cache.
  static Future<void> checkUpdate(
    BuildContext context, {
    bool isManual = false,
    bool forceCheck = false,
  }) async {
    if (!isManual && !forceCheck && _hasAutoChecked) {
      return;
    }

    if (!isManual) {
      _hasAutoChecked = true;
    }

    if (isManual) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              ),
              SizedBox(width: 12),
              Text('Memeriksa pembaruan aplikasi...'),
            ],
          ),
          duration: Duration(seconds: 2),
        ),
      );
    }

    try {
      final remoteInfo = await _apiService.getAppVersion();
      if (!context.mounted) return;

      if (remoteInfo == null) {
        if (isManual) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Gagal memeriksa pembaruan. Silakan coba lagi nanti.')),
          );
        }
        return;
      }

      final hasUpdate = checkIsUpdateAvailable(remoteInfo);

      if (hasUpdate) {
        // Show update popup dialog
        showDialog(
          context: context,
          barrierDismissible: !remoteInfo.forceUpdate,
          builder: (dialogCtx) => UpdateDialog(versionInfo: remoteInfo),
        );
      } else if (isManual) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Aplikasi sudah dalam versi terbaru (v${ApiEndpoints.currentAppVersion}).',
            ),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (isManual && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Terjadi kesalahan saat memeriksa update: $e')),
        );
      }
    }
  }

  /// Launches the update download URL
  static Future<void> launchUpdateUrl(BuildContext context, String urlString) async {
    try {
      final uri = Uri.parse(urlString);
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Tidak dapat membuka link download: $urlString')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal membuka URL download: $e')),
        );
      }
    }
  }
}
