import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { LogOut, MapPin, Package, CheckCircle, Truck } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function DriverDashboard({ navigation }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          invoices (
            invoice_number,
            total_amount,
            ledgers (name, address, phone)
          )
        `)
        .eq('driver_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Error fetching deliveries');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ status: newStatus, delivered_at: newStatus === 'Delivered' ? new Date().toISOString() : null })
        .eq('id', id);

      if (error) throw error;
      fetchDeliveries();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Error updating status');
    }
  };

  if (loading) return <ActivityIndicator color={theme.colors.primary} style={{flex: 1, backgroundColor: theme.colors.background}} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Logistics Portal</Text>
          <Text style={styles.title}>My Deliveries</Text>
        </View>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <LogOut color={theme.colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {deliveries.length === 0 && (
          <Text style={{color: 'gray', textAlign: 'center', marginTop: 50}}>No assigned deliveries. Take a break!</Text>
        )}

        {deliveries.map(d => {
          const invoice = d.invoices || {};
          const customer = invoice.ledgers || {};
          
          return (
            <View key={d.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.invNumber}>INV: {invoice.invoice_number}</Text>
                <View style={[styles.badge, {backgroundColor: d.status === 'Delivered' ? theme.colors.success + '30' : theme.colors.primary + '30'}]}>
                  <Text style={[styles.badgeText, {color: d.status === 'Delivered' ? theme.colors.success : theme.colors.primary}]}>{d.status}</Text>
                </View>
              </View>

              <Text style={styles.customerName}>{customer.name}</Text>
              
              <View style={styles.infoRow}>
                <MapPin color={theme.colors.textSecondary} size={16} />
                <Text style={styles.infoText}>{customer.address || 'No Address Provided'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Package color={theme.colors.textSecondary} size={16} />
                <Text style={styles.infoText}>₹{invoice.total_amount} to collect (if COD)</Text>
              </View>

              {d.delivery_notes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>Notes: {d.delivery_notes}</Text>
                </View>
              )}

              {d.status !== 'Delivered' && (
                <View style={styles.actionRow}>
                  {d.status === 'Pending' && (
                    <TouchableOpacity style={styles.outBtn} onPress={() => updateStatus(d.id, 'Out for Delivery')}>
                      <Truck color="#FFF" size={18} />
                      <Text style={styles.btnText}>Start Delivery</Text>
                    </TouchableOpacity>
                  )}
                  {d.status === 'Out for Delivery' && (
                    <TouchableOpacity style={styles.doneBtn} onPress={() => updateStatus(d.id, 'Delivered')}>
                      <CheckCircle color="#FFF" size={18} />
                      <Text style={styles.btnText}>Mark Delivered</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
        <View style={{height: 50}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.l, paddingTop: theme.spacing.xl },
  greeting: { color: theme.colors.textSecondary, fontSize: 16 },
  title: { color: theme.colors.primary, fontSize: 28, fontWeight: 'bold' },
  scroll: { padding: theme.spacing.l },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.l, borderRadius: theme.borderRadius.l, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  invNumber: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: 'bold' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  customerName: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { color: theme.colors.textSecondary, fontSize: 14, marginLeft: 8, flex: 1 },
  notesBox: { backgroundColor: theme.colors.background, padding: 10, borderRadius: 8, marginTop: 10 },
  notesText: { color: theme.colors.warning, fontSize: 12, fontStyle: 'italic' },
  actionRow: { marginTop: 15, flexDirection: 'row', gap: 10 },
  outBtn: { flex: 1, backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8 },
  doneBtn: { flex: 1, backgroundColor: theme.colors.success, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8 },
  btnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 }
});
