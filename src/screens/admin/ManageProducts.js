import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Plus, Trash2, Package, Edit3 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function ManageProducts({ navigation }) {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recipe State
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [selectedRawMaterial, setSelectedRawMaterial] = useState(null);
  const [recipeQty, setRecipeQty] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, matRes] = await Promise.all([
        supabase.from('products').select(`*, product_recipes(id, quantity_required, raw_materials(id, name, unit))`).order('created_at', { ascending: false }),
        supabase.from('raw_materials').select('*').order('name')
      ]);
      setProducts(prodRes.data || []);
      setRawMaterials(matRes.data || []);
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
      const { error } = await supabase.from('products').insert([{ name, description, price: parseFloat(price), is_upcoming: isUpcoming }]);
      if (error) throw error;
      setName(''); setDescription(''); setPrice(''); setIsUpcoming(false);
      await fetchData();
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
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddRecipeItem = async (productId) => {
    if (!selectedRawMaterial || !recipeQty) {
      if (global.alert) alert('Please select a material and enter quantity.');
      return;
    }
    try {
      const { error } = await supabase.from('product_recipes').insert([{
        product_id: productId,
        raw_material_id: selectedRawMaterial.id,
        quantity_required: parseFloat(recipeQty)
      }]);
      if (error) throw error;
      setSelectedRawMaterial(null);
      setRecipeQty('');
      await fetchData();
    } catch (error) {
      console.error(error);
      if (global.alert) alert('Failed to add recipe item');
    }
  };

  const handleRemoveRecipeItem = async (recipeId) => {
    try {
      const { error } = await supabase.from('product_recipes').delete().eq('id', recipeId);
      if (error) throw error;
      await fetchData();
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
          <TextInput style={styles.input} placeholder="Price (₹)" placeholderTextColor={theme.colors.textSecondary} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Is this an Upcoming Scheme?</Text>
            <Switch value={isUpcoming} onValueChange={setIsUpcoming} trackColor={{ false: theme.colors.surfaceHighlight, true: theme.colors.primary + '50' }} thumbColor={isUpcoming ? theme.colors.primary : '#f4f3f4'} />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleAddProduct} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : (
              <><Plus color="#fff" size={20} style={{ marginRight: 8 }} /><Text style={styles.buttonText}>Publish to Store</Text></>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Live Products & Schemes</Text>
        {loading ? <ActivityIndicator color={theme.colors.primary} /> : (
          products.map(product => (
            <View key={product.id} style={styles.productCardWrapper}>
              <TouchableOpacity style={styles.productCard} onPress={() => setExpandedProductId(expandedProductId === product.id ? null : product.id)}>
                <View style={styles.iconContainer}>
                  <Package color={product.is_upcoming ? theme.colors.warning : theme.colors.primary} size={24} />
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDesc}>{product.is_upcoming ? 'UPCOMING SCHEME' : `₹${product.price}`}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(product.id)}>
                  <Trash2 color={theme.colors.danger} size={20} />
                </TouchableOpacity>
              </TouchableOpacity>

              {expandedProductId === product.id && (
                <View style={styles.expandedSection}>
                  <Text style={styles.recipeTitle}>Recipe (Bill of Materials) for 1 Unit</Text>
                  
                  {product.product_recipes?.map(item => (
                    <View key={item.id} style={styles.recipeRow}>
                      <Text style={styles.recipeName}>{item.raw_materials?.name}</Text>
                      <Text style={styles.recipeQty}>{item.quantity_required} {item.raw_materials?.unit}</Text>
                      <TouchableOpacity onPress={() => handleRemoveRecipeItem(item.id)}>
                        <Trash2 color={theme.colors.danger} size={16} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <View style={styles.addRecipeBox}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      {rawMaterials.map(rm => (
                        <TouchableOpacity key={rm.id} style={[styles.rmChip, selectedRawMaterial?.id === rm.id && styles.rmChipActive]} onPress={() => setSelectedRawMaterial(rm)}>
                          <Text style={[styles.rmChipText, selectedRawMaterial?.id === rm.id && styles.rmChipTextActive]}>{rm.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <View style={styles.recipeInputRow}>
                      <TextInput 
                        style={styles.recipeInput} 
                        placeholder={`Qty (${selectedRawMaterial ? selectedRawMaterial.unit : 'unit'})`} 
                        placeholderTextColor="#666" 
                        value={recipeQty} 
                        onChangeText={setRecipeQty} 
                        keyboardType="decimal-pad" 
                      />
                      <TouchableOpacity style={styles.addRecipeBtn} onPress={() => handleAddRecipeItem(product.id)}>
                        <Plus color="#FFF" size={16} />
                        <Text style={styles.addRecipeBtnText}>Add Ingredient</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                </View>
              )}
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
  productCardWrapper: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.s, borderWidth: 1, borderColor: theme.colors.border },
  productCard: { flexDirection: 'row', padding: theme.spacing.m, alignItems: 'center' },
  iconContainer: { padding: 10, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.m },
  productName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
  productDesc: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  expandedSection: { padding: theme.spacing.m, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background + '50' },
  recipeTitle: { color: theme.colors.text, fontWeight: 'bold', marginBottom: 10, fontSize: 14 },
  recipeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  recipeName: { color: theme.colors.text, fontSize: 14, flex: 1 },
  recipeQty: { color: theme.colors.textSecondary, fontSize: 14, width: 80, textAlign: 'right', marginRight: 15 },
  addRecipeBox: { marginTop: 15, padding: 10, backgroundColor: theme.colors.surface, borderRadius: 8 },
  rmChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, marginRight: 8 },
  rmChipActive: { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary },
  rmChipText: { color: theme.colors.text, fontSize: 12 },
  rmChipTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
  recipeInputRow: { flexDirection: 'row', gap: 10 },
  recipeInput: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 8, padding: 8, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  addRecipeBtn: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  addRecipeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, marginLeft: 5 }
});
