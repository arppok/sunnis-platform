import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Printer } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function InvoicePreview({ route, navigation }) {
  const { invoiceId } = route.params || {};
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          ledgers (name, phone, address, gst_number),
          invoice_items (
            quantity,
            unit_price,
            total_price,
            products (name)
          )
        `)
        .eq('id', invoiceId)
        .single();
        
      if (error) throw error;
      setInvoice(data);
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator color={theme.colors.primary} style={{flex: 1, backgroundColor: theme.colors.background}} />;
  if (!invoice) return <Text style={{color: 'white', marginTop: 100, textAlign: 'center'}}>Invoice not found.</Text>;

  const dateStr = new Date(invoice.created_at).toLocaleDateString();
  const timeStr = new Date(invoice.created_at).toLocaleTimeString();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Invoice Preview</Text>
        <TouchableOpacity style={styles.printBtn} onPress={() => global.print && window.print()}>
          <Printer color="#FFF" size={20} />
          <Text style={{color: '#FFF', marginLeft: 8, fontWeight: 'bold'}}>Print</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.invoicePaper}>
          
          {/* Header */}
          <View style={styles.invHeader}>
            <View>
              <Text style={styles.companyName}>SUNNIS SPICES</Text>
              <Text style={styles.companyDetails}>123 Factory Lane, Industrial Area</Text>
              <Text style={styles.companyDetails}>GSTIN: 29ABCDE1234F1Z5</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.invTitle}>TAX INVOICE</Text>
              <Text style={styles.invNo}>{invoice.invoice_number}</Text>
            </View>
          </View>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Billed To:</Text>
              <Text style={styles.metaValueBold}>{invoice.ledgers?.name}</Text>
              {invoice.ledgers?.phone && <Text style={styles.metaValue}>Ph: {invoice.ledgers.phone}</Text>}
              {invoice.ledgers?.address && <Text style={styles.metaValue}>{invoice.ledgers.address}</Text>}
              {invoice.ledgers?.gst_number && <Text style={styles.metaValue}>GST: {invoice.ledgers.gst_number}</Text>}
            </View>
            <View style={[styles.metaCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.metaLabel}>Invoice Date:</Text>
              <Text style={styles.metaValueBold}>{dateStr}</Text>
              <Text style={styles.metaValue}>{timeStr}</Text>
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.table}>
            <View style={styles.th}>
              <Text style={[styles.thText, { flex: 2 }]}>Item Description</Text>
              <Text style={[styles.thText, { width: 50, textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.thText, { width: 80, textAlign: 'right' }]}>Rate</Text>
              <Text style={[styles.thText, { width: 100, textAlign: 'right' }]}>Amount</Text>
            </View>
            
            {invoice.invoice_items?.map((item, idx) => (
              <View key={idx} style={styles.tr}>
                <Text style={[styles.tdText, { flex: 2 }]}>{item.products?.name}</Text>
                <Text style={[styles.tdText, { width: 50, textAlign: 'center' }]}>{item.quantity}</Text>
                <Text style={[styles.tdText, { width: 80, textAlign: 'right' }]}>₹{Number(item.unit_price).toFixed(2)}</Text>
                <Text style={[styles.tdText, { width: 100, textAlign: 'right' }]}>₹{Number(item.total_price).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>₹{Number(invoice.subtotal).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Tax:</Text>
              <Text style={styles.totalValue}>₹{Number(invoice.tax_amount || 0).toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>₹{Number(invoice.total_amount).toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for your business!</Text>
            <Text style={styles.footerText}>Authorized Signatory</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.l, paddingTop: theme.spacing.xl },
  backBtn: { marginRight: theme.spacing.m },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold', flex: 1 },
  printBtn: { flexDirection: 'row', backgroundColor: theme.colors.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  scroll: { padding: theme.spacing.l },
  
  invoicePaper: { backgroundColor: '#FFFFFF', padding: 30, borderRadius: 8, minHeight: 600, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 50 },
  
  invHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#EEE', paddingBottom: 20, marginBottom: 20 },
  companyName: { color: '#333', fontSize: 22, fontWeight: 'bold' },
  companyDetails: { color: '#666', fontSize: 12, marginTop: 4 },
  invTitle: { color: theme.colors.primary, fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
  invNo: { color: '#333', fontSize: 14, marginTop: 5, fontWeight: 'bold' },
  
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  metaCol: { flex: 1 },
  metaLabel: { color: '#888', fontSize: 12, marginBottom: 5 },
  metaValueBold: { color: '#333', fontSize: 16, fontWeight: 'bold', marginBottom: 3 },
  metaValue: { color: '#555', fontSize: 14 },
  
  table: { borderTopWidth: 1, borderTopColor: '#EEE', marginBottom: 30 },
  th: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE', backgroundColor: '#F9F9F9' },
  thText: { color: '#333', fontWeight: 'bold', fontSize: 13, paddingHorizontal: 5 },
  tr: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  tdText: { color: '#555', fontSize: 13, paddingHorizontal: 5 },
  
  totalsBox: { alignItems: 'flex-end', marginBottom: 40 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, marginBottom: 8 },
  totalLabel: { color: '#666', fontSize: 14 },
  totalValue: { color: '#333', fontSize: 14, fontWeight: 'bold' },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10, marginTop: 5 },
  grandTotalLabel: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  grandTotalValue: { color: theme.colors.primary, fontSize: 18, fontWeight: 'bold' },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 20 },
  footerText: { color: '#888', fontSize: 12, fontStyle: 'italic' }
});
