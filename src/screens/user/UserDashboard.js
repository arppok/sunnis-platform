import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { Package, Tag, BookOpen, LogOut } from 'lucide-react-native';

export default function UserDashboard({ navigation }) {
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

        <Text style={styles.sectionTitle}>Upcoming Schemes</Text>
        <View style={styles.schemeCard}>
          <Tag color={theme.colors.primary} size={24} />
          <View style={styles.schemeContent}>
            <Text style={styles.schemeTitle}>Diwali Special Offer</Text>
            <Text style={styles.schemeDesc}>Get 20% off on all new arrivals this week.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Featured Products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
          <ProductCard name="Premium Leather Bag" price="$120" />
          <ProductCard name="Sunnis Signature Watch" price="$250" />
          <ProductCard name="Wireless Headphones" price="$89" />
        </ScrollView>

        <Text style={styles.sectionTitle}>Latest Articles</Text>
        <View style={styles.articleCard}>
          <BookOpen color={theme.colors.primary} size={24} style={{ marginRight: 15 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.articleTitle}>How to style your new accessories</Text>
            <Text style={styles.articleDesc}>Read our latest guide on fashion trends.</Text>
          </View>
        </View>
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
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.m,
    marginTop: theme.spacing.l,
  },
  schemeCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary + '15',
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    alignItems: 'center',
  },
  schemeContent: {
    marginLeft: theme.spacing.m,
    flex: 1,
  },
  schemeTitle: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  schemeDesc: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  productsScroll: {
    marginHorizontal: -theme.spacing.l,
    paddingHorizontal: theme.spacing.l,
  },
  productCard: {
    width: 160,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    marginRight: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  productImagePlaceholder: {
    height: 120,
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: theme.borderRadius.m,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  productName: {
    color: theme.colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  productPrice: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginBottom: 50,
  },
  articleTitle: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  articleDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  }
});
