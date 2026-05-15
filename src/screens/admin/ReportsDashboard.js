import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, BarChart2, Package } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function ReportsDashboard({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Monthly'); // Daily, Weekly, Monthly, Quarterly, Yearly
  const periods = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, itemsRes, prodRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('status', 'Sent'),
        supabase.from('invoice_items').select('*'),
        supabase.from('products').select('id, name')
      ]);
      
      setInvoices(invRes.data || []);
      setInvoiceItems(itemsRes.data || []);
      
      const prodMap = {};
      if (prodRes.data) {
        prodRes.data.forEach(p => prodMap[p.id] = p.name);
      }
      setProducts(prodMap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Filter Invoices by selected period
  const getFilteredInvoices = () => {
    const now = new Date();
    return invoices.filter(inv => {
      const d = new Date(inv.created_at);
      if (period === 'Daily') return d.toDateString() === now.toDateString();
      if (period === 'Weekly') {
        const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (period === 'Monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === 'Quarterly') {
        const quarter = Math.floor(now.getMonth() / 3);
        const invQuarter = Math.floor(d.getMonth() / 3);
        return quarter === invQuarter && d.getFullYear() === now.getFullYear();
      }
      if (period === 'Yearly') return d.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const filteredInvoices = getFilteredInvoices();
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const totalTax = filteredInvoices.reduce((sum, inv) => sum + Number(inv.tax_amount), 0);

  // 2. Calculate Item-wise Sales
  // We only count items that belong to the filtered invoices
  const validInvoiceIds = new Set(filteredInvoices.map(i => i.id));
  const validItems = invoiceItems.filter(item => validInvoiceIds.has(item.invoice_id));

  const itemStats = {};
  validItems.forEach(item => {
    if (!itemStats[item.product_id]) {
      itemStats[item.product_id] = { quantity: 0, revenue: 0 };
    }
    itemStats[item.product_id].quantity += item.quantity;
    itemStats[item.product_id].revenue += Number(item.total_price);
  });

  const sortedItems = Object.entries(itemStats)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([id, stats]) => ({ id, name: products[id] || 'Unknown Product', ...stats }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Sales Reports</Text>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {periods.map(p => (
            <TouchableOpacity key={p} style={[styles.tab, period === p && styles.tabActive]} onPress={() => setPeriod(p)}>
              <Text style={[styles.tabText, period === p && styles.tabTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll}>
        {loading ? <ActivityIndicator color={theme.colors.primary} size="large" /> : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <BarChart2 color={theme.colors.primary} size={28} />
                <Text style={styles.summaryTitle}>{period} Summary</Text>
              </View>
              <Text style={styles.revenueText}>${totalSales.toFixed(2)}</Text>
              <Text style={styles.taxText}>Includes ${totalTax.toFixed(2)} GST</Text>
              <Text style={styles.invoiceCount}>{filteredInvoices.length} Invoices Generated</Text>
            </View>

            <Text style={styles.sectionTitle}>Item-wise Sales</Text>
            {sortedItems.map(item => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemIcon}>
                  <Package color={theme.colors.textSecondary} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>{item.quantity} Units Sold</Text>
                </View>
                <Text style={styles.itemRevenue}>${item.revenue.toFixed(2)}</Text>
              </View>
            ))}
            {sortedItems.length === 0 && (
              <Text style={{color:'gray', textAlign:'center', marginTop: 20}}>No sales data for this period.</Text>
            )}
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
  tabContainer: { borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 10, paddingHorizontal: theme.spacing.l },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: theme.colors.surface },
  tabActive: { backgroundColor: theme.colors.primary },
  tabText: { color: theme.colors.textSecondary, fontWeight: 'bold' },
  tabTextActive: { color: '#FFF' },
  scroll: { padding: theme.spacing.l },
  summaryCard: { backgroundColor: theme.colors.primary + '15', padding: theme.spacing.xl, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.primary + '30', alignItems: 'center', marginBottom: theme.spacing.xl },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  summaryTitle: { color: theme.colors.primary, fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  revenueText: { color: theme.colors.primary, fontSize: 48, fontWeight: 'bold' },
  taxText: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 5 },
  invoiceCount: { color: theme.colors.text, fontSize: 16, marginTop: 15, fontWeight: '500' },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: theme.spacing.m },
  itemCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.s, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  itemIcon: { padding: 10, backgroundColor: theme.colors.background, borderRadius: 8, marginRight: 15 },
  itemName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
  itemQty: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  itemRevenue: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }
});
