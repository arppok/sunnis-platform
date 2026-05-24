import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function AttendanceWages({ navigation }) {
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State (simulated via inline UI)
  const [paymentAmount, setPaymentAmount] = useState('');
  const [payingEmpId, setPayingEmpId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [empRes, attRes, payRes] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('attendance').select('*'),
      supabase.from('wage_payments').select('*')
    ]);
    
    setEmployees(empRes.data || []);
    setAttendances(attRes.data || []);
    setPayments(payRes.data || []);
    setLoading(false);
  };

  const markAttendance = async (empId, status) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const existing = attendances.find(a => a.employee_id === empId && a.date === today);
      
      if (existing) {
        await supabase.from('attendance').update({ status }).eq('id', existing.id);
      } else {
        await supabase.from('attendance').insert([{ employee_id: empId, date: today, status }]);
      }
      
      await fetchData();
      if (global.alert) alert(`Marked ${status}`);
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to mark attendance');
    }
  };

  const handlePayment = async () => {
    if (!payingEmpId || !paymentAmount) return;
    try {
      const { error } = await supabase.from('wage_payments').insert([{ 
        employee_id: payingEmpId, 
        amount: parseFloat(paymentAmount)
      }]);
      if (error) throw error;
      
      setPayingEmpId(null);
      setPaymentAmount('');
      await fetchData();
      if (global.alert) alert('Payment logged successfully');
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to log payment');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft color={theme.colors.text} size={24} /></TouchableOpacity>
        <Text style={styles.title}>Attendance & Wages</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.sectionTitle}>Today: {new Date().toLocaleDateString()}</Text>
        
        {loading ? <ActivityIndicator color={theme.colors.primary} /> : (
          employees.map(emp => {
            // Calculate Wages
            const empAttendances = attendances.filter(a => a.employee_id === emp.id);
            const fullDays = empAttendances.filter(a => a.status === 'Present').length;
            const halfDays = empAttendances.filter(a => a.status === 'Half-Day').length;
            const totalEarned = (fullDays + (halfDays * 0.5)) * Number(emp.daily_wage);
            
            const empPayments = payments.filter(p => p.employee_id === emp.id);
            const totalPaid = empPayments.reduce((sum, p) => sum + Number(p.amount), 0);
            
            const balanceOwed = totalEarned - totalPaid;
            
            // Today's Status
            const todayStatus = empAttendances.find(a => a.date === today)?.status || 'Unmarked';
            
            return (
              <View key={emp.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.empName}>{emp.name}</Text>
                    <Text style={styles.empRole}>{emp.role} | ${emp.daily_wage}/day</Text>
                  </View>
                  <View style={styles.balanceBadge}>
                    <Text style={styles.balanceLabel}>Owed Balance</Text>
                    <Text style={[styles.balanceAmount, { color: balanceOwed > 0 ? theme.colors.danger : theme.colors.primary }]}>
                      ${balanceOwed.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionSection}>
                  <Text style={styles.actionLabel}>Today's Attendance: {todayStatus}</Text>
                  <View style={styles.attendanceRow}>
                    <TouchableOpacity style={[styles.attBtn, {borderColor: theme.colors.primary}]} onPress={() => markAttendance(emp.id, 'Present')}>
                      <CheckCircle color={theme.colors.primary} size={18} /><Text style={styles.attText}>Present</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.attBtn, {borderColor: theme.colors.secondary}]} onPress={() => markAttendance(emp.id, 'Half-Day')}>
                      <Clock color={theme.colors.secondary} size={18} /><Text style={styles.attText}>Half-Day</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.attBtn, {borderColor: theme.colors.danger}]} onPress={() => markAttendance(emp.id, 'Absent')}>
                      <XCircle color={theme.colors.danger} size={18} /><Text style={styles.attText}>Absent</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {payingEmpId === emp.id ? (
                  <View style={styles.paymentBox}>
                    <TextInput style={styles.payInput} placeholder="Amount to Pay" placeholderTextColor="#666" value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="numeric" />
                    <TouchableOpacity style={styles.payBtnConfirm} onPress={handlePayment}><Text style={{color:'#fff', fontWeight:'bold'}}>Save</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.payBtnCancel} onPress={() => setPayingEmpId(null)}><Text style={{color:theme.colors.danger}}>Cancel</Text></TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.payBtnOpen} onPress={() => setPayingEmpId(emp.id)}>
                    <DollarSign color="#fff" size={16} style={{marginRight:5}} />
                    <Text style={{color:'#fff', fontWeight:'bold'}}>Log Payment</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
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
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: theme.spacing.m },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.l },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 15, marginBottom: 15 },
  empName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 18 },
  empRole: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  balanceBadge: { alignItems: 'flex-end' },
  balanceLabel: { color: theme.colors.textSecondary, fontSize: 12 },
  balanceAmount: { fontWeight: 'bold', fontSize: 18 },
  actionSection: { marginBottom: 15 },
  actionLabel: { color: theme.colors.text, marginBottom: 10, fontWeight: '500' },
  attendanceRow: { flexDirection: 'row', gap: 10 },
  attBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  attText: { color: theme.colors.text, marginLeft: 5, fontSize: 12 },
  paymentBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, padding: 10, borderRadius: 8 },
  payInput: { flex: 1, backgroundColor: theme.colors.surface, color: theme.colors.text, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 5, borderWidth: 1, borderColor: theme.colors.border, marginRight: 10 },
  payBtnConfirm: { backgroundColor: theme.colors.primary, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 5, marginRight: 10 },
  payBtnCancel: { paddingHorizontal: 10, paddingVertical: 10 },
  payBtnOpen: { flexDirection: 'row', backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }
});
