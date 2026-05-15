import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Clock, Check, X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function PendingOrders({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Fetch consumer orders with their items and related product details
      const { data, error } = await supabase
        .from('consumer_orders')
        .select(`
          *,
          consumer_order_items (
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

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('consumer_orders').update({ status }).eq('id', id);
      if (error) throw error;
      
      // Update local state
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to update status');
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
          orders.map(order => (
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
                {order.consumer_order_items?.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemText}>{item.quantity}x {item.products?.name}</Text>
                    <Text style={styles.itemPrice}>${(item.quantity * item.price_at_time).toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.totalText}>Total: ${order.total_amount}</Text>
                <Text style={styles.dateText}>{new Date(order.created_at).toLocaleString()}</Text>
              </View>

              {order.status === 'Pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.colors.danger }]} onPress={() => updateStatus(order.id, 'Rejected')}>
                    <X color={theme.colors.danger} size={18} />
                    <Text style={[styles.actionText, { color: theme.colors.danger }]}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={() => updateStatus(order.id, 'Approved')}>
                    <Check color="#FFF" size={18} />
                    <Text style={[styles.actionText, { color: '#FFF' }]}>Approve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
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
  itemText: { color: theme.colors.text, fontSize: 14 },
  itemPrice: { color: theme.colors.textSecondary, fontSize: 14 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 18 },
  dateText: { color: theme.colors.textSecondary, fontSize: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, borderWidth: 1 },
  actionText: { marginLeft: 8, fontWeight: 'bold' }
});
