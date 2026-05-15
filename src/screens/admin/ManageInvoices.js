import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, FileText, Send, Edit, Trash2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function ManageInvoices({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, ledgers(name, phone)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleForward = (invoice) => {
    const text = `Hello ${invoice.ledgers?.name},\n\nYour invoice ${invoice.invoice_number} has been generated.\nTotal Amount: $${invoice.total_amount}\n\nPlease let us know if you have any questions.\n\n- Sunnis Team`;
    
    // Simulate WhatsApp forwarding
    if (global.alert) {
      alert(`[WhatsApp Simulation]\n\nSending to ${invoice.ledgers?.phone || 'Customer'}:\n\n${text}`);
    }
    
    // In a real app on mobile:
    // Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}&phone=${invoice.ledgers?.phone}`);
  };

  const handleDelete = async (id) => {
    if (global.confirm && !confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      await fetchInvoices();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to delete invoice');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Invoices</Text>
      </View>

      <ScrollView style={styles.scroll}>
        {loading ? <ActivityIndicator color={theme.colors.primary} size="large" /> : (
          invoices.map(inv => (
            <View key={inv.id} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View style={styles.iconContainer}>
                  <FileText color={theme.colors.primary} size={24} />
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.invoiceNum}>{inv.invoice_number}</Text>
                  <Text style={styles.customerName}>{inv.ledgers?.name || 'Unknown Customer'}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{inv.status}</Text>
                </View>
              </View>

              <View style={styles.invoiceDetails}>
                <Text style={styles.amountText}>Total: ${inv.total_amount}</Text>
                <Text style={styles.dateText}>{new Date(inv.created_at).toLocaleDateString()}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { if(global.alert) alert('Modify feature coming soon! You can recreate the invoice for now.'); }}>
                  <Edit color={theme.colors.textSecondary} size={18} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleForward(inv)}>
                  <Send color={theme.colors.primary} size={18} />
                  <Text style={[styles.actionText, { color: theme.colors.primary }]}>Forward</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(inv.id)}>
                  <Trash2 color={theme.colors.danger} size={18} />
                  <Text style={[styles.actionText, { color: theme.colors.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        {invoices.length === 0 && !loading && (
          <Text style={{color:'gray', textAlign:'center', marginTop: 20}}>No invoices found.</Text>
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
  invoiceCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  invoiceHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 15, marginBottom: 15 },
  iconContainer: { padding: 10, backgroundColor: theme.colors.background, borderRadius: 8 },
  invoiceNum: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
  customerName: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  statusBadge: { backgroundColor: theme.colors.primary + '30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' },
  invoiceDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  amountText: { color: theme.colors.text, fontWeight: 'bold', fontSize: 18 },
  dateText: { color: theme.colors.textSecondary, fontSize: 14 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 5 },
  actionText: { color: theme.colors.textSecondary, marginLeft: 8, fontWeight: '500' }
});
