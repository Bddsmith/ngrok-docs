import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { listingsAPI, userAPI, Listing, User } from '../../src/services/api';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadListing();
    }
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const listingData = await listingsAPI.getById(id!);
      setListing(listingData);
      
      // Load seller info
      const sellerData = await userAPI.getProfile(listingData.user_id);
      setSeller(sellerData);
    } catch (error) {
      console.error('Error loading listing:', error);
      Alert.alert('Error', 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to contact the seller', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log In', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    if (!listing || !seller) return;

    // Navigate to chat screen
    router.push({
      pathname: '/chat/[listingId]/[userId]',
      params: {
        listingId: listing.id,
        userId: seller.id,
        listingTitle: listing.title,
        sellerName: seller.name,
      },
    });
  };

  const handleCallSeller = () => {
    if (!seller?.phone) {
      Alert.alert('No Phone Number', 'Phone number not available');
      return;
    }

    Alert.alert(
      'Call Seller',
      `Call ${seller.name} at ${seller.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${seller.phone}`) },
      ]
    );
  };

  const renderDetailRow = (icon: string, label: string, value: string | undefined) => {
    if (!value) return null;
    
    return (
      <View style={styles.detailRow}>
        <Ionicons name={icon as any} size={20} color="#6B7280" />
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!listing || !seller) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Listing not found</Text>
          <Text style={styles.errorText}>This listing may have been removed or doesn't exist.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnListing = user?.id === listing.user_id;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        {/* Images */}
        {listing.images.length > 0 ? (
          <View style={styles.imageSection}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {listing.images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.image}
                  onLoad={() => setSelectedImageIndex(index)}
                />
              ))}
            </ScrollView>
            {listing.images.length > 1 && (
              <View style={styles.imageIndicator}>
                <Text style={styles.imageIndexText}>
                  {selectedImageIndex + 1} / {listing.images.length}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image" size={64} color="#D1D5DB" />
            <Text style={styles.placeholderText}>No images available</Text>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.contentSection}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{listing.category}</Text>
            </View>
            <Text style={styles.price}>${listing.price}</Text>
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.description}>{listing.description}</Text>

          {/* Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            {renderDetailRow('location', 'Location', listing.location)}
            {renderDetailRow('calendar', 'Posted', new Date(listing.created_at).toLocaleDateString())}
            
            {listing.category === 'poultry' && (
              <>
                {renderDetailRow('paw', 'Breed', listing.breed)}
                {renderDetailRow('time', 'Age', listing.age)}
                {renderDetailRow('heart', 'Health Status', listing.health_status)}
              </>
            )}
            
            {(listing.category === 'coop' || listing.category === 'cage') && (
              <>
                {renderDetailRow('resize', 'Size', listing.size)}
                {renderDetailRow('build', 'Material', listing.material)}
                {renderDetailRow('checkmark-circle', 'Condition', listing.condition)}
              </>
            )}
          </View>

          {/* Seller Info */}
          <View style={styles.sellerSection}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatar}>
                  <Ionicons name="person" size={24} color="#6B7280" />
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>{seller.name}</Text>
                  <Text style={styles.sellerLocation}>{seller.location}</Text>
                </View>
              </View>
              
              {!isOwnListing && (
                <View style={styles.contactButtons}>
                  <TouchableOpacity style={styles.messageButton} onPress={handleContactSeller}>
                    <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
                    <Text style={styles.messageButtonText}>Message</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.callButton} onPress={handleCallSeller}>
                    <Ionicons name="call" size={20} color="#059669" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {isOwnListing && (
            <View style={styles.ownerActions}>
              <TouchableOpacity style={styles.editButton}>
                <Ionicons name="pencil" size={18} color="#4F46E5" />
                <Text style={styles.editButtonText}>Edit Listing</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {!isOwnListing && (
        <View style={styles.bottomBar}>
          <View style={styles.priceContainer}>
            <Text style={styles.bottomPrice}>${listing.price}</Text>
          </View>
          <TouchableOpacity style={styles.contactButton} onPress={handleContactSeller}>
            <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Contact Seller</Text>
          </TouchableOpacity>
        </View>
      )}
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
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  imageSection: {
    position: 'relative',
  },
  image: {
    width: 390, // Adjust based on screen width
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    height: 250,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  imageIndexText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  contentSection: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4338CA',
    textTransform: 'capitalize',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  sellerSection: {
    marginBottom: 24,
  },
  sellerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  sellerLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  callButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  ownerActions: {
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceContainer: {
    flex: 1,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});