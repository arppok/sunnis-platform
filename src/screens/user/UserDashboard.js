import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { Package, Tag, BookOpen, LogOut, ShoppingCart, Plus } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function UserDashboard({ navigation, route }) {
  const [products, setProducts] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Shopping Cart State
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for 'clearCart' param from CheckoutScreen
  useEffect(() => {
    if (route.params?.clearCart) {
      setCart([]);
      navigation.setParams({ clearCart: undefined });
    }
  }, [route.params?.clearCart]);

  const fetchData = async () => {
    try {
      const [productsResponse, articlesResponse] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('articles').select('*').order('created_at', { ascending: false })
      ]);

      if (productsResponse.data) setProducts(productsResponse.data);
      if (articlesResponse.data) setArticles(articlesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    if (global.alert) alert(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const upcomingSchemes = products.filter(p => p.is_upcoming);
  const regularProducts = products.filter(p => !p.is_upcoming);
  
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome to</Text>
            <Text style={styles.title}>Sunnis Spices</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <LogOut color={theme.colors.primary} size={24} />
          </TouchableOpacity>
        </View>

        {upcomingSchemes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Offers</Text>
            {upcomingSchemes.map(scheme => (
              <View key={scheme.id} style={styles.schemeCard}>
                <Tag color={theme.colors.primary} size={24} />
                <View style={styles.schemeContent}>
                  <Text style={styles.schemeTitle}>{scheme.name}</Text>
                  <Text style={styles.schemeDesc}>{scheme.description}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Our Spices</Text>
        <View style={styles.productsGrid}>
          {regularProducts.map(product => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productImagePlaceholder}>
                <Package color={theme.colors.textSecondary} size={40} />
              </View>
              <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
              <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
              <View style={styles.productFooter}>
                <Text style={styles.productPrice}>${product.price}</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(product)}>
                  <Plus color="#FFF" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {regularProducts.length === 0 && <Text style={{color: 'gray'}}>No spices available</Text>}
        </View>

        <Text style={styles.sectionTitle}>Latest Updates</Text>
        {articles.map(article => (
          <View key={article.id} style={styles.articleCard}>
            <BookOpen color={theme.colors.primary} size={24} style={{ marginRight: 15 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleDesc}>{article.content}</Text>
              <Text style={styles.articleAuthor}>By {article.author}</Text>
            </View>
          </View>
        ))}
        <View style={{height: 80}} />
      </ScrollView>

      {/* Floating Cart Button */}
      {totalCartItems > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CheckoutScreen', { cart })}>
          <ShoppingCart color="#FFF" size={24} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalCartItems}</Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: theme.spacing.l },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl, marginTop: theme.spacing.m },
  greeting: { color: theme.colors.textSecondary, fontSize: 16 },
  title: { color: theme.colors.primary, fontSize: 28, fontWeight: 'bold' },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: theme.spacing.m, marginTop: theme.spacing.l },
  schemeCard: { flexDirection: 'row', backgroundColor: theme.colors.primary + '15', padding: theme.spacing.l, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.primary + '30', alignItems: 'center', marginBottom: 10 },
  schemeContent: { marginLeft: theme.spacing.m, flex: 1 },
  schemeTitle: { color: theme.colors.primary, fontSize: 16, fontWeight: 'bold' },
  schemeDesc: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: { width: '48%', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, marginBottom: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  productImagePlaceholder: { height: 100, backgroundColor: theme.colors.surfaceHighlight, borderRadius: theme.borderRadius.m, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.m },
  productName: { color: theme.colors.text, fontWeight: '500', marginBottom: 2 },
  productDesc: { color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8, height: 30 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 },
  addBtn: { backgroundColor: theme.colors.primary, borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  articleCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing.l, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', marginBottom: 10 },
  articleTitle: { color: theme.colors.text, fontWeight: 'bold' },
  articleDesc: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  articleAuthor: { color: theme.colors.primary, fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: theme.colors.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 3 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: theme.colors.danger, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.background },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' }
});
