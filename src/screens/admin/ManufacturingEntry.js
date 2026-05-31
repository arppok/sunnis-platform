import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function ManufacturingEntry({ navigation }) {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qtyProduced, setQtyProduced] = useState('');
  const [batchNumber, setBatchNumber] = useState(`MFG-${Math.floor(Math.random() * 10000)}`);
  const [items, setItems] = useState([]); // { material, quantityUsed }
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [prodRes, matRes, purchRes] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('raw_materials').select('*').order('name'),
      supabase.from('purchase_items').select('material_id, rate_per_unit').order('id', { ascending: false })
    ]);
    setProducts(prodRes.data || []);
    setRawMaterials(matRes.data || []);
    setPurchaseHistory(purchRes.data || []);
    setLoading(false);
  };

  // Build a cost map (latest purchase rate for each material)
  const getLatestCost = (materialId) => {
    const latestPurchase = purchaseHistory.find(p => p.material_id === materialId);
    return latestPurchase ? Number(latestPurchase.rate_per_unit) : 0;
  };

  const addMaterial = (material) => {
    const existing = items.find(i => i.material.id === material.id);
    if (!existing) {
      setItems([...items, { material, quantityUsed: '' }]);
    }
  };

  const updateQuantity = (materialId, qty) => {
    setItems(items.map(i => i.material.id === materialId ? { ...i, quantityUsed: qty } : i));
  };

  const removeMaterial = (materialId) => {
    setItems(items.filter(i => i.material.id !== materialId));
  };

  // Calculate total estimated cost based on recipe and recent purchase prices
  const totalEstimatedCost = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantityUsed) || 0;
    const costPerUnit = getLatestCost(item.material.id);
    return sum + (qty * costPerUnit);
  }, 0);

  const costPerProducedUnit = parseFloat(qtyProduced) > 0 ? (totalEstimatedCost / parseFloat(qtyProduced)) : 0;

  const handleSaveBatch = async () => {
    if (!selectedProduct) { if(global.alert) alert('Select a finished product'); return; }
    if (!qtyProduced || parseFloat(qtyProduced) <= 0) { if(global.alert) alert('Enter quantity produced'); return; }
    if (items.length === 0) { if(global.alert) alert('Add at least one raw material'); return; }
    
    setIsSubmitting(true);
    try {
      // Generate intelligent LOT Number and Expiry
      const prefix = selectedProduct.name.substring(0, 3).toUpperCase();
      const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
      const lotNumber = `LOT-${dateStr}-${prefix}-${Math.floor(Math.random()*1000)}`;
      
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // +12 Months
      const expiryStr = expiryDate.toISOString().slice(0, 10);

      // 1. Insert Production Batch
      const { data: batchData, error: batchError } = await supabase
        .from('production_batches')
        .insert([{ 
          product_id: selectedProduct.id, 
          batch_number: batchNumber, 
          quantity_produced: parseInt(qtyProduced),
          total_estimated_cost: totalEstimatedCost,
          lot_number: lotNumber,
          expiry_date: expiryStr
        }])
        .select().single();
      
      if (batchError) throw batchError;

      // 2. Insert Recipe Items & Update Warehouse Stock
      for (const item of items) {
        const qtyUsed = parseFloat(item.quantityUsed) || 0;
        
        // Insert record
        await supabase.from('production_materials').insert([{
          batch_id: batchData.id,
          raw_material_id: item.material.id,
          quantity_used: qtyUsed
        }]);

        // DEDUCT stock from raw_materials
        const newStock = Number(item.material.current_stock) - qtyUsed;
        await supabase.from('raw_materials').update({ current_stock: newStock }).eq('id', item.material.id);
      }

      if (global.alert) alert('Production logged & warehouse inventory deducted successfully!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to log production batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator color={theme.colors.primary} style={{flex:1, backgroundColor: theme.colors.background}} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft color={theme.colors.text} size={24} /></TouchableOpacity>
        <Text style={styles.title}>Log Production Batch</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.sectionTitle}>1. What did you make?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
          {products.map(p => (
            <TouchableOpacity key={p.id} style={[styles.chip, selectedProduct?.id === p.id && styles.chipActive]} onPress={() => setSelectedProduct(p)}>
              <Text style={[styles.chipText, selectedProduct?.id === p.id && styles.chipTextActive]}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TextInput style={styles.input} placeholder="Quantity Produced (e.g., 100)" placeholderTextColor="#666" value={qtyProduced} onChangeText={setQtyProduced} keyboardType="numeric" />

        <Text style={styles.sectionTitle}>2. What raw materials did you consume?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {rawMaterials.map(m => (
            <TouchableOpacity key={m.id} style={styles.productChip} onPress={() => addMaterial(m)}>
              <Plus color={theme.colors.primary} size={16} />
              <Text style={styles.productChipText}>{m.name} ({m.current_stock} {m.unit} left)</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recipe / Materials Consumed</Text>
          {items.map((item, index) => {
             const cost = getLatestCost(item.material.id);
             return (
              <View key={index} style={styles.lineItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemText}>{item.material.name}</Text>
                  <Text style={styles.itemSubtext}>Est. Cost: ${cost}/{item.material.unit}</Text>
                </View>
                <TextInput style={styles.inputSmall} placeholder="Qty Used" placeholderTextColor="#666" value={item.quantityUsed} onChangeText={(t) => updateQuantity(item.material.id, t)} keyboardType="numeric" />
                <Text style={styles.unitText}>{item.material.unit}</Text>
                <TouchableOpacity onPress={() => removeMaterial(item.material.id)} style={{ marginLeft: 15 }}><Trash2 color={theme.colors.danger} size={20} /></TouchableOpacity>
              </View>
            );
          })}
          {items.length === 0 && <Text style={{color:'gray'}}>No materials added yet.</Text>}
        </View>

        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Est. Cost for Batch:</Text>
            <Text style={styles.totalValue}>${totalEstimatedCost.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Est. Cost Per Packet:</Text>
            <Text style={[styles.totalValue, { color: theme.colors.text }]}>${costPerProducedUnit.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={handleSaveBatch} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Log Batch & Deduct Inventory</Text>}
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
  input: { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, color: theme.colors.text, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border },
  productChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary + '50', marginRight: 10 },
  productChipText: { color: theme.colors.text, marginLeft: 5 },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.l },
  cardTitle: { color: theme.colors.text, fontWeight: 'bold', marginBottom: 15 },
  lineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  itemText: { color: theme.colors.text, fontWeight: '500' },
  itemSubtext: { color: theme.colors.textSecondary, fontSize: 12 },
  inputSmall: { backgroundColor: theme.colors.background, color: theme.colors.text, width: 60, height: 35, textAlign: 'center', borderRadius: 5, borderWidth: 1, borderColor: theme.colors.border, marginRight: 10 },
  unitText: { color: theme.colors.textSecondary, width: 30 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalLabel: { color: theme.colors.textSecondary, fontSize: 16 },
  totalValue: { color: theme.colors.primary, fontSize: 18, fontWeight: 'bold' },
  btn: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
