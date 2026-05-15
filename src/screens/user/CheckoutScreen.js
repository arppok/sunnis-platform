import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function CheckoutScreen({ route, navigation }) {
  const { cart } = route.params || { cart: [] };
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      if (global.alert) alert('Please enter your Name and Phone Number');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Insert Consumer Order
      const { data: orderData, error: orderError } = await supabase
        .from('consumer_orders')
        .insert([{
          customer_name: name,
          customer_phone: phone,
          total_amount: totalAmount
        }])
        .select()
        .single();
      
      if (orderError) throw orderError;

      // 2. Insert Order Items
      const itemsToInsert = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_time: item.product.price
      }));

      const { error: itemsError } = await supabase.from('consumer_order_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      if (global.alert) alert('Order placed successfully! We will contact you soon.');
      navigation.navigate('UserDashboard', { clearCart: true });
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft color={theme.colors.text} size={24} /></TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Order</Text>
          {cart.map((item, index) => (
            <View key={index} style={styles.cartItem}>
              <Text style={styles.itemText}>{item.quantity}x {item.product.name}</Text>
              <Text style={styles.itemPrice}>${(item.quantity * item.product.price).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Details</Text>
          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={theme.colors.textSecondary} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor={theme.colors.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          
          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <CheckCircle color="#fff" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Submit Order</Text>
              </>
            )}
          </TouchableOpacity>
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
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.xl },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: theme.spacing.m },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 5 },
  itemText: { color: theme.colors.text, fontSize: 16 },
  itemPrice: { color: theme.colors.textSecondary, fontSize: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10 },
  totalLabel: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
  totalValue: { color: theme.colors.primary, fontSize: 20, fontWeight: 'bold' },
  input: { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, color: theme.colors.text, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  button: { flexDirection: 'row', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
