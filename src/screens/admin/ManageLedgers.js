import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function ManageLedgers({ navigation }) {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gst, setGst] = useState('');
  const [address, setAddress] = useState('');
  const [ledgerGroup, setLedgerGroup] = useState('Consumer'); // Consumer or Supplier
  
  const groups = ['Consumer', 'Supplier'];
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    try {
      const { data, error } = await supabase.from('ledgers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setLedgers(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName(''); setPhone(''); setEmail(''); setGst(''); setAddress(''); setLedgerGroup('Consumer');
  };

  const handleEdit = (ledger) => {
    setEditingId(ledger.id);
    setName(ledger.name || '');
    setPhone(ledger.phone || '');
    setEmail(ledger.email || '');
    setGst(ledger.gst || '');
    setAddress(ledger.address || '');
    setLedgerGroup(ledger.ledger_group || 'Consumer');
  };

  const handleSaveLedger = async () => {
    if (!name.trim()) {
      if (global.alert) alert('Please enter a ledger name');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = { 
        name, 
        phone, 
        email, 
        gst: gst.trim(), 
        address, 
        ledger_group: ledgerGroup 
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase.from('ledgers').update(payload).eq('id', editingId);
        if (error) throw error;
        if (global.alert) alert('Ledger updated successfully!');
      } else {
        // Insert new
        const { error } = await supabase.from('ledgers').insert([{ ...payload, balance: 0 }]);
        if (error) throw error;
        if (global.alert) alert('Ledger created successfully!');
      }
      
      resetForm();
      await fetchLedgers();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to save ledger. Did you run the SQL script to add the new columns?');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (global.confirm && !confirm('Are you sure you want to delete this ledger?')) return;
    
    try {
      const { error } = await supabase.from('ledgers').delete().eq('id', id);
      if (error) throw error;
      await fetchLedgers();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Ledgers</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.formCard}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.m}}>
            <Text style={styles.sectionTitle}>{editingId ? 'Edit Ledger' : 'Add New Ledger'}</Text>
            {editingId && (
              <TouchableOpacity onPress={resetForm} style={styles.cancelBtn}>
                <X color={theme.colors.danger} size={18} />
                <Text style={{color: theme.colors.danger, marginLeft: 5}}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>Group Type:</Text>
          <View style={styles.typeRow}>
            {groups.map(g => (
              <TouchableOpacity key={g} style={[styles.chip, ledgerGroup === g && styles.chipActive]} onPress={() => setLedgerGroup(g)}>
                <Text style={[styles.chipText, ledgerGroup === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput style={styles.input} placeholder="Full Name or Business" placeholderTextColor={theme.colors.textSecondary} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor={theme.colors.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Email (optional)" placeholderTextColor={theme.colors.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="GST Number (optional)" placeholderTextColor={theme.colors.textSecondary} value={gst} onChangeText={setGst} autoCapitalize="characters" />
          <TextInput style={[styles.input, {height: 80}]} placeholder="Address (optional)" placeholderTextColor={theme.colors.textSecondary} value={address} onChangeText={setAddress} multiline={true} textAlignVertical="top" />
          
          <TouchableOpacity style={styles.button} onPress={handleSaveLedger} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : (
              <>
                {editingId ? <Save color="#fff" size={20} style={{ marginRight: 8 }} /> : <Plus color="#fff" size={20} style={{ marginRight: 8 }} />}
                <Text style={styles.buttonText}>{editingId ? 'Update Ledger' : 'Create Ledger'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Existing Ledgers</Text>
        {loading ? <ActivityIndicator color={theme.colors.primary} /> : (
          ledgers.map(ledger => (
            <View key={ledger.id} style={styles.ledgerCard}>
              <View style={{ flex: 1 }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.ledgerName}>{ledger.name}</Text>
                  <View style={styles.groupBadge}>
                    <Text style={styles.groupText}>{ledger.ledger_group || 'Consumer'}</Text>
                  </View>
                </View>
                <Text style={styles.ledgerContact}>{ledger.phone || 'No phone'} | Balance: ${ledger.balance}</Text>
                {ledger.gst ? <Text style={styles.ledgerContact}>GST: {ledger.gst}</Text> : null}
                {ledger.address ? <Text style={styles.ledgerContact}>{ledger.address}</Text> : null}
              </View>
              <View style={{flexDirection: 'row', gap: 15, alignItems: 'center'}}>
                <TouchableOpacity onPress={() => handleEdit(ledger)}>
                  <Edit2 color={theme.colors.primary} size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(ledger.id)}>
                  <Trash2 color={theme.colors.danger} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        {ledgers.length === 0 && !loading && <Text style={{color:'gray'}}>No ledgers yet.</Text>}
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
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', padding: 5, borderWidth: 1, borderColor: theme.colors.danger, borderRadius: 5 },
  label: { color: theme.colors.textSecondary, marginBottom: 8 },
  typeRow: { flexDirection: 'row', marginBottom: 15 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, marginRight: 10 },
  chipActive: { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
  input: { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, color: theme.colors.text, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  button: { flexDirection: 'row', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  ledgerCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.s, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  ledgerName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16, marginRight: 10 },
  groupBadge: { backgroundColor: theme.colors.surfaceHighlight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  groupText: { color: theme.colors.textSecondary, fontSize: 10 },
  ledgerContact: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 }
});
