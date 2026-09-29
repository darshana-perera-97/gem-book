import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../cache/vendor_cache.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_layout.dart';
import '../theme/app_text.dart';
import '../widgets/responsive_grid.dart';
import '../widgets/ui.dart';
import '../widgets/vendor_card.dart';

class VendorsScreen extends StatefulWidget {
  const VendorsScreen({super.key});

  @override
  State<VendorsScreen> createState() => _VendorsScreenState();
}

class _VendorsScreenState extends State<VendorsScreen> {
  List<VendorProfile> vendors = [];
  bool loading = true;
  bool loadingMore = false;
  bool hasMore = true;
  String? error;
  String query = '';
  int offset = 0;
  static const pageSize = 12;

  @override
  void initState() {
    super.initState();
    _load(false);
  }

  Future<void> _load(bool append) async {
    setState(() {
      if (append) {
        loadingMore = true;
      } else {
        loading = true;
        error = null;
      }
    });
    try {
      final off = append ? offset : 0;
      final rows = await context.read<ApiClient>().listVendors(pageSize, off);
      if (!mounted) return;
      context.read<VendorCache>().prime(rows);
      setState(() {
        offset = off + rows.length;
        hasMore = rows.length == pageSize;
        vendors = append ? [...vendors, ...rows] : rows;
        loading = false;
        loadingMore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        error = 'Could not load content. Please check your connection.';
        loading = false;
        loadingMore = false;
        hasMore = false;
      });
    }
  }

  List<VendorProfile> get filtered {
    if (query.trim().isEmpty) return vendors;
    final q = query.toLowerCase();
    return vendors.where((v) => v.companyName.toLowerCase().contains(q) || v.location.toLowerCase().contains(q)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final items = filtered;
    final layout = AppLayout.of(context);
    final pad = layout.pagePadding;
    final cols = layout.gridColumns;
    return ListView(
      padding: EdgeInsets.fromLTRB(pad, pad, pad, 24),
      children: [
        if (cols >= 2)
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Verified Dealers', style: AppText.pageTitle()),
                    Text("Direct access to Sri Lanka's leading gemstone dealers, miners, and lapidaries.", style: AppText.pageSubtitle()),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              SizedBox(
                width: 320,
                child: TextField(
                  onChanged: (v) => setState(() => query = v),
                  style: AppText.body(),
                  decoration: InputDecoration(
                    hintText: 'Search by company or location...',
                    prefixIcon: const Icon(Icons.search, size: 18, color: AppColors.slate400),
                    prefixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.slate200)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.slate200)),
                  ),
                ),
              ),
            ],
          )
        else ...[
          Text('Verified Dealers', style: AppText.pageTitle()),
          Text("Direct access to Sri Lanka's leading gemstone dealers, miners, and lapidaries.", style: AppText.pageSubtitle()),
          const SizedBox(height: 14),
          TextField(
            onChanged: (v) => setState(() => query = v),
            style: AppText.body(),
            decoration: InputDecoration(
              hintText: 'Search by company or location...',
              prefixIcon: const Icon(Icons.search, size: 18, color: AppColors.slate400),
              prefixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 40),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.slate200)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.slate200)),
            ),
          ),
        ],
        const SizedBox(height: 16),
        if (error != null) ErrorBanner(error!),
        if (loading)
          ResponsiveGrid(
            columns: cols,
            children: List.generate(cols * 2, (_) => const PulseBox(height: 240, radius: 16)),
          )
        else if (items.isEmpty)
          EmptyState(
            icon: Icons.storefront_outlined,
            title: vendors.isEmpty ? 'No dealers registered yet' : 'No dealers match your search',
            subtitle: vendors.isEmpty ? 'Verified dealers will appear here once they join.' : 'Try a different company name or location.',
          )
        else
          ResponsiveGrid(
            columns: cols,
            children: items
                .map((v) => VendorCard(vendor: v, onTap: () => context.push('/dealers/${v.id}')))
                .toList(),
          ),
        if (!loading && hasMore && items.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: LoadMoreButton(label: 'Load More Dealers', loading: loadingMore, onPressed: () => _load(true)),
          ),
      ],
    );
  }
}
