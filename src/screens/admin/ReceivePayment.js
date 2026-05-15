import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function ReceivePayment({ navigation }) {
  const [ledgers, setLedgers] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [amount, setAmount] = useState('');
  const [isPayment, setIsPayment] = useState(true); // true = Receive Payment, false = Create Order (Credit)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    const { data } = await supabase.from('ledgers').select('*').order('name');
    setLedgers(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedLedger || !amount) {
      if (global.alert) alert('Please select a ledger and enter an amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const numAmount = parseFloat(amount);
      const finalAmount = isPayment ? -Math.abs(numAmount) : Math.abs(numAmount);
      const newBalance = Number(selectedLedger.balance) + finalAmount;

      // 1. Update Ledger Balance
      const { error: ledgerError } = await supabase
        .from('ledgers')
        .update({ balance: newBalance })
        .eq('id', selectedLedger.id);
      
      if (ledgerError) throw ledgerError;

      // 2. Insert Order/Transaction Record
      const { error: orderError } = await supabase
        .from('orders')
        .insert([{ 
          ledger_id: selectedLedger.id, 
          total_amount: Math.abs(numAmount), 
          status: isPayment ? 'paid' : 'credit' 
        }]);

      if (orderError) throw orderError;

      if (global.alert) {
        alert(isPayment 
          ? `Payment received! WhatsApp alert: "Your payment of $${numAmount} has been received. Your new balance is $${newBalance}."` 
          : `Order created! WhatsApp alert: "A credit entry of $${numAmount} has been added. Your new balance is $${newBalance}."`);
      }

      setAmount('');
      setSelectedLedger(null);
      await fetchLedgers(); // Refresh balances
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to process transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, isPayment && styles.toggleActive]} 
            onPress={() => setIsPayment(true)}>
            <Text style={[styles.toggleText, isPayment && styles.toggleTextActive]}>Receive Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, !isPayment && styles.toggleActive]} 
            onPress={() => setIsPayment(false)}>
            <Text style={[styles.toggleText, !isPayment && styles.toggleTextActive]}>Create Order (Credit)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Select Ledger</Text>
        {loading ? <ActivityIndicator color={theme.colors.primary} /> : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {ledgers.map(l => (
              <TouchableOpacity 
                key={l.id} 
                style={[styles.ledgerChip, selectedLedger?.id === l.id && styles.ledgerChipActive]}
                onPress={() => setSelectedLedger(l)}>
                <Text style={[styles.ledgerChipText, selectedLedger?.id === l.id && styles.ledgerChipTextActive]}>
                  {l.name} (${l.balance})
                </Text>
              </TouchableOpacity>
            ))}
            {ledgers.length === 0 && <Text style={{color:'gray'}}>No ledgers found.</Text>}
          </ScrollView>
        )}

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Amount ($)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="0.00" 
            placeholderTextColor={theme.colors.textSecondary} 
            value={amount} 
            onChangeText={setAmount} 
            keyboardType="decimal-pad" 
          />
          
          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <CheckCircle color="#fff" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>{isPayment ? 'Record Payment' : 'Record Order'}</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.hint}>*Simulates sending automated WhatsApp alert to customer.</Text>
        </View>
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
  toggleContainer: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.m, padding: 4, marginBottom: theme.spacing.xl },
  toggleBtn: { flex: 1, padding: theme.spacing.m, alignItems: 'center', borderRadius: theme.borderRadius.s },
  toggleActive: { backgroundColor: theme.colors.primary },
  toggleText: { color: theme.colors.textSecondary, fontWeight: 'bold' },
  toggleTextActive: { color: '#FFF' },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: theme.spacing.m },
  ledgerChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginRight: 10 },
  ledgerChipActive: { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary },
  ledgerChipText: { color: theme.colors.text },
  ledgerChipTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
  formCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border },
  input: { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.m, padding: theme.spacing.l, color: theme.colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border, textAlign: 'center' },
  button: { flexDirection: 'row', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  hint: { color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 15, fontStyle: 'italic' }
});
