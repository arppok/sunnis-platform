import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { Users, FileText, TrendingUp, Settings, LogOut } from 'lucide-react-native';

export default function AdminDashboard({ navigation }) {
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
            <Text style={styles.statValue}>$45,230</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Ledgers</Text>
            <Text style={styles.statValue}>128</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <ActionCard icon={<Users color={theme.colors.primary} size={32} />} title="Manage Ledgers" />
          <ActionCard icon={<FileText color={theme.colors.primary} size={32} />} title="Invoices & Reports" />
          <ActionCard icon={<TrendingUp color={theme.colors.primary} size={32} />} title="Receive Payment" />
          <ActionCard icon={<Settings color={theme.colors.primary} size={32} />} title="App Settings" />
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <ActivityItem title="Payment Received" subtitle="John Doe paid $500" time="2m ago" />
          <ActivityItem title="Invoice Sent" subtitle="Sent to Tech Corp via WhatsApp" time="1h ago" />
          <ActivityItem title="New Ledger Added" subtitle="Sarah Smith registered" time="3h ago" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ActionCard = ({ icon, title }) => (
  <TouchableOpacity style={styles.actionCard}>
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
    padding: theme.spacing.l,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.m,
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
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.primary + '15', // 15% opacity
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
