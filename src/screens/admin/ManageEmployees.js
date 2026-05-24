import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function ManageEmployees({ navigation }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('employees').insert([{ 
        name, 
        phone, 
        role,
        daily_wage: parseFloat(dailyWage) || 0
      }]);
      if (error) throw error;
      
      setName(''); setPhone(''); setRole(''); setDailyWage('');
      await fetchEmployees();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to add employee. Check DB schema.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (global.confirm && !confirm('Delete this employee?')) return;
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      await fetchEmployees();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft color={theme.colors.text} size={24} /></TouchableOpacity>
        <Text style={styles.title}>Manage Employees</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Add New Staff Member</Text>
          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={theme.colors.textSecondary} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor={theme.colors.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Role (e.g., Grinder, Packer)" placeholderTextColor={theme.colors.textSecondary} value={role} onChangeText={setRole} />
          <TextInput style={styles.input} placeholder="Daily Wage (e.g., 50)" placeholderTextColor={theme.colors.textSecondary} value={dailyWage} onChangeText={setDailyWage} keyboardType="numeric" />
          
          <TouchableOpacity style={styles.button} onPress={handleAddEmployee} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : (
              <><Plus color="#fff" size={20} style={{ marginRight: 8 }} /><Text style={styles.buttonText}>Save Employee</Text></>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Current Staff List</Text>
        {loading ? <ActivityIndicator color={theme.colors.primary} /> : (
          employees.map(emp => (
            <View key={emp.id} style={styles.employeeCard}>
              <View style={styles.iconContainer}><Users color={theme.colors.primary} size={20} /></View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.empName}>{emp.name}</Text>
                <Text style={styles.empDetails}>{emp.role} | {emp.phone || 'No phone'}</Text>
              </View>
              <View style={styles.wageBadge}>
                <Text style={styles.wageText}>${emp.daily_wage}/day</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(emp.id)} style={{ marginLeft: 15 }}>
                <Trash2 color={theme.colors.danger} size={20} />
              </TouchableOpacity>
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
  button: { flexDirection: 'row', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  employeeCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.s, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  iconContainer: { padding: 10, backgroundColor: theme.colors.background, borderRadius: 8 },
  empName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
  empDetails: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  wageBadge: { backgroundColor: theme.colors.primary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  wageText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 12 }
});
