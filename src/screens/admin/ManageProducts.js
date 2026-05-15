import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Plus, Trash2, Package } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function ManageProducts({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!name.trim() || !price) {
      if (global.alert) alert('Please enter a product name and price');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('products').insert([{ 
        name, 
        description, 
        price: parseFloat(price),
        is_upcoming: isUpcoming 
      }]);
      if (error) throw error;
      
      setName(''); setDescription(''); setPrice(''); setIsUpcoming(false);
      await fetchProducts();
      if (global.alert) alert('Product published successfully!');
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (global.confirm && !confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Storefront</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Publish New Item</Text>
          <TextInput style={styles.input} placeholder="Product/Scheme Name" placeholderTextColor={theme.colors.textSecondary} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Description" placeholderTextColor={theme.colors.textSecondary} value={description} onChangeText={setDescription} multiline />
          <TextInput style={styles.input} placeholder="Price ($)" placeholderTextColor={theme.colors.textSecondary} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Is this an Upcoming Scheme?</Text>
            <Switch 
              value={isUpcoming} 
              onValueChange={setIsUpcoming} 
              trackColor={{ false: theme.colors.surfaceHighlight, true: theme.colors.primary + '50' }}
              thumbColor={isUpcoming ? theme.colors.primary : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleAddProduct} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <Plus color="#fff" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Publish to Store</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Live Products & Schemes</Text>
        {loading ? <ActivityIndicator color={theme.colors.primary} /> : (
          products.map(product => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.iconContainer}>
                <Package color={product.is_upcoming ? theme.colors.warning : theme.colors.primary} size={24} />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDesc}>{product.is_upcoming ? 'UPCOMING SCHEME' : `$${product.price}`}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(product.id)}>
                <Trash2 color={theme.colors.danger} size={20} />
              </TouchableOpacity>
            </View>
          ))
        )}
        {products.length === 0 && !loading && <Text style={{color:'gray'}}>Storefront is empty.</Text>}
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
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.l, paddingHorizontal: 5 },
  switchLabel: { color: theme.colors.textSecondary, fontSize: 16 },
  button: { flexDirection: 'row', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  productCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.s, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  iconContainer: { padding: 10, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.m },
  productName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
  productDesc: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }
});
