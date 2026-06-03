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
  const [overheads, setOverheads] = useState([]); // { name, amount }
  const [newOverheadName, setNewOverheadName] = useState('');
  const [newOverheadAmount, setNewOverheadAmount] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [prodRes, matRes, purchRes] = await Promise.all([
      supabase.from('products').select('*, product_recipes(quantity_required, raw_materials(*))').order('name'),
      supabase.from('raw_materials').select('*').order('name'),
      supabase.from('purchase_items').select('material_id, rate_per_unit').order('id', { ascending: false })
    ]);
    setProducts(prodRes.data || []);
    setRawMaterials(matRes.data || []);
    setPurchaseHistory(purchRes.data || []);
    setLoading(false);
  };

  const getLatestCost = (materialId) => {
    const latestPurchase = purchaseHistory.find(p => p.material_id === materialId);
    return latestPurchase ? Number(latestPurchase.rate_per_unit) : 0;
  };

  const selectProductAndLoadRecipe = (product) => {
    setSelectedProduct(product);
    if (product.product_recipes && product.product_recipes.length > 0) {
      const recipeItems = product.product_recipes.map(pr => ({
        material: pr.raw_materials,
        quantityUsed: (pr.quantity_required).toString() // Base recipe for 1 unit, they will adjust
      }));
      setItems(recipeItems);
      // Auto-set qty to 1 if empty
      if (!qtyProduced) setQtyProduced('1');
    } else {
      setItems([]);
    }
  };

  // Recalculate recipe qtys if user changes qtyProduced
  const handleQtyChange = (val) => {
    setQtyProduced(val);
    const num = parseFloat(val) || 0;
    if (selectedProduct && selectedProduct.product_recipes && selectedProduct.product_recipes.length > 0 && num > 0) {
      const recipeItems = selectedProduct.product_recipes.map(pr => ({
        material: pr.raw_materials,
        quantityUsed: (pr.quantity_required * num).toString()
      }));
      setItems(recipeItems);
    }
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

  const addOverhead = () => {
    if (newOverheadName && newOverheadAmount) {
      setOverheads([...overheads, { name: newOverheadName, amount: parseFloat(newOverheadAmount) }]);
      setNewOverheadName('');
      setNewOverheadAmount('');
    }
  };

  const removeOverhead = (index) => {
    setOverheads(overheads.filter((_, i) => i !== index));
  };

  // Calculate Costs
  const rawMaterialCost = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantityUsed) || 0;
    const costPerUnit = getLatestCost(item.material.id);
    return sum + (qty * costPerUnit);
  }, 0);

  const totalOverheadCost = overheads.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalEstimatedCost = rawMaterialCost + totalOverheadCost;
  const costPerProducedUnit = parseFloat(qtyProduced) > 0 ? (totalEstimatedCost / parseFloat(qtyProduced)) : 0;

  const handleSaveBatch = async () => {
    if (!selectedProduct) { if(global.alert) alert('Select a finished product'); return; }
    if (!qtyProduced || parseFloat(qtyProduced) <= 0) { if(global.alert) alert('Enter quantity produced'); return; }
    if (items.length === 0) { if(global.alert) alert('Add at least one raw material'); return; }
    
    setIsSubmitting(true);
    try {
      const prefix = selectedProduct.name.substring(0, 3).toUpperCase();
      const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
      const lotNumber = `LOT-${dateStr}-${prefix}-${Math.floor(Math.random()*1000)}`;
      
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      const expiryStr = expiryDate.toISOString().slice(0, 10);

      const { data: batchData, error: batchError } = await supabase
        .from('production_batches')
        .insert([{ 
          product_id: selectedProduct.id, 
          batch_number: batchNumber, 
          quantity_produced: parseInt(qtyProduced),
          total_estimated_cost: totalEstimatedCost,
          lot_number: lotNumber,
          expiry_date: expiryStr,
          overheads: overheads,
          total_overhead_cost: totalOverheadCost
        }])
        .select().single();
      if (batchError) throw batchError;

      for (const item of items) {
        const qtyUsed = parseFloat(item.quantityUsed) || 0;
        await supabase.from('production_materials').insert([{
          batch_id: batchData.id,
          raw_material_id: item.material.id,
          quantity_used: qtyUsed
        }]);

        const newStock = Number(item.material.current_stock) - qtyUsed;
        await supabase.from('raw_materials').update({ current_stock: newStock }).eq('id', item.material.id);
      }

      // Add finished product stock
      const newProdStock = Number(selectedProduct.current_stock || 0) + parseInt(qtyProduced);
      await supabase.from('products').update({ current_stock: newProdStock }).eq('id', selectedProduct.id);

      if (global.alert) alert('Production logged & warehouse inventory updated!');
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
            <TouchableOpacity key={p.id} style={[styles.chip, selectedProduct?.id === p.id && styles.chipActive]} onPress={() => selectProductAndLoadRecipe(p)}>
              <Text style={[styles.chipText, selectedProduct?.id === p.id && styles.chipTextActive]}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TextInput style={styles.input} placeholder="Quantity Produced (e.g., 100)" placeholderTextColor="#666" value={qtyProduced} onChangeText={handleQtyChange} keyboardType="numeric" />

        <Text style={styles.sectionTitle}>2. Raw Materials Consumed (Auto-filled from Recipe)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {rawMaterials.map(m => (
            <TouchableOpacity key={m.id} style={styles.productChip} onPress={() => addMaterial(m)}>
              <Plus color={theme.colors.primary} size={16} />
              <Text style={styles.productChipText}>{m.name} ({m.current_stock} {m.unit} left)</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Materials Used</Text>
          {items.map((item, index) => {
             const cost = getLatestCost(item.material.id);
             return (
              <View key={index} style={styles.lineItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemText}>{item.material.name}</Text>
                  <Text style={styles.itemSubtext}>Est. Cost: ₹{cost}/{item.material.unit}</Text>
                </View>
                <TextInput style={styles.inputSmall} placeholder="Qty" placeholderTextColor="#666" value={item.quantityUsed} onChangeText={(t) => updateQuantity(item.material.id, t)} keyboardType="numeric" />
                <Text style={styles.unitText}>{item.material.unit}</Text>
                <TouchableOpacity onPress={() => removeMaterial(item.material.id)} style={{ marginLeft: 15 }}><Trash2 color={theme.colors.danger} size={20} /></TouchableOpacity>
              </View>
            );
          })}
          {items.length === 0 && <Text style={{color:'gray'}}>No materials added yet.</Text>}
        </View>

        <Text style={styles.sectionTitle}>3. Direct Overheads (Electricity, Labor, Packaging)</Text>
        <View style={styles.card}>
          {overheads.map((o, idx) => (
            <View key={idx} style={styles.lineItem}>
              <Text style={[styles.itemText, { flex: 1 }]}>{o.name}</Text>
              <Text style={styles.itemText}>₹{o.amount.toFixed(2)}</Text>
              <TouchableOpacity onPress={() => removeOverhead(idx)} style={{ marginLeft: 15 }}><Trash2 color={theme.colors.danger} size={20} /></TouchableOpacity>
            </View>
          ))}
          <View style={styles.addOverheadRow}>
            <TextInput style={[styles.inputSmall, { flex: 1, width: 'auto' }]} placeholder="Expense Name (e.g. Labor)" placeholderTextColor="#666" value={newOverheadName} onChangeText={setNewOverheadName} />
            <TextInput style={styles.inputSmall} placeholder="₹ Cost" placeholderTextColor="#666" value={newOverheadAmount} onChangeText={setNewOverheadAmount} keyboardType="decimal-pad" />
            <TouchableOpacity style={styles.addBtn} onPress={addOverhead}>
              <Plus color="#FFF" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.costSummaryCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Raw Material Cost:</Text>
            <Text style={styles.totalValue}>₹{rawMaterialCost.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Overheads:</Text>
            <Text style={styles.totalValue}>₹{totalOverheadCost.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10 }]}>
            <Text style={styles.totalLabel}>Total Batch Cost:</Text>
            <Text style={[styles.totalValue, { color: theme.colors.primary }]}>₹{totalEstimatedCost.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>True Cost Per Packet:</Text>
            <Text style={[styles.totalValue, { color: theme.colors.text }]}>₹{costPerProducedUnit.toFixed(2)}</Text>
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
  inputSmall: { backgroundColor: theme.colors.background, color: theme.colors.text, width: 80, height: 40, textAlign: 'center', borderRadius: 5, borderWidth: 1, borderColor: theme.colors.border, marginRight: 10 },
  unitText: { color: theme.colors.textSecondary, width: 30 },
  addOverheadRow: { flexDirection: 'row', marginTop: 10 },
  addBtn: { backgroundColor: theme.colors.primary, padding: 10, borderRadius: 8, justifyContent: 'center' },
  costSummaryCard: { backgroundColor: theme.colors.primary + '15', padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.primary + '30', marginBottom: theme.spacing.l },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalLabel: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: 'bold' },
  totalValue: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
  btn: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
