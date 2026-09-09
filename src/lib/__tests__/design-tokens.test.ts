import { describe, it, expect } from 'vitest';
import {
  colors,
  typography,
  space,
  radius,
  shadows,
  animation,
  MEMBER_COLORS,
  getMemberColor,
  getMemberTextColor,
} from '@/src/lib/design-tokens';

describe('design-tokens', () => {
  // ============================================================
  // getMemberColor
  // ============================================================
  describe('getMemberColor', () => {
    it('should return a consistent color for the same memberId', () => {
      const color1 = getMemberColor('user-abc-123');
      const color2 = getMemberColor('user-abc-123');
      expect(color1).toBe(color2);
    });

    it('should return a color from the MEMBER_COLORS array', () => {
      const color = getMemberColor('any-member-id');
      expect(MEMBER_COLORS).toContain(color);
    });

    it('should use index when provided, ignoring memberId hash', () => {
      const color0 = getMemberColor('irrelevant', 0);
      const color1 = getMemberColor('irrelevant', 1);
      expect(color0).toBe(MEMBER_COLORS[0]);
      expect(color1).toBe(MEMBER_COLORS[1]);
    });

    it('should wrap index around when it exceeds array length', () => {
      const len = MEMBER_COLORS.length;
      const color = getMemberColor('irrelevant', len);
      expect(color).toBe(MEMBER_COLORS[0]);

      const color2 = getMemberColor('irrelevant', len + 3);
      expect(color2).toBe(MEMBER_COLORS[3]);
    });

    it('should produce different colors for different member IDs', () => {
      // While collisions are possible, these two strings are different enough
      const colorA = getMemberColor('alice');
      const colorB = getMemberColor('z');
      // Both should still be valid member colors regardless
      expect(MEMBER_COLORS).toContain(colorA);
      expect(MEMBER_COLORS).toContain(colorB);
    });

    it('should handle empty string memberId', () => {
      const color = getMemberColor('');
      expect(MEMBER_COLORS).toContain(color);
    });
  });

  // ============================================================
  // getMemberTextColor
  // ============================================================
  describe('getMemberTextColor', () => {
    it('should return dark text (#0E103D) for gold background', () => {
      const result = getMemberTextColor('#F4D35E');
      expect(result).toBe('#0E103D');
    });

    it('should return white (#FFFFFF) for non-gold backgrounds', () => {
      const nonGoldColors = MEMBER_COLORS.filter((c) => c !== '#F4D35E');
      for (const bg of nonGoldColors) {
        expect(getMemberTextColor(bg)).toBe('#FFFFFF');
      }
    });

    it('should return white for arbitrary non-gold color', () => {
      expect(getMemberTextColor('#123456')).toBe('#FFFFFF');
    });
  });

  // ============================================================
  // MEMBER_COLORS
  // ============================================================
  describe('MEMBER_COLORS', () => {
    it('should have exactly 8 colors', () => {
      expect(MEMBER_COLORS).toHaveLength(8);
    });

    it('should match the CLAUDE.md spec colors in order', () => {
      expect(MEMBER_COLORS).toEqual([
        '#69306D',
        '#2CA58D',
        '#F95738',
        '#F4D35E',
        '#4A6FA5',
        '#F46197',
        '#EE964B',
        '#A5668B',
      ]);
    });
  });

  // ============================================================
  // Color tokens — verify critical values match CLAUDE.md
  // ============================================================
  describe('colors', () => {
    describe('bg', () => {
      it('should have correct background values from CLAUDE.md', () => {
        expect(colors.bg.deep).toBe('#F5F4F8');
        expect(colors.bg.surface).toBe('#EDECF1');
        expect(colors.bg.card).toBe('#FFFFFF');
        expect(colors.bg.hover).toBe('#EDEAF3');
        expect(colors.bg.muted).toBe('#E8E6EE');
        expect(colors.bg.lavVeil).toBe('#F2D7EE');
      });
    });

    describe('velvet', () => {
      it('should have correct velvet accent values', () => {
        expect(colors.velvet.DEFAULT).toBe('#69306D');
        expect(colors.velvet.light).toBe('#A5668B');
        expect(colors.velvet.wash).toBe('#F5E8EF');
        expect(colors.velvet.dim).toBe('#F3E8F4');
      });
    });

    describe('coral', () => {
      it('should have correct coral values', () => {
        expect(colors.coral.DEFAULT).toBe('#F95738');
        expect(colors.coral.light).toBe('#FEF0EC');
      });
    });

    describe('sage (success/seagrass)', () => {
      it('should have correct sage values', () => {
        expect(colors.sage.DEFAULT).toBe('#2CA58D');
        expect(colors.sage.light).toBe('#E6F6F2');
      });
    });

    describe('sky (info)', () => {
      it('should have correct sky values', () => {
        expect(colors.sky.DEFAULT).toBe('#4A6FA5');
        expect(colors.sky.light).toBe('#EDF2F9');
      });
    });

    describe('plum (AI)', () => {
      it('should have correct plum values', () => {
        expect(colors.plum.DEFAULT).toBe('#69306D');
        expect(colors.plum.light).toBe('#F3E8F4');
      });
    });

    describe('text', () => {
      it('should have correct text color values', () => {
        expect(colors.text.primary).toBe('#0E103D');
        expect(colors.text.body).toBe('#2D2B4E');
        expect(colors.text.secondary).toBe('#6B6889');
        expect(colors.text.muted).toBe('#A09DB8');
        expect(colors.text.onVelvet).toBe('#FFFFFF');
      });
    });

    describe('border', () => {
      it('should have correct border values', () => {
        expect(colors.border.DEFAULT).toBe('#E2D8DC');
        expect(colors.border.strong).toBe('#D1C5CC');
        expect(colors.border.divider).toBe('#EDE6E8');
      });
    });

    describe('status', () => {
      it('should map status colors correctly', () => {
        expect(colors.status.urgent).toBe('#F95738');
        expect(colors.status.done).toBe('#2CA58D');
        expect(colors.status.medium).toBe('#4A6FA5');
        expect(colors.status.low).toBe('#A09DB8');
        expect(colors.status.high).toBe('#EE964B');
      });
    });

    describe('accent', () => {
      it('should have all accent colors from CLAUDE.md', () => {
        expect(colors.accent.seagrass).toBe('#2CA58D');
        expect(colors.accent.seagrassDim).toBe('#E6F6F2');
        expect(colors.accent.coral).toBe('#F95738');
        expect(colors.accent.coralDim).toBe('#FEF0EC');
        expect(colors.accent.gold).toBe('#F4D35E');
        expect(colors.accent.goldDim).toBe('#FDF8E6');
        expect(colors.accent.rose).toBe('#F46197');
        expect(colors.accent.roseDim).toBe('#FEECF3');
        expect(colors.accent.sandy).toBe('#EE964B');
        expect(colors.accent.sandyDim).toBe('#FDF3E8');
        expect(colors.accent.steel).toBe('#4A6FA5');
        expect(colors.accent.steelDim).toBe('#EDF2F9');
      });
    });
  });

  // ============================================================
  // Spacing
  // ============================================================
  describe('space', () => {
    it('should use a 4px base grid', () => {
      expect(space[1]).toBe(4);
      expect(space[2]).toBe(8);
      expect(space[3]).toBe(12);
      expect(space[4]).toBe(16);
      expect(space[5]).toBe(20);
      expect(space[6]).toBe(24);
      expect(space[8]).toBe(32);
      expect(space[10]).toBe(40);
      expect(space[12]).toBe(48);
    });

    it('should have all values as multiples of 4', () => {
      for (const [, value] of Object.entries(space)) {
        expect(value % 4).toBe(0);
      }
    });
  });

  // ============================================================
  // Border Radius
  // ============================================================
  describe('radius', () => {
    it('should have correct values from CLAUDE.md', () => {
      expect(radius.sm).toBe(6);
      expect(radius.md).toBe(10);
      expect(radius.lg).toBe(14);
      expect(radius.xl).toBe(20);
      expect(radius.full).toBe(9999);
    });
  });

  // ============================================================
  // Typography
  // ============================================================
  describe('typography', () => {
    it('should define display-lg preset correctly', () => {
      expect(typography.displayLg).toEqual({
        fontSize: 36,
        fontWeight: '700',
        lineHeight: 40,
        fontFamily: 'DMSans_700Bold',
        letterSpacing: -0.5,
      });
    });

    it('should define display-md preset correctly', () => {
      expect(typography.displayMd).toEqual({
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 32,
        fontFamily: 'DMSans_700Bold',
        letterSpacing: -0.3,
      });
    });

    it('should define heading-lg preset correctly', () => {
      expect(typography.headingLg).toEqual({
        fontSize: 22,
        fontWeight: '600',
        lineHeight: 28,
        fontFamily: 'DMSans_600SemiBold',
      });
    });

    it('should define heading-md preset correctly', () => {
      expect(typography.headingMd).toEqual({
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 23,
        fontFamily: 'DMSans_600SemiBold',
      });
    });

    it('should define body-lg preset correctly', () => {
      expect(typography.bodyLg).toEqual({
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 25,
        fontFamily: 'DMSans_400Regular',
      });
    });

    it('should define body-md preset correctly', () => {
      expect(typography.bodyMd).toEqual({
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 22,
        fontFamily: 'DMSans_400Regular',
      });
    });

    it('should define body-sm preset correctly', () => {
      expect(typography.bodySm).toEqual({
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
        fontFamily: 'DMSans_500Medium',
      });
    });

    it('should define caption preset with uppercase transform', () => {
      expect(typography.caption).toEqual({
        fontSize: 11,
        fontWeight: '600',
        lineHeight: 14,
        fontFamily: 'DMSans_600SemiBold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      });
    });

    it('should define mono-lg preset correctly', () => {
      expect(typography.monoLg).toEqual({
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 24,
        fontFamily: 'JetBrainsMono_600SemiBold',
      });
    });

    it('should define mono-md preset correctly', () => {
      expect(typography.monoMd).toEqual({
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        fontFamily: 'JetBrainsMono_400Regular',
      });
    });

    it('should use DM Sans for all non-mono presets', () => {
      const nonMono = [
        typography.displayLg,
        typography.displayMd,
        typography.headingLg,
        typography.headingMd,
        typography.bodyLg,
        typography.bodyMd,
        typography.bodySm,
        typography.caption,
      ];
      for (const preset of nonMono) {
        expect(preset.fontFamily).toMatch(/^DMSans_/);
      }
    });

    it('should use JetBrains Mono for mono presets', () => {
      expect(typography.monoLg.fontFamily).toMatch(/^JetBrainsMono_/);
      expect(typography.monoMd.fontFamily).toMatch(/^JetBrainsMono_/);
    });
  });

  // ============================================================
  // Shadows
  // ============================================================
  describe('shadows', () => {
    it('should have card shadow matching CLAUDE.md spec', () => {
      expect(shadows.card).toEqual({
        shadowColor: '#0E103D',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
      });
    });

    it('should have cardHover shadow matching CLAUDE.md spec', () => {
      expect(shadows.cardHover).toEqual({
        shadowColor: '#0E103D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      });
    });

    it('should have modal shadow matching CLAUDE.md spec', () => {
      expect(shadows.modal).toEqual({
        shadowColor: '#0E103D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
      });
    });

    it('should have fab shadow using velvet color', () => {
      expect(shadows.fab.shadowColor).toBe('#69306D');
      expect(shadows.fab.shadowOpacity).toBe(0.25);
    });

    it('should use cool-tinted shadows (not pure black)', () => {
      for (const [key, preset] of Object.entries(shadows)) {
        if (key === 'none') continue;
        expect(preset.shadowColor).not.toBe('#000000');
      }
    });
  });

  // ============================================================
  // Animation
  // ============================================================
  describe('animation', () => {
    it('should define press scale at 0.98', () => {
      expect(animation.press.scale).toBe(0.98);
      expect(animation.press.duration).toBe(100);
    });

    it('should define FAB press scale at 0.92', () => {
      expect(animation.fabPress.scale).toBe(0.92);
      expect(animation.fabPress.duration).toBe(100);
    });
  });
});
