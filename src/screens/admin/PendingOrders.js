import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Clock, Check, X, Edit2, Save } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function PendingOrders({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('consumer_orders')
        .select(`
          *,
          consumer_order_items (
            id,
            product_id,
            quantity,
            price_at_time,
            products (name)
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (order) => {
    setEditingOrderId(order.id);
    setEditItems(order.consumer_order_items.map(item => ({...item, quantity: item.quantity.toString()})));
  };

  const updateEditItemQty = (index, qty) => {
    const newItems = [...editItems];
    newItems[index].quantity = qty;
    setEditItems(newItems);
  };

  const saveEdit = async (order) => {
    setIsProcessing(true);
    try {
      let newTotal = 0;
      for (const item of editItems) {
        const qty = parseInt(item.quantity) || 0;
        if (qty > 0) {
          await supabase.from('consumer_order_items').update({ quantity: qty }).eq('id', item.id);
          newTotal += qty * Number(item.price_at_time);
        } else {
          await supabase.from('consumer_order_items').delete().eq('id', item.id);
        }
      }
      await supabase.from('consumer_orders').update({ total_amount: newTotal }).eq('id', order.id);
      if (global.alert) alert('Order updated successfully!');
      setEditingOrderId(null);
      fetchOrders();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to update order');
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectOrder = async (id) => {
    setIsProcessing(true);
    try {
      await supabase.from('consumer_orders').update({ status: 'Rejected' }).eq('id', id);
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'Rejected' } : o));
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const approveAndInvoice = async (order) => {
    setIsProcessing(true);
    try {
      // 1. Find or create Ledger for Consumer
      let ledgerId = null;
      const { data: existingLedger } = await supabase.from('ledgers').select('id').eq('phone', order.customer_phone).single();
      
      if (existingLedger) {
        ledgerId = existingLedger.id;
      } else {
        const { data: newLedger } = await supabase.from('ledgers').insert([{
          name: order.customer_name,
          phone: order.customer_phone,
          ledger_group: 'Consumer',
          balance: order.total_amount
        }]).select().single();
        ledgerId = newLedger.id;
      }

      // 2. Create Invoice
      const invNum = `INV-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random()*1000)}`;
      const { data: invoice, error: invError } = await supabase.from('invoices').insert([{
        invoice_number: invNum,
        ledger_id: ledgerId,
        total_amount: order.total_amount,
        subtotal: order.total_amount,
        status: 'Sent'
      }]).select().single();

      if (invError) throw invError;

      // 3. Create Invoice Items & Deduct Stock
      for (const item of order.consumer_order_items) {
        await supabase.from('invoice_items').insert([{
          invoice_id: invoice.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price_at_time,
          total_price: item.quantity * item.price_at_time
        }]);

        // Deduct stock (if product exists)
        const { data: prodData } = await supabase.from('products').select('current_stock').eq('id', item.product_id).single();
        if (prodData) {
          const newStock = Number(prodData.current_stock || 0) - item.quantity;
          await supabase.from('products').update({ current_stock: newStock }).eq('id', item.product_id);
        }
      }

      // 4. Mark Order as Approved
      await supabase.from('consumer_orders').update({ status: 'Approved' }).eq('id', order.id);
      setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'Approved' } : o));

      if (global.confirm && confirm('Order Approved! Do you want to view the generated Invoice?')) {
        navigation.navigate('InvoicePreview', { invoiceId: invoice.id });
      }

    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to approve order: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Pending Orders</Text>
      </View>

      <ScrollView style={styles.scroll}>
        {loading ? <ActivityIndicator color={theme.colors.primary} size="large" /> : (
          orders.map(order => {
            const isEditing = editingOrderId === order.id;
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.iconContainer}>
                    <Clock color={theme.colors.primary} size={24} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.customerName}>{order.customer_name}</Text>
                    <Text style={styles.customerPhone}>{order.customer_phone}</Text>
                  </View>
                  <View style={[styles.statusBadge, order.status === 'Approved' ? styles.badgeSuccess : order.status === 'Rejected' ? styles.badgeDanger : {}]}>
                    <Text style={[styles.statusText, order.status === 'Approved' ? styles.textSuccess : order.status === 'Rejected' ? styles.textDanger : {}]}>{order.status}</Text>
                  </View>
                </View>

                <View style={styles.itemsList}>
                  {isEditing ? (
                    editItems.map((item, idx) => (
                      <View key={idx} style={styles.itemRowEdit}>
                        <Text style={styles.itemText} numberOfLines={1}>{item.products?.name}</Text>
                        <TextInput 
                          style={styles.qtyInput}
                          value={item.quantity}
                          onChangeText={(t) => updateEditItemQty(idx, t)}
                          keyboardType="numeric"
                        />
                        <Text style={styles.itemPrice}>₹{(parseInt(item.quantity || 0) * item.price_at_time).toFixed(2)}</Text>
                      </View>
                    ))
                  ) : (
                    order.consumer_order_items?.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemText}>{item.quantity}x {item.products?.name}</Text>
                        <Text style={styles.itemPrice}>₹{(item.quantity * item.price_at_time).toFixed(2)}</Text>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.totalText}>Total: ₹{order.total_amount}</Text>
                  <Text style={styles.dateText}>{new Date(order.created_at).toLocaleString()}</Text>
                </View>

                {order.status === 'Pending' && (
                  <View style={styles.actionRow}>
                    {isEditing ? (
                      <>
                        <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.colors.textSecondary }]} onPress={() => setEditingOrderId(null)}>
                          <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={() => saveEdit(order)} disabled={isProcessing}>
                          <Save color="#FFF" size={18} />
                          <Text style={[styles.actionText, { color: '#FFF' }]}>Save</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.colors.danger }]} onPress={() => rejectOrder(order.id)} disabled={isProcessing}>
                          <X color={theme.colors.danger} size={18} />
                          <Text style={[styles.actionText, { color: theme.colors.danger }]}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.colors.text }]} onPress={() => startEdit(order)} disabled={isProcessing}>
                          <Edit2 color={theme.colors.text} size={18} />
                          <Text style={[styles.actionText, { color: theme.colors.text }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={() => approveAndInvoice(order)} disabled={isProcessing}>
                          <Check color="#FFF" size={18} />
                          <Text style={[styles.actionText, { color: '#FFF' }]}>Approve</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
        {orders.length === 0 && !loading && (
          <Text style={{color:'gray', textAlign:'center', marginTop: 20}}>No consumer orders found.</Text>
        )}
        <View style={{height: 50}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.l, paddingTop: theme.spacing.xl },
  backBtn: { marginRight: theme.spacing.m },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  scroll: { padding: theme.spacing.l },
  orderCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  orderHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 15, marginBottom: 15 },
  iconContainer: { padding: 10, backgroundColor: theme.colors.background, borderRadius: 8 },
  customerName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 18 },
  customerPhone: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  statusBadge: { backgroundColor: theme.colors.surfaceHighlight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeSuccess: { backgroundColor: theme.colors.primary + '30' },
  badgeDanger: { backgroundColor: theme.colors.danger + '30' },
  statusText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
  textSuccess: { color: theme.colors.primary },
  textDanger: { color: theme.colors.danger },
  itemsList: { marginBottom: 15 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  itemRowEdit: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  qtyInput: { backgroundColor: theme.colors.background, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 5, width: 50, height: 35, textAlign: 'center' },
  itemText: { color: theme.colors.text, fontSize: 14, flex: 1 },
  itemPrice: { color: theme.colors.textSecondary, fontSize: 14, width: 80, textAlign: 'right' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 18 },
  dateText: { color: theme.colors.textSecondary, fontSize: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, borderWidth: 1 },
  actionText: { marginLeft: 8, fontWeight: 'bold', fontSize: 12 }
});
