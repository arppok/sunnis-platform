import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function ManageLedgers({ navigation }) {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
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

  const handleAddLedger = async () => {
    if (!name.trim()) {
      if (global.alert) alert('Please enter a ledger name');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('ledgers').insert([{ name, phone, email, balance: 0 }]);
      if (error) throw error;
      
      setName(''); setPhone(''); setEmail('');
      await fetchLedgers();
      if (global.alert) alert('Ledger added successfully!');
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to add ledger');
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
          <Text style={styles.sectionTitle}>Add New Ledger</Text>
          <TextInput style={styles.input} placeholder="Full Name or Business" placeholderTextColor={theme.colors.textSecondary} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor={theme.colors.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Email (optional)" placeholderTextColor={theme.colors.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" />
          
          <TouchableOpacity style={styles.button} onPress={handleAddLedger} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <Plus color="#fff" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Create Ledger</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Existing Ledgers</Text>
        {loading ? <ActivityIndicator color={theme.colors.primary} /> : (
          ledgers.map(ledger => (
            <View key={ledger.id} style={styles.ledgerCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ledgerName}>{ledger.name}</Text>
                <Text style={styles.ledgerContact}>{ledger.phone || 'No phone'} | Balance: ${ledger.balance}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(ledger.id)}>
                <Trash2 color={theme.colors.danger} size={20} />
              </TouchableOpacity>
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
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: theme.spacing.m },
  input: { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, color: theme.colors.text, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  button: { flexDirection: 'row', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  ledgerCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.s, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  ledgerName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
  ledgerContact: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 }
});
