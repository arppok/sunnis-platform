import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function PurchaseEntry({ navigation }) {
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [billNumber, setBillNumber] = useState(`PO-${Math.floor(Math.random() * 10000)}`);
  const [items, setItems] = useState([]); // { material, quantity, rate }
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [vendRes, matRes] = await Promise.all([
      supabase.from('vendors').select('*').order('name'),
      supabase.from('raw_materials').select('*').order('name')
    ]);
    setVendors(vendRes.data || []);
    setMaterials(matRes.data || []);
    setLoading(false);
  };

  const addItem = (material) => {
    const existing = items.find(i => i.material.id === material.id);
    if (!existing) {
      setItems([...items, { material, quantity: '', rate: '' }]);
    }
  };

  const updateItem = (materialId, field, value) => {
    setItems(items.map(i => i.material.id === materialId ? { ...i, [field]: value } : i));
  };

  const removeItem = (materialId) => {
    setItems(items.filter(i => i.material.id !== materialId));
  };

  const totalAmount = items.reduce((sum, item) => sum + ((parseFloat(item.quantity)||0) * (parseFloat(item.rate)||0)), 0);

  const handleSavePurchase = async () => {
    if (!selectedVendor) { if (global.alert) alert('Select a vendor'); return; }
    if (items.length === 0) { if (global.alert) alert('Add at least one item'); return; }
    
    setIsSubmitting(true);
    try {
      // 1. Insert Purchase Bill
      const { data: billData, error: billError } = await supabase
        .from('purchase_bills')
        .insert([{ vendor_id: selectedVendor.id, bill_number: billNumber, total_amount: totalAmount }])
        .select().single();
      
      if (billError) throw billError;

      // 2. Insert Items & Update Stock
      for (const item of items) {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        
        // Insert item record
        await supabase.from('purchase_items').insert([{
          bill_id: billData.id,
          material_id: item.material.id,
          quantity: qty,
          rate_per_unit: rate,
          total_price: qty * rate
        }]);

        // Update raw_materials stock
        const newStock = Number(item.material.current_stock) + qty;
        await supabase.from('raw_materials').update({ current_stock: newStock }).eq('id', item.material.id);
      }

      if (global.alert) alert('Purchase bill saved & stock updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to save purchase entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator color={theme.colors.primary} style={{flex:1, backgroundColor: theme.colors.background}} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft color={theme.colors.text} size={24} /></TouchableOpacity>
        <Text style={styles.title}>Inward Entry (Purchase)</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.sectionTitle}>1. Select Vendor</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {vendors.map(v => (
            <TouchableOpacity key={v.id} style={[styles.chip, selectedVendor?.id === v.id && styles.chipActive]} onPress={() => setSelectedVendor(v)}>
              <Text style={[styles.chipText, selectedVendor?.id === v.id && styles.chipTextActive]}>{v.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>2. Add Raw Materials</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {materials.map(m => (
            <TouchableOpacity key={m.id} style={styles.productChip} onPress={() => addItem(m)}>
              <Plus color={theme.colors.primary} size={16} />
              <Text style={styles.productChipText}>{m.name} ({m.unit})</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Items</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.lineItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemText}>{item.material.name}</Text>
                <Text style={styles.itemSubtext}>In Stock: {item.material.current_stock} {item.material.unit}</Text>
              </View>
              <TextInput style={styles.inputSmall} placeholder="Qty" placeholderTextColor="#666" value={item.quantity} onChangeText={(t) => updateItem(item.material.id, 'quantity', t)} keyboardType="numeric" />
              <TextInput style={styles.inputSmall} placeholder="Rate" placeholderTextColor="#666" value={item.rate} onChangeText={(t) => updateItem(item.material.id, 'rate', t)} keyboardType="numeric" />
              <Text style={styles.itemTotal}>${((parseFloat(item.quantity)||0) * (parseFloat(item.rate)||0)).toFixed(2)}</Text>
              <TouchableOpacity onPress={() => removeItem(item.material.id)} style={{ marginLeft: 10 }}><Trash2 color={theme.colors.danger} size={20} /></TouchableOpacity>
            </View>
          ))}
          {items.length === 0 && <Text style={{color:'gray'}}>No items added yet.</Text>}
        </View>

        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Bill Amount:</Text>
            <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={handleSavePurchase} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Purchase & Update Stock</Text>}
        </TouchableOpacity>
        <View style={{height: 50}}/>
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
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: theme.spacing.m },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginRight: 10 },
  chipActive: { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary },
  chipText: { color: theme.colors.text },
  chipTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
  productChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary + '50', marginRight: 10 },
  productChipText: { color: theme.colors.text, marginLeft: 5 },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.l },
  cardTitle: { color: theme.colors.text, fontWeight: 'bold', marginBottom: 15 },
  lineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  itemText: { color: theme.colors.text, fontWeight: '500' },
  itemSubtext: { color: theme.colors.textSecondary, fontSize: 12 },
  inputSmall: { backgroundColor: theme.colors.background, color: theme.colors.text, width: 50, height: 35, textAlign: 'center', borderRadius: 5, borderWidth: 1, borderColor: theme.colors.border, marginRight: 5 },
  itemTotal: { color: theme.colors.text, width: 60, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
  totalValue: { color: theme.colors.primary, fontSize: 20, fontWeight: 'bold' },
  btn: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
