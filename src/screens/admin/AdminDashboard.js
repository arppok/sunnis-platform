import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { Users, FileText, TrendingUp, Settings, LogOut, BarChart2, Clock, Truck, Package, Zap, DollarSign, Activity } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard({ navigation }) {
  const [ledgers, setLedgers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ledgersResponse, ordersResponse, rawMatsResponse] = await Promise.all([
        supabase.from('ledgers').select('*'),
        supabase.from('orders').select('*, ledgers(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('raw_materials').select('*')
      ]);

      if (ledgersResponse.data) setLedgers(ledgersResponse.data);
      if (ordersResponse.data) setOrders(ordersResponse.data);
      
      if (rawMatsResponse.data) {
        const lowStock = rawMatsResponse.data.filter(m => m.current_stock < (m.minimum_stock || 10));
        setAlerts(lowStock);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const totalPending = ledgers.reduce((sum, ledger) => sum + Number(ledger.balance), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.title}>Admin Portal</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <LogOut color={theme.colors.primary} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Pending</Text>
            <Text style={styles.statValue}>${totalPending.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Ledgers</Text>
            <Text style={styles.statValue}>{ledgers.length}</Text>
          </View>
        </View>

        {alerts.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.danger }]}>⚠️ Smart Alerts</Text>
            {alerts.map(m => (
              <View key={m.id} style={{ backgroundColor: theme.colors.danger + '20', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.danger, marginBottom: 10 }}>
                <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>Low Stock: {m.name}</Text>
                <Text style={{ color: theme.colors.textSecondary }}>Only {m.current_stock} {m.unit} left (Minimum: {m.minimum_stock || 10}). Please reorder soon.</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={styles.analyticsHero} 
          onPress={() => navigation.navigate('FinancialAnalytics')}
        >
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
            <Activity color="#FFF" size={28} />
            <Text style={styles.analyticsHeroTitle}>Financial Analytics</Text>
          </View>
          <Text style={styles.analyticsHeroSub}>View real-time Profit & Loss breakdown</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Wholesale & Sales</Text>
        <View style={styles.grid}>
          <ActionCard icon={<Clock color={theme.colors.primary} size={32} />} title="Consumer Orders" onPress={() => navigation.navigate('PendingOrders')} />
          <ActionCard icon={<Users color={theme.colors.primary} size={32} />} title="Manage Ledgers" onPress={() => navigation.navigate('ManageLedgers')} />
          <ActionCard icon={<FileText color={theme.colors.primary} size={32} />} title="Create Invoice" onPress={() => navigation.navigate('CreateInvoice')} />
          <ActionCard icon={<FileText color={theme.colors.primary} size={32} />} title="View Invoices" onPress={() => navigation.navigate('ManageInvoices')} />
          <ActionCard icon={<TrendingUp color={theme.colors.primary} size={32} />} title="Receive Payment" onPress={() => navigation.navigate('ReceivePayment')} />
          <ActionCard icon={<Settings color={theme.colors.primary} size={32} />} title="Manage Store" onPress={() => navigation.navigate('ManageProducts')} />
          <ActionCard icon={<BarChart2 color={theme.colors.primary} size={32} />} title="Sales Reports" onPress={() => navigation.navigate('ReportsDashboard')} />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Factory Operations</Text>
        <View style={styles.grid}>
          <ActionCard icon={<Package color={theme.colors.primary} size={32} />} title="Warehouse Inventory" onPress={() => navigation.navigate('RawMaterials')} />
          <ActionCard icon={<Truck color={theme.colors.primary} size={32} />} title="Manage Vendors" onPress={() => navigation.navigate('ManageVendors')} />
          <ActionCard icon={<FileText color={theme.colors.primary} size={32} />} title="Purchase Entry" onPress={() => navigation.navigate('PurchaseEntry')} />
          <ActionCard icon={<Zap color={theme.colors.primary} size={32} />} title="Log Production" onPress={() => navigation.navigate('ManufacturingEntry')} />
          <ActionCard icon={<DollarSign color={theme.colors.primary} size={32} />} title="Costing Report" onPress={() => navigation.navigate('CostingReport')} />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>HR & Bookkeeping</Text>
        <View style={styles.grid}>
          <ActionCard icon={<Users color={theme.colors.primary} size={32} />} title="Manage Staff" onPress={() => navigation.navigate('ManageEmployees')} />
          <ActionCard icon={<Clock color={theme.colors.primary} size={32} />} title="Attendance & Wages" onPress={() => navigation.navigate('AttendanceWages')} />
          <ActionCard icon={<DollarSign color={theme.colors.primary} size={32} />} title="Factory Expenses" onPress={() => navigation.navigate('FactoryExpenses')} />
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {orders.map(order => (
            <ActivityItem 
              key={order.id} 
              title={`Order for ${order.ledgers?.name || 'Unknown'}`} 
              subtitle={`Amount: $${order.total_amount}`} 
              time={new Date(order.created_at).toLocaleDateString()} 
            />
          ))}
          {orders.length === 0 && <Text style={{color: 'gray'}}>No recent orders. Add a ledger and an order first!</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ActionCard = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    {icon}
    <Text style={styles.actionText}>{title}</Text>
  </TouchableOpacity>
);

const ActivityItem = ({ title, subtitle, time }) => (
  <View style={styles.activityItem}>
    <View style={styles.activityIndicator} />
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activitySubtitle}>{subtitle}</Text>
    </View>
    <Text style={styles.activityTime}>{time}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    paddingHorizontal: theme.spacing.l,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.l,
    paddingTop: theme.spacing.xl,
  },
  greeting: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoutBtn: {
    padding: theme.spacing.s
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.primary + '15',
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.m,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.xl,
  },
  actionCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionText: {
    color: theme.colors.text,
    marginTop: theme.spacing.s,
    fontWeight: '500',
    textAlign: 'center',
  },
  recentActivity: {
    marginBottom: 50,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.s,
  },
  activityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.m,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  activitySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  activityTime: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  }
});
