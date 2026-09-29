import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../theme/app_colors.dart';

class RemoteImage extends StatelessWidget {
  const RemoteImage({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
  });

  final String? url;
  final BoxFit fit;
  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    final resolved = api.media(url);
    if (resolved.isEmpty) {
      return ColoredBox(color: AppColors.slate100, child: SizedBox(width: width, height: height));
    }
    return CachedNetworkImage(
      imageUrl: resolved,
      fit: fit,
      width: width,
      height: height,
      placeholder: (_, _) => ColoredBox(color: AppColors.slate100, child: SizedBox(width: width, height: height)),
      errorWidget: (_, _, _) => ColoredBox(
        color: AppColors.slate100,
        child: SizedBox(
          width: width,
          height: height,
          child: const Icon(Icons.image_outlined, color: AppColors.slate400),
        ),
      ),
    );
  }
}
