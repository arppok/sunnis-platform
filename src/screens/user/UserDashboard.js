import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { Package, Tag, BookOpen, LogOut } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function UserDashboard({ navigation }) {
  const [products, setProducts] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch products and articles concurrently from Supabase
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const upcomingSchemes = products.filter(p => p.is_upcoming);
  const regularProducts = products.filter(p => !p.is_upcoming);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, User</Text>
            <Text style={styles.title}>Sunnis Store</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <LogOut color={theme.colors.primary} size={24} />
          </TouchableOpacity>
        </View>

        {upcomingSchemes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Schemes</Text>
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

        <Text style={styles.sectionTitle}>Featured Products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
          {regularProducts.map(product => (
            <ProductCard key={product.id} name={product.name} price={`$${product.price}`} />
          ))}
          {regularProducts.length === 0 && <Text style={{color: 'gray'}}>No products found</Text>}
        </ScrollView>

        <Text style={styles.sectionTitle}>Latest Articles</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const ProductCard = ({ name, price }) => (
  <View style={styles.productCard}>
    <View style={styles.productImagePlaceholder}>
      <Package color={theme.colors.textSecondary} size={40} />
    </View>
    <Text style={styles.productName} numberOfLines={1}>{name}</Text>
    <Text style={styles.productPrice}>{price}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: theme.spacing.l },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl, marginTop: theme.spacing.m },
  greeting: { color: theme.colors.textSecondary, fontSize: 16 },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: 'bold' },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: theme.spacing.m, marginTop: theme.spacing.l },
  schemeCard: { flexDirection: 'row', backgroundColor: theme.colors.primary + '15', padding: theme.spacing.l, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.primary + '30', alignItems: 'center', marginBottom: 10 },
  schemeContent: { marginLeft: theme.spacing.m, flex: 1 },
  schemeTitle: { color: theme.colors.primary, fontSize: 16, fontWeight: 'bold' },
  schemeDesc: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  productsScroll: { marginHorizontal: -theme.spacing.l, paddingHorizontal: theme.spacing.l },
  productCard: { width: 160, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, marginRight: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border },
  productImagePlaceholder: { height: 120, backgroundColor: theme.colors.surfaceHighlight, borderRadius: theme.borderRadius.m, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.m },
  productName: { color: theme.colors.text, fontWeight: '500', marginBottom: 4 },
  productPrice: { color: theme.colors.primary, fontWeight: 'bold' },
  articleCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing.l, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', marginBottom: 10 },
  articleTitle: { color: theme.colors.text, fontWeight: 'bold' },
  articleDesc: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  articleAuthor: { color: theme.colors.primary, fontSize: 10, marginTop: 4, fontWeight: 'bold' }
});
