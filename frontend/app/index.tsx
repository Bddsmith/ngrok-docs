import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Poultry Marketplace</Text>
          <Text style={styles.subtitle}>Buy & Sell Poultry, Coops & Cages</Text>
          {user && (
            <Text style={styles.welcomeText}>Welcome back, {user.name}!</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/browse')}
            >
              <Ionicons name="search" size={32} color="#4F46E5" />
              <Text style={styles.actionText}>Browse Listings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/create-listing')}
            >
              <Ionicons name="add-circle" size={32} color="#059669" />
              <Text style={styles.actionText}>Create Listing</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/messages')}
            >
              <Ionicons name="chatbubbles" size={32} color="#DC2626" />
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push(user ? '/profile' : '/auth/login')}
            >
              <Ionicons name="person" size={32} color="#7C3AED" />
              <Text style={styles.actionText}>
                {user ? 'Profile' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoryList}>
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => router.push('/browse?category=poultry')}
            >
              <Ionicons name="fish" size={24} color="#F59E0B" />
              <Text style={styles.categoryText}>Poultry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => router.push('/browse?category=coop')}
            >
              <Ionicons name="home" size={24} color="#10B981" />
              <Text style={styles.categoryText}>Coops</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => router.push('/browse?category=cage')}
            >
              <Ionicons name="grid" size={24} color="#8B5CF6" />
              <Text style={styles.categoryText}>Cages</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Showcase */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Our Marketplace?</Text>
          
          <View style={styles.featureCard}>
            <Ionicons name="shield-checkmark" size={24} color="#059669" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Secure Transactions</Text>
              <Text style={styles.featureText}>
                Safe and secure platform for buying and selling
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#4F46E5" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Direct Communication</Text>
              <Text style={styles.featureText}>
                Chat directly with buyers and sellers
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="location" size={24} color="#DC2626" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Local Marketplace</Text>
              <Text style={styles.featureText}>
                Find listings in your area for easy pickup
              </Text>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
          <Text style={styles.ctaText}>
            {user 
              ? "Create your first listing or browse what's available in your area!"
              : "Join our community of poultry enthusiasts today!"
            }
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push(user ? '/create-listing' : '/auth/register')}
          >
            <Text style={styles.ctaButtonText}>
              {user ? 'Create Listing' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  categoryList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  ctaCard: {
    backgroundColor: '#EEF2FF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4338CA',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 14,
    color: '#6366F1',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});