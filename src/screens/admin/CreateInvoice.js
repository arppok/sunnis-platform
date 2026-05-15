import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function CreateInvoice({ navigation }) {
  const [ledgers, setLedgers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`);
  const [items, setItems] = useState([]); // { product, quantity, unitPrice }
  const [gstRate, setGstRate] = useState('18');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [ledgersRes, productsRes] = await Promise.all([
      supabase.from('ledgers').select('*').order('name'),
      supabase.from('products').select('*').eq('is_upcoming', false).order('name')
    ]);
    setLedgers(ledgersRes.data || []);
    setProducts(productsRes.data || []);
    setLoading(false);
  };

  const addItem = (product) => {
    const existing = items.find(i => i.product.id === product.id);
    if (existing) {
      setItems(items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { product, quantity: 1, unitPrice: product.price }]);
    }
  };

  const updateQuantity = (productId, qty) => {
    if (parseInt(qty) < 1) return;
    setItems(items.map(i => i.product.id === productId ? { ...i, quantity: parseInt(qty) } : i));
  };

  const removeItem = (productId) => {
    setItems(items.filter(i => i.product.id !== productId));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = (subtotal * (parseFloat(gstRate) || 0)) / 100;
  const totalAmount = subtotal + taxAmount;

  const handleSaveInvoice = async (status) => {
    if (!selectedLedger) { if (global.alert) alert('Select a ledger first'); return; }
    if (items.length === 0) { if (global.alert) alert('Add at least one item'); return; }
    
    setIsSubmitting(true);
    try {
      // 1. Insert Invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          invoice_number: invoiceNumber,
          ledger_id: selectedLedger.id,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: status
        }])
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;

      // 2. Insert Invoice Items
      const invoiceItemsToInsert = items.map(item => ({
        invoice_id: invoiceData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice
      }));

      const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItemsToInsert);
      if (itemsError) throw itemsError;

      // 3. Update Ledger Balance if Finalized (assuming it adds to debt)
      if (status === 'Sent') {
        const newBalance = Number(selectedLedger.balance) + totalAmount;
        await supabase.from('ledgers').update({ balance: newBalance }).eq('id', selectedLedger.id);
      }

      if (global.alert) alert(`Invoice ${status} successfully!`);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to create invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator color={theme.colors.primary} style={{flex:1, backgroundColor: theme.colors.background}} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft color={theme.colors.text} size={24} /></TouchableOpacity>
        <Text style={styles.title}>Create Invoice</Text>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Ledger Selection */}
        <Text style={styles.sectionTitle}>1. Select Customer (Ledger)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {ledgers.map(l => (
            <TouchableOpacity key={l.id} style={[styles.chip, selectedLedger?.id === l.id && styles.chipActive]} onPress={() => setSelectedLedger(l)}>
              <Text style={[styles.chipText, selectedLedger?.id === l.id && styles.chipTextActive]}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Add Products */}
        <Text style={styles.sectionTitle}>2. Add Products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {products.map(p => (
            <TouchableOpacity key={p.id} style={styles.productChip} onPress={() => addItem(p)}>
              <Plus color={theme.colors.primary} size={16} />
              <Text style={styles.productChipText}>{p.name} (${p.price})</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Line Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Line Items</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.lineItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemText}>{item.product.name}</Text>
                <Text style={styles.itemSubtext}>${item.unitPrice} each</Text>
              </View>
              <TextInput style={styles.qtyInput} value={String(item.quantity)} onChangeText={(t) => updateQuantity(item.product.id, t)} keyboardType="number-pad" />
              <Text style={styles.itemTotal}>${(item.quantity * item.unitPrice).toFixed(2)}</Text>
              <TouchableOpacity onPress={() => removeItem(item.product.id)} style={{ marginLeft: 10 }}>
                <Trash2 color={theme.colors.danger} size={20} />
              </TouchableOpacity>
            </View>
          ))}
          {items.length === 0 && <Text style={{color:'gray'}}>No items added.</Text>}
        </View>

        {/* Totals & GST */}
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST (%):</Text>
            <TextInput style={styles.gstInput} value={gstRate} onChangeText={setGstRate} keyboardType="decimal-pad" />
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax Amount:</Text>
            <Text style={styles.totalValue}>${taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, { borderTopWidth: 1, borderColor: theme.colors.border, paddingTop: 10, marginTop: 10 }]}>
            <Text style={[styles.totalLabel, { fontWeight: 'bold', fontSize: 18 }]}>Grand Total:</Text>
            <Text style={[styles.totalValue, { fontWeight: 'bold', fontSize: 18, color: theme.colors.primary }]}>${totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.surfaceHighlight }]} onPress={() => handleSaveInvoice('Draft')} disabled={isSubmitting}>
            <Text style={styles.btnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={() => handleSaveInvoice('Sent')} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnText, { color: '#FFF' }]}>Finalize & Send</Text>}
          </TouchableOpacity>
        </View>
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
  qtyInput: { backgroundColor: theme.colors.background, color: theme.colors.text, width: 40, height: 35, textAlign: 'center', borderRadius: 5, borderWidth: 1, borderColor: theme.colors.border, marginRight: 10 },
  itemTotal: { color: theme.colors.text, width: 60, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalLabel: { color: theme.colors.textSecondary },
  totalValue: { color: theme.colors.text },
  gstInput: { backgroundColor: theme.colors.background, color: theme.colors.text, width: 50, height: 30, textAlign: 'center', borderRadius: 5, borderWidth: 1, borderColor: theme.colors.border },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: theme.colors.text, fontWeight: 'bold' }
});
