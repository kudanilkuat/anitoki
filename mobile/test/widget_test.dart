import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:anitoki_mobile/main.dart';
import 'package:anitoki_mobile/services/storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await StorageService.init();
  });

  testWidgets('AnitokiApp smoke test - renders main navigation tabs', (WidgetTester tester) async {
    await tester.pumpWidget(const AnitokiApp());
    await tester.pump();

    // Verify main navigation labels are present
    expect(find.text('Beranda'), findsOneWidget);
    expect(find.text('Jelajah'), findsOneWidget);
    expect(find.text('Favorit'), findsOneWidget);
    expect(find.text('Akun'), findsOneWidget);
  });
}
