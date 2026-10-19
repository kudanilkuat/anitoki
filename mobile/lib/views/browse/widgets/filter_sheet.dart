import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../providers/browse_provider.dart';

class FilterSheet extends StatefulWidget {
  const FilterSheet({super.key});

  @override
  State<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  late String _status;
  late String _type;
  late String _order;
  String? _genre;

  @override
  void initState() {
    super.initState();
    final browse = context.read<BrowseProvider>();
    _status = browse.selectedStatus;
    _type = browse.selectedType;
    _order = browse.selectedOrder;
    _genre = browse.selectedGenre;
  }

  @override
  Widget build(BuildContext context) {
    final browse = context.watch<BrowseProvider>();

    return Container(
      padding: const EdgeInsets.only(top: 16, left: 20, right: 20, bottom: 30),
      decoration: const BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.borderSubtle,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filter & Urutkan',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    _status = 'all';
                    _type = 'all';
                    _order = 'latest';
                    _genre = null;
                  });
                },
                child: const Text(
                  'Reset',
                  style: TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),

          const Divider(color: AppColors.borderSubtle, height: 20),

          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status Filter
                  _buildSectionTitle('Status Anime'),
                  Wrap(
                    spacing: 8,
                    children: [
                      _buildChoiceChip('Semua', 'all', _status, (val) => setState(() => _status = val ?? 'all')),
                      _buildChoiceChip('Ongoing', 'ongoing', _status, (val) => setState(() => _status = val ?? 'all')),
                      _buildChoiceChip('Completed', 'completed', _status, (val) => setState(() => _status = val ?? 'all')),
                    ],
                  ),

                  const SizedBox(height: 18),

                  // Type Filter
                  _buildSectionTitle('Tipe'),
                  Wrap(
                    spacing: 8,
                    children: [
                      _buildChoiceChip('Semua', 'all', _type, (val) => setState(() => _type = val ?? 'all')),
                      _buildChoiceChip('TV', 'TV', _type, (val) => setState(() => _type = val ?? 'all')),
                      _buildChoiceChip('Movie', 'Movie', _type, (val) => setState(() => _type = val ?? 'all')),
                      _buildChoiceChip('OVA', 'OVA', _type, (val) => setState(() => _type = val ?? 'all')),
                      _buildChoiceChip('BD', 'BD', _type, (val) => setState(() => _type = val ?? 'all')),
                    ],
                  ),

                  const SizedBox(height: 18),

                  // Order Filter
                  _buildSectionTitle('Urutkan Berdasarkan'),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildChoiceChip('Terbaru Update', 'latest', _order, (val) => setState(() => _order = val ?? 'latest')),
                      _buildChoiceChip('Paling Populer', 'popular', _order, (val) => setState(() => _order = val ?? 'latest')),
                      _buildChoiceChip('Abjad A-Z', 'az', _order, (val) => setState(() => _order = val ?? 'latest')),
                      _buildChoiceChip('Abjad Z-A', 'za', _order, (val) => setState(() => _order = val ?? 'latest')),
                    ],
                  ),

                  const SizedBox(height: 18),

                  // Genre Filter
                  _buildSectionTitle('Pilih Genre'),
                  if (browse.genres.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8.0),
                      child: Text('Memuat genre...', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildChoiceChip('Semua Genre', null, _genre, (val) => setState(() => _genre = val)),
                        ...browse.genres.map(
                          (g) => _buildChoiceChip(
                            '${g.name} (${g.count})',
                            g.name.toLowerCase().replaceAll(' ', '-'),
                            _genre,
                            (val) => setState(() => _genre = val),
                          ),
                        ),
                      ],
                    ),

                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),

          // Apply Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                browse.setFilter(
                  status: _status,
                  type: _type,
                  order: _order,
                  genre: _genre ?? 'all',
                );
                Navigator.pop(context);
              },
              child: const Text('Terapkan Filter'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        title,
        style: const TextStyle(
          color: AppColors.textSecondary,
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildChoiceChip(String label, String? value, String? selectedValue, Function(String?) onSelected) {
    final isSelected = selectedValue == value;

    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => onSelected(value),
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.surfaceContainer,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppColors.textSecondary,
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(
          color: isSelected ? AppColors.primary : AppColors.borderSubtle,
        ),
      ),
      showCheckmark: false,
    );
  }
}
