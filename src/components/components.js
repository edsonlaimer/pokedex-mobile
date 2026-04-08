import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS, SHADOW, getTypeColor, hex2rgba } from './constants';

// ─── TypeBadge ────────────────────────────────────────────────────────────────
export const TypeBadge = React.memo(({ type, light = false, size = 'md' }) => {
  const color = getTypeColor(type);
  const bg    = light ? 'rgba(255,255,255,0.25)' : hex2rgba(color, 0.15);
  const fg    = light ? '#FFFFFF' : color;
  const isSmall = size === 'sm';
  return (
    <View style={[badge.wrap, { backgroundColor: bg, borderColor: light ? 'rgba(255,255,255,0.3)' : hex2rgba(color, 0.3) }]}>
      <Text style={[badge.text, { color: fg, fontSize: isSmall ? 10 : 12 }]}>{type}</Text>
    </View>
  );
});

const badge = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm,
    alignSelf: 'flex-start', borderWidth: 1,
  },
  text: { fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.3 },
});

// ─── SearchBar ────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChangeText, placeholder = 'Buscar...' }) {
  return (
    <View style={sb.wrap}>
      <Text style={sb.icon}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        style={sb.input}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={sb.clear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <View style={sb.clearCircle}>
            <Text style={sb.clearText}>✕</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sb = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center' },
  icon:        { position: 'absolute', left: 14, zIndex: 1, fontSize: 15 },
  input: {
    flex: 1, backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingVertical: 13, paddingLeft: 42, paddingRight: 44,
    fontSize: 15, color: COLORS.text, fontWeight: '500',
  },
  clear:       { position: 'absolute', right: 12, zIndex: 1 },
  clearCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.textMuted, justifyContent: 'center', alignItems: 'center' },
  clearText:   { fontSize: 9, color: '#FFF', fontWeight: '800' },
});

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[card.wrap, style]}>{children}</View>;
}

export function CardTitle({ children, style }) {
  return <Text style={[card.title, style]}>{children}</Text>;
}

export function SectionDivider() {
  return <View style={card.divider} />;
}

const card = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 18, marginBottom: 12,
    ...SHADOW.card,
  },
  title:   { fontSize: 13, fontWeight: '800', color: COLORS.textSub, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.8 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
});

// ─── InfoGrid ─────────────────────────────────────────────────────────────────
export function InfoGrid({ items }) {
  const filtered = items.filter((i) => i.value != null && i.value !== '');
  return (
    <View style={ig.wrap}>
      {filtered.map(({ label, value }) => (
        <View key={label} style={ig.item}>
          <Text style={ig.label}>{label}</Text>
          <Text style={ig.value}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const ig = StyleSheet.create({
  wrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item:  { minWidth: '28%', flex: 1 },
  label: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '800', color: COLORS.text, textTransform: 'capitalize' },
});

// ─── BottomSheet ──────────────────────────────────────────────────────────────
export function BottomSheet({ visible, onClose, children, title }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={bs.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={bs.sheet}>
          {/* Handle */}
          <View style={bs.handle} />
          {title && (
            <View style={bs.header}>
              <Text style={bs.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={bs.closeBtn}>
                <Text style={bs.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {children}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const bs = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(15,17,23,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: 24, paddingTop: 12, maxHeight: '88%',
  },
  handle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:    { fontSize: 18, fontWeight: '800', color: COLORS.text },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  closeText:{ fontSize: 12, color: COLORS.textSub, fontWeight: '700' },
});

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '🔍', text = 'Nenhum resultado encontrado.' }) {
  return (
    <View style={es.wrap}>
      <Text style={es.icon}>{icon}</Text>
      <Text style={es.text}>{text}</Text>
    </View>
  );
}

const es = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 60 },
  icon: { fontSize: 48, marginBottom: 12 },
  text: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', fontWeight: '500' },
});

// ─── BackButton ───────────────────────────────────────────────────────────────
export function BackButton({ onPress, light = false }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={bb.btn}>
      <View style={[bb.circle, light ? bb.circleLight : bb.circleDark]}>
        <Text style={[bb.arrow, { color: light ? '#FFF' : COLORS.text }]}>‹</Text>
      </View>
    </TouchableOpacity>
  );
}

const bb = StyleSheet.create({
  btn:         { marginBottom: 8 },
  circle:      { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  circleDark:  { backgroundColor: COLORS.bg },
  circleLight: { backgroundColor: 'rgba(255,255,255,0.2)' },
  arrow:       { fontSize: 22, fontWeight: '700', lineHeight: 26 },
});

// ─── StatBar ─────────────────────────────────────────────────────────────────
export function StatBar({ statName, value, label, color }) {
  const pct = Math.min((value / 255) * 100, 100).toFixed(1);
  return (
    <View style={stat.row}>
      <Text style={stat.label}>{label}</Text>
      <Text style={stat.value}>{value}</Text>
      <View style={stat.track}>
        <View style={[stat.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const stat = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 11 },
  label: { width: 56, fontSize: 11, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { width: 34, fontSize: 14, fontWeight: '800', color: COLORS.text, textAlign: 'right', marginRight: 12 },
  track: { flex: 1, height: 7, backgroundColor: COLORS.border, borderRadius: 99, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 99 },
});

// ─── Pill Button ─────────────────────────────────────────────────────────────
export function PillButton({ label, icon, color = '#3B82F6', onPress, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[pb.btn, { backgroundColor: color }, style]}
    >
      {icon && <Text style={pb.icon}>{icon}</Text>}
      <Text style={pb.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const pb = StyleSheet.create({
  btn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.lg, paddingVertical: 16, gap: 8 },
  icon:  { fontSize: 18 },
  label: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});