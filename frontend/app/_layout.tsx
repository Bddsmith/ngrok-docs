import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
          <Stack.Screen name="auth/register" options={{ title: 'Register' }} />
          <Stack.Screen name="browse" options={{ title: 'Browse Listings' }} />
          <Stack.Screen name="create-listing" options={{ title: 'Create Listing' }} />
          <Stack.Screen name="messages" options={{ title: 'Messages' }} />
          <Stack.Screen name="profile" options={{ title: 'Profile' }} />
          <Stack.Screen name="listing/[id]" options={{ title: 'Listing Details' }} />
          <Stack.Screen 
            name="chat/[listingId]/[userId]" 
            options={{ 
              title: 'Chat',
              headerShown: false 
            }} 
          />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}