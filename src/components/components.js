import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Modal, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTypeColor, formatName } from './constants';

// ─── TypeBadge ────────────────────────────────────────────────────────────────
export const TypeBadge = React.memo(({ type, light = false }) => {
  const bg = light ? 'rgba(255,255,255,0.22)' : getTypeColor(type);
  const color = '#FFFFFF';
  return (
    <View style={[badge.container, { backgroundColor: bg }]}>
      <Text style={[badge.text, { color }]}>{type}</Text>
    </View>
  );
});

const badge = StyleSheet.create({
  container: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});

// ─── SearchBar ────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChangeText, placeholder = 'Buscar...' }) {
  return (
    <View style={search.wrapper}>
      <Text style={search.icon}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={search.input}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={search.clearBtn}>
          <Text style={search.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const search = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  icon: { position: 'absolute', left: 12, zIndex: 1, fontSize: 14 },
  input: {
    flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 14, paddingVertical: 12, paddingLeft: 36, paddingRight: 40,
    fontSize: 15, color: '#111827',
  },
  clearBtn: { position: 'absolute', right: 12, zIndex: 1, padding: 4 },
  clearIcon: { fontSize: 12, color: '#9CA3AF' },
});

// ─── ScreenHeader ─────────────────────────────────────────────────────────────
export function ScreenHeader({
  title, subtitle, onBack, backColor = '#3B82F6',
  bgColor = '#FFFFFF', children,
}) {
  return (
    <View style={[header.container, { backgroundColor: bgColor }]}>
      {onBack && (
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={header.backBtn}>
          <Text style={[header.backText, { color: backColor }]}>‹ Voltar</Text>
        </TouchableOpacity>
      )}
      <Text style={[header.title, bgColor !== '#FFFFFF' && { color: '#FFF' }]}>{title}</Text>
      {subtitle && (
        <Text style={[header.subtitle, bgColor !== '#FFFFFF' && { color: 'rgba(255,255,255,0.75)' }]}>
          {subtitle}
        </Text>
      )}
      {children}
    </View>
  );
}

const header = StyleSheet.create({
  container: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[card.container, style]}>{children}</View>;
}

export function CardTitle({ children }) {
  return <Text style={card.title}>{children}</Text>;
}

const card = StyleSheet.create({
  container: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 14 },
});

// ─── InfoGrid ─────────────────────────────────────────────────────────────────
export function InfoGrid({ items }) {
  return (
    <View style={grid.container}>
      {items.map(({ label, value }) =>
        value != null ? (
          <View key={label} style={grid.item}>
            <Text style={grid.label}>{label}</Text>
            <Text style={grid.value}>{value}</Text>
          </View>
        ) : null
      )}
    </View>
  );
}

const grid = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  item: { width: '28%' },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 },
  value: { fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
});

// ─── BottomSheet Modal ────────────────────────────────────────────────────────
export function BottomSheet({ visible, onClose, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={sheet.overlay}>
        <View style={sheet.container}>
          <TouchableOpacity onPress={onClose} style={sheet.closeBtn}>
            <Text style={sheet.closeText}>✕</Text>
          </TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '85%',
  },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  closeText: { fontSize: 18, color: '#9CA3AF' },
});

// ─── LoadingView ──────────────────────────────────────────────────────────────
export function LoadingView({ text = 'Carregando...' }) {
  return (
    <View style={loading.container}>
      <Text style={loading.text}>{text}</Text>
    </View>
  );
}

const loading = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { marginTop: 10, color: '#6B7280' },
});

// ─── FooterLoader ─────────────────────────────────────────────────────────────
export function FooterLoader() {
  return <View style={{ paddingVertical: 20, alignItems: 'center' }} />;
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '🔍', text = 'Nenhum resultado encontrado.' }) {
  return (
    <View style={empty.container}>
      <Text style={empty.icon}>{icon}</Text>
      <Text style={empty.text}>{text}</Text>
    </View>
  );
}

const empty = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 60 },
  icon: { fontSize: 48, marginBottom: 12 },
  text: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
});