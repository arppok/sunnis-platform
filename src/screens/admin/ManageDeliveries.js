import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Truck, Package } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function ManageDeliveries({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get all drivers from profiles
      const { data: profilesResponse } = await supabase
        .from('profiles')
        .select('id, role');
      
      const driverProfiles = profilesResponse?.filter(p => p.role === 'Driver') || [];
      
      // Get all recent invoices
      const { data: invoicesResponse } = await supabase
        .from('invoices')
        .select('*, ledgers(name)')
        .order('created_at', { ascending: false })
        .limit(20);

      // Get all deliveries
      const { data: deliveriesResponse } = await supabase
        .from('deliveries')
        .select('*');

      setDrivers(driverProfiles);
      setInvoices(invoicesResponse || []);
      setDeliveries(deliveriesResponse || []);
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const assignDriver = async (invoiceId, driverId) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .insert([{ invoice_id: invoiceId, driver_id: driverId, status: 'Pending' }]);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to assign driver');
    }
  };

  if (loading) return <ActivityIndicator color={theme.colors.primary} style={{flex: 1, backgroundColor: theme.colors.background}} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 15}}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Dispatch Logistics</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.sectionTitle}>Assign Deliveries</Text>
        {invoices.map(invoice => {
          const existingDelivery = deliveries.find(d => d.invoice_id === invoice.id);
          
          return (
            <View key={invoice.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.invTitle}>INV: {invoice.invoice_number}</Text>
                <Text style={styles.customerName}>{invoice.ledgers?.name}</Text>
              </View>
              
              {existingDelivery ? (
                <View style={styles.statusBox}>
                  <Truck color={theme.colors.primary} size={16} style={{marginRight: 8}} />
                  <Text style={styles.statusText}>
                    Status: <Text style={{fontWeight: 'bold', color: theme.colors.primary}}>{existingDelivery.status}</Text>
                  </Text>
                </View>
              ) : (
                <View style={styles.assignBox}>
                  <Text style={{color: theme.colors.textSecondary, marginBottom: 10}}>Select Driver to Assign:</Text>
                  <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
                    {drivers.map(driver => (
                      <TouchableOpacity 
                        key={driver.id} 
                        style={styles.driverBtn}
                        onPress={() => assignDriver(invoice.id, driver.id)}
                      >
                        <Text style={styles.driverBtnText}>Assign {driver.id.substring(0,6)}</Text>
                      </TouchableOpacity>
                    ))}
                    {drivers.length === 0 && <Text style={{color: theme.colors.warning}}>No drivers found in system.</Text>}
                  </View>
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
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.l, paddingTop: theme.spacing.xl, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  scroll: { padding: theme.spacing.l },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.l, borderRadius: theme.borderRadius.l, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  invTitle: { color: theme.colors.textSecondary, fontWeight: 'bold' },
  customerName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
  statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, padding: 10, borderRadius: 8 },
  statusText: { color: theme.colors.textSecondary },
  assignBox: { backgroundColor: theme.colors.background, padding: 10, borderRadius: 8 },
  driverBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  driverBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 }
});
