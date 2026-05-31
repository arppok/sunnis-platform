import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function FinancialAnalytics({ navigation }) {
  const [loading, setLoading] = useState(true);
  
  // Metrics
  const [revenue, setRevenue] = useState(0);
  const [purchases, setPurchases] = useState(0);
  const [wages, setWages] = useState(0);
  const [overhead, setOverhead] = useState(0);

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    try {
      // Fetch Revenue (Wholesale Invoices + Consumer Orders)
      const { data: invoices } = await supabase.from('invoices').select('total_amount');
      const { data: orders } = await supabase.from('consumer_orders').select('total_amount').eq('status', 'Approved');
      
      const invoiceRev = invoices?.reduce((sum, i) => sum + Number(i.total_amount || 0), 0) || 0;
      const orderRev = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
      setRevenue(invoiceRev + orderRev);

      // Fetch Expenses
      const { data: purchaseBills } = await supabase.from('purchase_bills').select('total_amount');
      const purchaseCost = purchaseBills?.reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0;
      setPurchases(purchaseCost);

      const { data: wagePayments } = await supabase.from('wage_payments').select('amount');
      const wageCost = wagePayments?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;
      setWages(wageCost);

      const { data: factoryExpenses } = await supabase.from('factory_expenses').select('amount');
      const overheadCost = factoryExpenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
      setOverhead(overheadCost);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = purchases + wages + overhead;
  const netProfit = revenue - totalExpenses;
  const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Financial Analytics</Text>
      </View>

      <ScrollView style={styles.scroll}>
        {loading ? <ActivityIndicator color={theme.colors.primary} size="large" style={{marginTop: 50}} /> : (
          <>
            {/* Master Net Profit Card */}
            <View style={[styles.masterCard, { borderColor: netProfit >= 0 ? theme.colors.primary : theme.colors.danger }]}>
              <Text style={styles.masterLabel}>ALL-TIME NET PROFIT</Text>
              <Text style={[styles.masterAmount, { color: netProfit >= 0 ? theme.colors.primary : theme.colors.danger }]}>
                ${netProfit.toFixed(2)}
              </Text>
              <View style={styles.marginBadge}>
                <Text style={styles.marginText}>Net Margin: {margin}%</Text>
              </View>
            </View>

            {/* Top Level Summary Row */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <View style={styles.iconCircle}><TrendingUp color={theme.colors.primary} size={20} /></View>
                <Text style={styles.boxLabel}>Gross Revenue</Text>
                <Text style={styles.boxValue}>${revenue.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryBox}>
                <View style={[styles.iconCircle, {backgroundColor: theme.colors.danger + '20'}]}><TrendingDown color={theme.colors.danger} size={20} /></View>
                <Text style={styles.boxLabel}>Total Expenses</Text>
                <Text style={styles.boxValue}>${totalExpenses.toFixed(2)}</Text>
              </View>
            </View>

            {/* Expense Breakdown */}
            <Text style={styles.sectionTitle}>Expense Breakdown</Text>
            <View style={styles.breakdownCard}>
              
              <View style={styles.barContainer}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barLabel}>Raw Materials & Purchases</Text>
                  <Text style={styles.barAmount}>${purchases.toFixed(2)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { backgroundColor: '#F59E0B', width: totalExpenses > 0 ? `${(purchases/totalExpenses)*100}%` : '0%' }]} />
                </View>
              </View>

              <View style={styles.barContainer}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barLabel}>Factory Labor & Wages</Text>
                  <Text style={styles.barAmount}>${wages.toFixed(2)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { backgroundColor: '#3B82F6', width: totalExpenses > 0 ? `${(wages/totalExpenses)*100}%` : '0%' }]} />
                </View>
              </View>

              <View style={styles.barContainer}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barLabel}>General Overhead</Text>
                  <Text style={styles.barAmount}>${overhead.toFixed(2)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { backgroundColor: '#8B5CF6', width: totalExpenses > 0 ? `${(overhead/totalExpenses)*100}%` : '0%' }]} />
                </View>
              </View>

            </View>
          </>
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
  
  masterCard: { backgroundColor: theme.colors.surfaceHighlight, padding: 30, borderRadius: theme.borderRadius.xl, alignItems: 'center', marginBottom: 20, borderWidth: 2 },
  masterLabel: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  masterAmount: { fontSize: 48, fontWeight: 'bold', marginBottom: 15 },
  marginBadge: { backgroundColor: theme.colors.background, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  marginText: { color: theme.colors.text, fontWeight: 'bold' },

  summaryRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  summaryBox: { flex: 1, backgroundColor: theme.colors.surface, padding: 20, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  boxLabel: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 5 },
  boxValue: { color: theme.colors.text, fontSize: 22, fontWeight: 'bold' },

  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  breakdownCard: { backgroundColor: theme.colors.surface, padding: 20, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border },
  barContainer: { marginBottom: 20 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '500' },
  barAmount: { color: theme.colors.textSecondary, fontSize: 14 },
  barTrack: { height: 12, backgroundColor: theme.colors.background, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 }
});
