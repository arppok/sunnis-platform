import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Plus, DollarSign } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function FactoryExpenses({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [category, setCategory] = useState('Electricity');
  const categories = ['Electricity', 'Rent', 'Maintenance', 'Misc'];
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase.from('factory_expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!amount) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('factory_expenses').insert([{ 
        category, 
        amount: parseFloat(amount),
        description
      }]);
      if (error) throw error;
      
      setAmount(''); setDescription('');
      await fetchExpenses();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to log expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalOverhead = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft color={theme.colors.text} size={24} /></TouchableOpacity>
        <Text style={styles.title}>Overhead Expenses</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Log New Expense</Text>
          
          <Text style={styles.label}>Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
            <View style={styles.typeRow}>
              {categories.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TextInput style={styles.input} placeholder="Amount ($)" placeholderTextColor={theme.colors.textSecondary} value={amount} onChangeText={setAmount} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Description (e.g., Fixed Mixer #3)" placeholderTextColor={theme.colors.textSecondary} value={description} onChangeText={setDescription} />
          
          <TouchableOpacity style={styles.button} onPress={handleAddExpense} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : (
              <><Plus color="#fff" size={20} style={{ marginRight: 8 }} /><Text style={styles.buttonText}>Log Expense</Text></>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Logged Overhead:</Text>
          <Text style={styles.summaryValue}>${totalOverhead.toFixed(2)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Expense History</Text>
        {loading ? <ActivityIndicator color={theme.colors.primary} /> : (
          expenses.map(exp => (
            <View key={exp.id} style={styles.expenseCard}>
              <View style={styles.iconContainer}><DollarSign color={theme.colors.danger} size={20} /></View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.expCategory}>{exp.category}</Text>
                <Text style={styles.expDesc}>{exp.description || 'No description'}</Text>
                <Text style={styles.expDate}>{new Date(exp.date).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.expAmount}>${exp.amount}</Text>
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
  formCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.l },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: theme.spacing.m },
  input: { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, color: theme.colors.text, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  label: { color: theme.colors.textSecondary, marginBottom: 8 },
  typeRow: { flexDirection: 'row' },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, marginRight: 10 },
  chipActive: { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
  button: { flexDirection: 'row', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  summaryCard: { backgroundColor: theme.colors.primary + '15', padding: 20, borderRadius: theme.borderRadius.l, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: theme.colors.primary + '50' },
  summaryLabel: { color: theme.colors.text, fontSize: 16, marginBottom: 5 },
  summaryValue: { color: theme.colors.primary, fontSize: 28, fontWeight: 'bold' },
  expenseCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.s, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  iconContainer: { padding: 10, backgroundColor: theme.colors.background, borderRadius: 8 },
  expCategory: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
  expDesc: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  expDate: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 4 },
  expAmount: { color: theme.colors.danger, fontWeight: 'bold', fontSize: 16 }
});
