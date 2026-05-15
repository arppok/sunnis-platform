import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, DollarSign } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function CostingReport({ navigation }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('production_batches')
        .select(`
          *,
          products (name, price)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Production Costing</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.sectionTitle}>Recent Manufacturing Batches</Text>
        
        {loading ? <ActivityIndicator color={theme.colors.primary} size="large" /> : (
          batches.map(batch => {
            const costPerUnit = batch.quantity_produced > 0 ? (Number(batch.total_estimated_cost) / batch.quantity_produced) : 0;
            const sellingPrice = Number(batch.products?.price) || 0;
            const profitMargin = sellingPrice - costPerUnit;
            const marginPercentage = sellingPrice > 0 ? ((profitMargin / sellingPrice) * 100).toFixed(1) : 0;
            
            return (
              <View key={batch.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <DollarSign color={theme.colors.primary} size={24} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.productName}>{batch.products?.name}</Text>
                    <Text style={styles.batchInfo}>{batch.batch_number} | {batch.quantity_produced} units</Text>
                  </View>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>{new Date(batch.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Cost / Unit</Text>
                    <Text style={[styles.metricValue, { color: theme.colors.danger }]}>${costPerUnit.toFixed(2)}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Retail Price</Text>
                    <Text style={styles.metricValue}>${sellingPrice.toFixed(2)}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Profit / Unit</Text>
                    <Text style={[styles.metricValue, { color: profitMargin >= 0 ? theme.colors.primary : theme.colors.danger }]}>
                      ${profitMargin.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Total Batch Cost: ${Number(batch.total_estimated_cost).toFixed(2)}</Text>
                  <Text style={[styles.marginText, { color: profitMargin >= 0 ? theme.colors.primary : theme.colors.danger }]}>
                    Margin: {marginPercentage}%
                  </Text>
                </View>
              </View>
            );
          })
        )}
        
        {batches.length === 0 && !loading && (
          <Text style={{color:'gray', textAlign:'center', marginTop: 20}}>No production batches logged yet.</Text>
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
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: theme.spacing.m },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 15, marginBottom: 15 },
  iconContainer: { padding: 10, backgroundColor: theme.colors.background, borderRadius: 8 },
  productName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 18 },
  batchInfo: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  dateBadge: { backgroundColor: theme.colors.surfaceHighlight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dateText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  metric: { alignItems: 'center' },
  metricLabel: { color: theme.colors.textSecondary, fontSize: 12, marginBottom: 4 },
  metricValue: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 15 },
  footerText: { color: theme.colors.textSecondary, fontWeight: '500' },
  marginText: { fontWeight: 'bold' }
});
