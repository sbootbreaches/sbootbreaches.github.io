#!/usr/bin/env python3
"""
Flag Analyzer for SecureBoot Data
Reads db.json and visualizes flag percentages
"""

import json
import matplotlib.pyplot as plt
import numpy as np
from collections import Counter
import argparse

# Flag bit definitions based on ui.js
FLAG_BITS = {
    0: "SecureBoot Enabled",
    1: "WIN_PCA_2011_CERT in DB", 
    2: "WIN_PCA_2011_CERT in DBX",
    3: "WIN_PCA_2023_CERT in DB"
}

# Labels for each bit (for pie charts)
BIT_LABELS = {
    0: ["Enabled", "Disabled"],
    1: ["In DB", "Not in DB"],
    2: ["In DBX", "Not in DBX"], 
    3: ["In DB", "Not in DB"]
}

def parse_flag(flag_value):
    """Parse flag value into individual bit components"""
    bits = {}
    for bit_pos, description in FLAG_BITS.items():
        bits[bit_pos] = bool(flag_value & (1 << bit_pos))
    return bits

def analyze_flags(data_file):
    """Analyze flag data from JSON file"""
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    entries = data.get('entries', [])
    print(f"Total entries: {len(entries)}")
    
    # Collect flag statistics
    flag_counts = Counter()
    bit_stats = {bit: {'enabled': 0, 'disabled': 0} for bit in FLAG_BITS.keys()}
    
    for entry in entries:
        flag = entry.get('flag', 0)
        flag_counts[flag] += 1
        
        # Parse individual bits
        bits = parse_flag(flag)
        for bit_pos, is_set in bits.items():
            if is_set:
                bit_stats[bit_pos]['enabled'] += 1
            else:
                bit_stats[bit_pos]['disabled'] += 1
    
    return flag_counts, bit_stats, len(entries)

def create_visualizations(flag_counts, bit_stats, total_entries):
    """Create matplotlib visualizations - 4 individual pie charts for each bit"""
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    fig.suptitle('SecureBoot Flag Analysis - Individual Bit Statistics', fontsize=16, fontweight='bold')
    
    # Flatten axes for easier iteration
    axes = axes.flatten()
    
    # Create pie chart for each bit
    for i, (bit_pos, description) in enumerate(FLAG_BITS.items()):
        enabled = bit_stats[bit_pos]['enabled']
        disabled = bit_stats[bit_pos]['disabled']
        
        # Calculate percentages
        enabled_pct = (enabled / total_entries) * 100 if total_entries > 0 else 0
        disabled_pct = (disabled / total_entries) * 100 if total_entries > 0 else 0
        
        # Create pie chart
        labels = BIT_LABELS[bit_pos]
        sizes = [enabled, disabled]
        colors = ['lightgreen', 'lightcoral']
        
        # Add percentage to labels
        labels_with_pct = [f'{labels[0]}\n({enabled_pct:.1f}%)', f'{labels[1]}\n({disabled_pct:.1f}%)']
        
        wedges, texts, autotexts = axes[i].pie(sizes, labels=labels_with_pct, colors=colors, 
                                              autopct='%1.1f%%', startangle=90)
        
        # Set title
        axes[i].set_title(f'{description}\n({enabled} {labels[0].lower()}, {disabled} {labels[1].lower()})', 
                         fontsize=12, fontweight='bold')
        
        # Make text more readable
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontweight('bold')
            autotext.set_fontsize(10)
        
        for text in texts:
            text.set_fontsize(10)
    
    plt.tight_layout()
    return fig

