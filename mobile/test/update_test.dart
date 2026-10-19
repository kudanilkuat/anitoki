import 'package:flutter_test/flutter_test.dart';
import 'package:anitoki_mobile/models/app_version_model.dart';
import 'package:anitoki_mobile/services/update_service.dart';

void main() {
  group('AppVersionModel & UpdateService Tests', () {
    test('AppVersionModel parses JSON successfully', () {
      final json = {
        'latestVersion': '1.2.0',
        'latestBuildNumber': 3,
        'forceUpdate': true,
        'updateUrl': 'https://anitoki.id/download/anitoki-v1.2.0.apk',
        'message': 'Pembaruan besar!',
        'title': 'Versi Baru 🎉',
        'whatsNew': ['Fitur A', 'Fitur B'],
      };

      final model = AppVersionModel.fromJson(json);

      expect(model.latestVersion, '1.2.0');
      expect(model.latestBuildNumber, 3);
      expect(model.forceUpdate, true);
      expect(model.updateUrl, 'https://anitoki.id/download/anitoki-v1.2.0.apk');
      expect(model.message, 'Pembaruan besar!');
      expect(model.title, 'Versi Baru 🎉');
      expect(model.whatsNew.length, 2);
      expect(model.whatsNew.first, 'Fitur A');
    });

    test('isRemoteVersionNewer compares semantic versions correctly', () {
      expect(UpdateService.isRemoteVersionNewer('1.0.1', '1.0.0'), true);
      expect(UpdateService.isRemoteVersionNewer('1.1.0', '1.0.9'), true);
      expect(UpdateService.isRemoteVersionNewer('2.0.0', '1.9.9'), true);
      expect(UpdateService.isRemoteVersionNewer('1.0.0', '1.0.0'), false);
      expect(UpdateService.isRemoteVersionNewer('0.9.9', '1.0.0'), false);
    });

    test('checkIsUpdateAvailable detects higher build number or version', () {
      final newerBuild = AppVersionModel(
        latestVersion: '1.0.0',
        latestBuildNumber: 2,
        updateUrl: 'https://anitoki.id',
        message: 'Update',
      );
      expect(UpdateService.checkIsUpdateAvailable(newerBuild), true);

      final sameVersionAndBuild = AppVersionModel(
        latestVersion: '1.0.0',
        latestBuildNumber: 1,
        updateUrl: 'https://anitoki.id',
        message: 'Current',
      );
      expect(UpdateService.checkIsUpdateAvailable(sameVersionAndBuild), false);

      final newerVersion = AppVersionModel(
        latestVersion: '1.0.5',
        latestBuildNumber: 1,
        updateUrl: 'https://anitoki.id',
        message: 'Newer semantic version',
      );
      expect(UpdateService.checkIsUpdateAvailable(newerVersion), true);
    });
  });
}
