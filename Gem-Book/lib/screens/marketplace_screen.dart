import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_layout.dart';
import '../theme/app_text.dart';
import '../widgets/listing_card.dart';
import '../widgets/responsive_grid.dart';
import '../widgets/ui.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  static const categories = ['All Gems', 'Sapphires', 'Rubies', 'Spinels', 'Emeralds', 'Padparadscha'];
  static const terms = {
    'Sapphires': 'sapphire',
    'Rubies': 'ruby',
    'Spinels': 'spinel',
    'Emeralds': 'emerald',
    'Padparadscha': 'padparadscha',
  };

  List<GemListing> listings = [];
  bool loading = true;
  bool loadingMore = false;
  bool hasMore = true;
  String? error;
  int offset = 0;
  String query = '';
  String category = 'All Gems';
  String sortBy = 'newest';
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
      final rows = await context.read<ApiClient>().listListings(pageSize, off);
      if (!mounted) return;
      setState(() {
        offset = off + rows.length;
        hasMore = rows.length == pageSize;
        listings = append ? [...listings, ...rows] : rows;
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

  List<GemListing> get visible {
    var result = listings;
    if (category != 'All Gems') {
      final term = terms[category]!;
      result = result.where((l) => l.title.toLowerCase().contains(term)).toList();
    }
    if (query.trim().isNotEmpty) {
      final q = query.toLowerCase();
      result = result.where((l) => l.title.toLowerCase().contains(q)).toList();
    }
    if (sortBy == 'price-asc') {
      result = [...result]..sort((a, b) => a.price.compareTo(b.price));
    } else if (sortBy == 'price-desc') {
      result = [...result]..sort((a, b) => b.price.compareTo(a.price));
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final items = visible;
    final layout = AppLayout.of(context);
    final pad = layout.pagePadding;
    final cols = layout.gridColumns;

    final searchField = TextField(
      onChanged: (v) => setState(() => query = v),
      style: AppText.body(),
      decoration: InputDecoration(
        hintText: 'Search gems...',
        prefixIcon: const Icon(Icons.search, size: 18, color: AppColors.gray400),
        prefixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 40),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade100)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade100)),
      ),
    );

    final listButton = FilledButton.icon(
      onPressed: () => context.go('/add-listing'),
      icon: const Icon(Icons.add, size: 18),
      label: Text('List Gem', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13)),
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.primary,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );

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
                    Text('Gem Marketplace', style: AppText.pageTitle()),
                    Text("Discover verified gems from Sri Lanka's top dealers.", style: AppText.pageSubtitle()),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              SizedBox(width: 280, child: searchField),
              const SizedBox(width: 10),
              listButton,
            ],
          )
        else ...[
          Text('Gem Marketplace', style: AppText.pageTitle()),
          Text("Discover verified gems from Sri Lanka's top dealers.", style: AppText.pageSubtitle()),
          const SizedBox(height: 12),
          searchField,
          const SizedBox(height: 10),
          SizedBox(width: double.infinity, child: listButton),
        ],
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 36,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: categories.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    final cat = categories[i];
                    final active = cat == category;
                    return GestureDetector(
                      onTap: () => setState(() => category = cat),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: active ? AppColors.slate900 : Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: active ? null : Border.all(color: AppColors.gray100),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          cat.toUpperCase(),
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: active ? Colors.white : AppColors.gray400,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(width: 10),
            ConstrainedBox(
              constraints: BoxConstraints(maxWidth: cols >= 2 ? 200 : 160),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade100),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: sortBy,
                    isExpanded: true,
                    style: AppText.caption(color: AppColors.slate800, weight: FontWeight.w600),
                    items: const [
                      DropdownMenuItem(value: 'newest', child: Text('Newest Arrivals')),
                      DropdownMenuItem(value: 'price-asc', child: Text('Price: Low to High')),
                      DropdownMenuItem(value: 'price-desc', child: Text('Price: High to Low')),
                    ],
                    onChanged: (v) => setState(() => sortBy = v ?? 'newest'),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        if (error != null) ErrorBanner(error!),
        if (loading)
          ResponsiveGrid(
            columns: cols,
            children: List.generate(cols * 2, (_) => const PulseBox(height: 280, radius: 16)),
          )
        else if (items.isEmpty)
          EmptyState(
            icon: Icons.inventory_2_outlined,
            title: listings.isEmpty ? 'No gems listed yet' : 'No gems match your search',
            subtitle: listings.isEmpty ? 'Be the first to list a gem on the marketplace.' : 'Try a different search or category.',
            action: listings.isEmpty
                ? FilledButton(
                    onPressed: () => context.go('/add-listing'),
                    style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                    child: const Text('List a Gem'),
                  )
                : null,
          )
        else
          ResponsiveGrid(
            columns: cols,
            children: items.map((l) => ListingCard(listing: l)).toList(),
          ),
        if (!loading && hasMore && items.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: LoadMoreButton(label: 'Load More Listings', loading: loadingMore, onPressed: () => _load(true)),
          ),
      ],
    );
  }
}