def print_statistics(flag_counts, bit_stats, total_entries):
    """Print detailed statistics to console"""
    print("\n" + "="*60)
    print("SECUREBOOT FLAG ANALYSIS")
    print("="*60)
    
    print(f"\nTotal entries analyzed: {total_entries}")
    
    print("\nFlag Value Distribution:")
    print("-" * 30)
    for flag_value, count in sorted(flag_counts.items()):
        percentage = (count / total_entries) * 100
        bits = parse_flag(flag_value)
        bit_description = []
        for bit_pos, is_set in bits.items():
            if is_set:
                bit_description.append(FLAG_BITS[bit_pos])
        
        print(f"Flag {flag_value:2d}: {count:3d} entries ({percentage:5.1f}%) - {', '.join(bit_description) if bit_description else 'All disabled'}")
    
    print("\nIndividual Bit Statistics:")
    print("-" * 30)
    for bit_pos, description in FLAG_BITS.items():
        enabled = bit_stats[bit_pos]['enabled']
        disabled = bit_stats[bit_pos]['disabled']
        enabled_pct = (enabled / total_entries) * 100
        disabled_pct = (disabled / total_entries) * 100
        
        # Use appropriate labels based on bit type
        if bit_pos == 0:
            # SecureBoot - use Enabled/Disabled
            enabled_label = "Enabled"
            disabled_label = "Disabled"
        else:
            # Certificate flags - use In DB/Not in DB or In DBX/Not in DBX
            if bit_pos == 2:  # DBX flag
                enabled_label = "In DBX"
                disabled_label = "Not in DBX"
            else:  # DB flags
                enabled_label = "In DB"
                disabled_label = "Not in DB"
        
        print(f"{description:25s}: {enabled_label}: {enabled:3d} ({enabled_pct:5.1f}%) | {disabled_label}: {disabled:3d} ({disabled_pct:5.1f}%)")
    
    print("\nSecurity Analysis:")
    print("-" * 30)
    
    # SecureBoot status
    secureboot_enabled = bit_stats[0]['enabled']
    secureboot_disabled = bit_stats[0]['disabled']
    secureboot_pct = (secureboot_enabled / total_entries) * 100
    
    print(f"SecureBoot Enabled: {secureboot_enabled} ({secureboot_pct:.1f}%)")
    print(f"SecureBoot Disabled: {secureboot_disabled} ({(100-secureboot_pct):.1f}%)")
    
    if secureboot_pct < 50:
        print("⚠️  WARNING: Less than 50% of systems have SecureBoot enabled!")
    else:
        print("✅ Good: Majority of systems have SecureBoot enabled")
    
    # Certificate analysis
    pca_2011_in_db = bit_stats[1]['enabled']
    pca_2011_in_dbx = bit_stats[2]['enabled']
    pca_2023_in_db = bit_stats[3]['enabled']
    
    print(f"\nCertificate Analysis:")
    print(f"WIN_PCA_2011_CERT in DB: {pca_2011_in_db} ({(pca_2011_in_db/total_entries)*100:.1f}%)")
    print(f"WIN_PCA_2011_CERT in DBX: {pca_2011_in_dbx} ({(pca_2011_in_dbx/total_entries)*100:.1f}%)")
    print(f"WIN_PCA_2023_CERT in DB: {pca_2023_in_db} ({(pca_2023_in_db/total_entries)*100:.1f}%)")

def main():
    parser = argparse.ArgumentParser(description='Analyze SecureBoot flag data from db.json')
    parser.add_argument('--input', '-i', default='db.json', help='Input JSON file (default: db.json)')
    parser.add_argument('--output', '-o', default='flag_analysis.png', help='Output image file (default: flag_analysis.png)')
    parser.add_argument('--no-plot', action='store_true', help='Skip generating plot')
    
    args = parser.parse_args()
    
    try:
        # Analyze the data
        flag_counts, bit_stats, total_entries = analyze_flags(args.input)
        
        # Print statistics
        print_statistics(flag_counts, bit_stats, total_entries)
        
        # Create visualizations
        if not args.no_plot:
            fig = create_visualizations(flag_counts, bit_stats, total_entries)
            fig.savefig(args.output, dpi=300, bbox_inches='tight')
            print(f"\n📊 Visualization saved as: {args.output}")
            
            # Also save as SVG for better quality
            svg_output = args.output.replace('.png', '.svg')
            fig.savefig(svg_output, format='svg', bbox_inches='tight')
            print(f"📊 SVG version saved as: {svg_output}")
        
    except FileNotFoundError:
        print(f"❌ Error: File '{args.input}' not found!")
        print("Make sure db.json exists in the current directory.")
    except json.JSONDecodeError:
        print(f"❌ Error: Invalid JSON in '{args.input}'!")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main() 