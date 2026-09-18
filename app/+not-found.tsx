import { Text } from '@/components/ui/text';
import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center gap-2 bg-background p-4">
        <Text>This screen doesn't exist.</Text>
        <Link href="/">
          <Text className="text-brand">Go to login</Text>
        </Link>
      </View>
    </>
  );
}
