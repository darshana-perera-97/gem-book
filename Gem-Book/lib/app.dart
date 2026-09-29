import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../auth/auth_controller.dart';
import '../cache/vendor_cache.dart';
import '../screens/add_listing_screen.dart';
import '../screens/chat_screen.dart';
import '../screens/community_screen.dart';
import '../screens/dealer_profile_screen.dart';
import '../screens/feed_screen.dart';
import '../screens/login_screen.dart';
import '../screens/marketplace_screen.dart';
import '../screens/placeholder_screen.dart';
import '../screens/product_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/vendors_screen.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';

class GemBookApp extends StatefulWidget {
  const GemBookApp({super.key});

  @override
  State<GemBookApp> createState() => _GemBookAppState();
}

class _GemBookAppState extends State<GemBookApp> {
  late final ApiClient _api;
  late final AuthController _auth;
  late final VendorCache _vendors;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _api = ApiClient();
    _auth = AuthController(_api);
    _vendors = VendorCache(_api);
    _auth.restore();
    _router = _buildRouter();
  }

  GoRouter _buildRouter() {
    return GoRouter(
      initialLocation: '/',
      routes: [
        ShellRoute(
          builder: (context, state, child) => AppScaffold(child: child),
          routes: [
            GoRoute(path: '/', builder: (_, _) => const FeedScreen()),
            GoRoute(path: '/marketplace', builder: (_, _) => const MarketplaceScreen()),
            GoRoute(path: '/vendors', builder: (_, _) => const VendorsScreen()),
            GoRoute(path: '/community', builder: (_, _) => const CommunityScreen()),
            GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
            GoRoute(path: '/add-listing', builder: (_, _) => const AddListingScreen()),
            GoRoute(
              path: '/messages',
              builder: (context, state) => ChatScreen(conversationId: state.uri.queryParameters['c']),
            ),
            GoRoute(
              path: '/login',
              builder: (context, state) => LoginScreen(
                nextPath: state.uri.queryParameters['next'] ?? '/',
                initialMode: state.uri.queryParameters['mode'] ?? 'create',
              ),
            ),
            GoRoute(
              path: '/listings/:id',
              builder: (context, state) => ProductScreen(id: state.pathParameters['id']!),
            ),
            GoRoute(
              path: '/dealers/:id',
              builder: (context, state) => DealerProfileScreen(id: state.pathParameters['id']!),
            ),
            GoRoute(
              path: '/news',
              builder: (_, _) => const PlaceholderScreen(title: 'Industry News Portal'),
            ),
            GoRoute(
              path: '/events',
              builder: (_, _) => const PlaceholderScreen(title: 'Global Events Module'),
            ),
          ],
        ),
      ],
    );
  }

  @override
  void dispose() {
    _auth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider.value(value: _api),
        ChangeNotifierProvider.value(value: _auth),
        ChangeNotifierProvider.value(value: _vendors),
      ],
      child: Consumer<AuthController>(
        builder: (context, auth, _) {
          return MaterialApp.router(
            title: 'GemBook',
            debugShowCheckedModeBanner: false,
            theme: buildAppTheme(),
            routerConfig: _router,
            builder: (context, child) {
              if (auth.loading) {
                return const Scaffold(
                  backgroundColor: Color(0xFFF5F7FA),
                  body: Center(child: CircularProgressIndicator(color: Color(0xFFCC10FE))),
                );
              }
              return child ?? const SizedBox.shrink();
            },
          );
        },
      ),
    );
  }
}
