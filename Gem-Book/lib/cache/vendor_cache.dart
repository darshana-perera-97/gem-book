import 'package:flutter/foundation.dart';

import '../models/models.dart';
import '../api/api_client.dart';

class VendorCache extends ChangeNotifier {
  VendorCache(this.api);

  final ApiClient api;
  final Map<String, VendorProfile?> _cache = {};
  final Map<String, Future<VendorProfile?>> _inFlight = {};
  final Set<String> _pending = {};
  Future<void>? _flush;

  VendorProfile? getCached(String id) => _cache[id];

  void prime(Iterable<VendorProfile> vendors) {
    var changed = false;
    for (final v in vendors) {
      if (_cache[v.id]?.id != v.id) changed = true;
      _cache[v.id] = v;
    }
    if (changed) notifyListeners();
  }

  Future<VendorProfile?> fetch(String id) {
    if (_cache.containsKey(id)) return Future.value(_cache[id]);
    final existing = _inFlight[id];
    if (existing != null) return existing;

    _pending.add(id);
    _flush ??= Future.microtask(_doFlush);

    final promise = _flush!.then((_) {
      _inFlight.remove(id);
      return _cache[id];
    });
    _inFlight[id] = promise;
    return promise;
  }

  Future<void> _doFlush() async {
    final ids = _pending.toList();
    _pending.clear();
    _flush = null;
    try {
      final rows = await api.getVendorsByIds(ids);
      final found = <String>{};
      for (final v in rows) {
        found.add(v.id);
        _cache[v.id] = v;
      }
      for (final id in ids) {
        if (!found.contains(id)) _cache[id] = null;
      }
    } catch (_) {
      for (final id in ids) {
        _cache[id] = null;
      }
    }
    notifyListeners();
  }
}
