import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Plus, Box, Leaf } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function RawMaterials({ navigation }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg'); // kg, pieces, g, etc
  const [materialType, setMaterialType] = useState('Spice'); // Spice, Packaging
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase.from('raw_materials').select('*').order('name');
      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('raw_materials').insert([{ name, unit, material_type: materialType }]);
      if (error) throw error;
      
      setName('');
      await fetchMaterials();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to add raw material. Check DB schema.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft color={theme.colors.text} size={24} /></TouchableOpacity>
        <Text style={styles.title}>Warehouse Inventory</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Add New Item Type</Text>
          <TextInput style={styles.input} placeholder="Material Name (e.g., Raw Cumin)" placeholderTextColor={theme.colors.textSecondary} value={name} onChangeText={setName} />
          
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.chip, materialType === 'Spice' && styles.chipActive]} onPress={() => setMaterialType('Spice')}>
                  <Text style={[styles.chipText, materialType === 'Spice' && styles.chipTextActive]}>Spice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chip, materialType === 'Packaging' && styles.chipActive]} onPress={() => setMaterialType('Packaging')}>
                  <Text style={[styles.chipText, materialType === 'Packaging' && styles.chipTextActive]}>Pkg</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.chip, unit === 'kg' && styles.chipActive]} onPress={() => setUnit('kg')}>
                  <Text style={[styles.chipText, unit === 'kg' && styles.chipTextActive]}>kg</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chip, unit === 'pcs' && styles.chipActive]} onPress={() => setUnit('pcs')}>
                  <Text style={[styles.chipText, unit === 'pcs' && styles.chipTextActive]}>pcs</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleAddMaterial} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : (
              <><Plus color="#fff" size={20} style={{ marginRight: 8 }} /><Text style={styles.buttonText}>Save Item Type</Text></>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Current Stock Levels</Text>
        {loading ? <ActivityIndicator color={theme.colors.primary} /> : (
          materials.map(mat => (
            <View key={mat.id} style={styles.materialCard}>
              <View style={styles.iconContainer}>
                {mat.material_type === 'Spice' ? <Leaf color={theme.colors.primary} size={20} /> : <Box color={theme.colors.textSecondary} size={20} />}
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.matName}>{mat.name}</Text>
                <Text style={styles.matType}>{mat.material_type}</Text>
              </View>
              <View style={styles.stockBadge}>
                <Text style={styles.stockText}>{mat.current_stock} {mat.unit}</Text>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.l, paddingTop: theme.spacing.xl },
  backBtn: { marginRight: theme.spacing.m },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  scroll: { paddingHorizontal: theme.spacing.l },
  formCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.xl },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: theme.spacing.m },
  input: { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, color: theme.colors.text, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  label: { color: theme.colors.textSecondary, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 5 },
  chip: { flex: 1, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  chipActive: { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textSecondary, fontSize: 12 },
  chipTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
  button: { flexDirection: 'row', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  materialCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.s, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  iconContainer: { padding: 10, backgroundColor: theme.colors.background, borderRadius: 8 },
  matName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
  matType: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  stockBadge: { backgroundColor: theme.colors.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  stockText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }
});
