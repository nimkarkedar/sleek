import { Text } from '@/components/ui/text';
import { Link } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View className="flex-1 flex-col md:flex-row">
      <Link href={{ pathname: '/shell', params: { mode: 'client' } }} asChild>
        <Pressable
          className="min-h-[220px] flex-1 items-center justify-center bg-[#FAFAFA] web:cursor-pointer web:hover:bg-[#F5F5F5] active:bg-[#F0F0F1]"
          accessibilityRole="link">
          <View className="min-w-[280px] rounded-2xl bg-[#F4F4F5] px-9 py-7 shadow-sm">
            <Text className="mb-1.5 text-2xl font-plex-bold tracking-tight text-[#18181B]">
              Login as a Company
            </Text>
            <Text className="text-sm text-[#656565]">For eg: Acme Pte Ltd</Text>
          </View>
        </Pressable>
      </Link>

      <Link href={{ pathname: '/shell', params: { mode: 'accountant' } }} asChild>
        <Pressable
          className="min-h-[220px] flex-1 items-center justify-center bg-brand web:cursor-pointer web:hover:bg-brand-hover active:bg-brand-hover"
          accessibilityRole="link">
          <View className="min-w-[280px] rounded-2xl bg-white px-9 py-7 shadow-lg">
            <Text className="mb-1.5 text-2xl font-plex-bold tracking-tight text-[#18181B]">
              Login as a Sleek
            </Text>
            <Text className="text-sm text-[#656565]">Accountant or Admin</Text>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}
