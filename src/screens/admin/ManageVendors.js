import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Plus, Trash2, Truck } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function ManageVendors({ navigation }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [supplierType, setSupplierType] = useState('Spice'); // Spice, Packaging, Other
  const [expandedVendorId, setExpandedVendorId] = useState(null);
  const types = ['Spice', 'Packaging', 'Other'];
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase.from('vendors').select(`
        *,
        purchase_bills(id, bill_number, total_amount, date)
      `).order('created_at', { ascending: false });
      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async () => {
    if (!name.trim()) {
      if (global.alert) alert('Please enter a vendor name');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('vendors').insert([{ name, phone, supplier_type: supplierType }]);
      if (error) throw error;
      
      setName(''); setPhone('');
      await fetchVendors();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to add vendor. Check database schema.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (global.confirm && !confirm('Delete this vendor?')) return;
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', id);
      if (error) throw error;
      await fetchVendors();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft color={theme.colors.text} size={24} /></TouchableOpacity>
        <Text style={styles.title}>Manage Vendors</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Add New Vendor</Text>
          <TextInput style={styles.input} placeholder="Vendor Company Name" placeholderTextColor={theme.colors.textSecondary} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor={theme.colors.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          
          <Text style={styles.label}>Supplier Type:</Text>
          <View style={styles.typeRow}>
            {types.map(t => (
              <TouchableOpacity key={t} style={[styles.typeChip, supplierType === t && styles.typeChipActive]} onPress={() => setSupplierType(t)}>
                <Text style={[styles.typeText, supplierType === t && styles.typeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleAddVendor} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : (
              <><Plus color="#fff" size={20} style={{ marginRight: 8 }} /><Text style={styles.buttonText}>Save Vendor</Text></>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Vendor List</Text>
        {loading ? <ActivityIndicator color={theme.colors.primary} /> : (
          vendors.map(vendor => (
            <View key={vendor.id} style={styles.vendorCardWrapper}>
              <TouchableOpacity style={styles.vendorCard} onPress={() => setExpandedVendorId(expandedVendorId === vendor.id ? null : vendor.id)}>
                <View style={styles.iconContainer}><Truck color={theme.colors.primary} size={20} /></View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.vendorName}>{vendor.name}</Text>
                  <Text style={styles.vendorDetails}>{vendor.supplier_type} | {vendor.phone || 'No phone'}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(vendor.id)}>
                  <Trash2 color={theme.colors.danger} size={20} />
                </TouchableOpacity>
              </TouchableOpacity>
              
              {expandedVendorId === vendor.id && (
                <View style={styles.expandedSection}>
                  <Text style={styles.billsTitle}>Bills History</Text>
                  {vendor.purchase_bills && vendor.purchase_bills.length > 0 ? (
                    vendor.purchase_bills.map(bill => (
                      <View key={bill.id} style={styles.billRow}>
                        <View>
                          <Text style={styles.billNo}>{bill.bill_number}</Text>
                          <Text style={styles.billDate}>{new Date(bill.date).toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.billAmount}>₹{Number(bill.total_amount).toFixed(2)}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noBillsText}>No bills recorded for this vendor.</Text>
                  )}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Payable:</Text>
                    <Text style={styles.totalValue}>
                      ₹{(vendor.purchase_bills?.reduce((acc, b) => acc + Number(b.total_amount), 0) || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
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
  typeRow: { flexDirection: 'row', marginBottom: 15 },
  typeChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, marginRight: 10 },
  typeChipActive: { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary },
  typeText: { color: theme.colors.textSecondary },
  typeTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
  button: { flexDirection: 'row', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  vendorCardWrapper: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.s, borderWidth: 1, borderColor: theme.colors.border },
  vendorCard: { flexDirection: 'row', padding: theme.spacing.m, alignItems: 'center' },
  iconContainer: { padding: 10, backgroundColor: theme.colors.background, borderRadius: 8 },
  vendorName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
  vendorDetails: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  expandedSection: { padding: theme.spacing.m, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background + '50' },
  billsTitle: { color: theme.colors.text, fontWeight: 'bold', marginBottom: 10 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  billNo: { color: theme.colors.text, fontSize: 14 },
  billDate: { color: theme.colors.textSecondary, fontSize: 12 },
  billAmount: { color: theme.colors.text, fontWeight: 'bold' },
  noBillsText: { color: theme.colors.textSecondary, fontStyle: 'italic', marginBottom: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  totalLabel: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
  totalValue: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 18 }
});
