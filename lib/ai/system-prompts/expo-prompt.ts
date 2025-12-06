/**
 * Expo with Expo Router - System Prompt
 * 
 * Instructions for AI when generating Expo/React Native projects.
 * Uses Expo Router for file-based navigation and NativeWind for Tailwind-like styling.
 */

export const expoPrompt = `
## EXPO (REACT NATIVE) PROJECT STRUCTURE

You are generating code for an Expo project with Expo Router and NativeWind. Follow these conventions:

### Directory Structure:
\`\`\`
app/                 # File-based routing (Expo Router)
├── _layout.tsx      # Root layout with navigation setup
├── index.tsx        # Home screen (/)
├── about.tsx        # About screen (/about)
├── [id].tsx         # Dynamic route (/123, /abc)
├── (tabs)/          # Tab group
│   ├── _layout.tsx  # Tab navigator configuration
│   ├── home.tsx     # Home tab
│   ├── search.tsx   # Search tab
│   └── profile.tsx  # Profile tab
└── (auth)/          # Auth group (grouped routes)
    ├── _layout.tsx  # Auth layout
    ├── login.tsx    # Login screen
    └── register.tsx # Register screen
components/          # Reusable UI components
├── Button.tsx       # Custom button component
├── Card.tsx         # Card component
└── Input.tsx        # Form input component
hooks/               # Custom React hooks
├── useColorScheme.ts
└── useLocalStorage.ts
constants/           # App constants
└── Colors.ts        # Color definitions
assets/              # Static assets (images, fonts)
├── icon.png
└── splash.png
\`\`\`

### Expo Router Navigation:

**Root Layout (_layout.tsx):**
\`\`\`tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1f2937' },
          headerTintColor: '#fff',
        }}
      />
    </>
  );
}
\`\`\`

**Tab Navigation:**
\`\`\`tsx
import { Tabs } from 'expo-router';
import { Home, Search, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarStyle: { backgroundColor: '#1f2937' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
\`\`\`

**Navigation with Link:**
\`\`\`tsx
import { Link } from 'expo-router';
import { Pressable, Text } from 'react-native';

<Link href="/about" asChild>
  <Pressable className="bg-blue-500 px-4 py-2 rounded">
    <Text className="text-white">Go to About</Text>
  </Pressable>
</Link>

// With params
<Link href="/user/123" asChild>
  <Pressable><Text>View User</Text></Pressable>
</Link>

// Programmatic navigation
import { router } from 'expo-router';
router.push('/about');
router.replace('/login');
router.back();
\`\`\`

### NativeWind Styling (Tailwind for React Native):

**IMPORTANT: Use NativeWind className syntax:**
\`\`\`tsx
import { View, Text, Pressable } from 'react-native';

// ✅ CORRECT - use className with Tailwind classes
<View className="flex-1 bg-gray-900 p-4">
  <Text className="text-2xl font-bold text-white">Hello</Text>
  <Pressable className="bg-blue-500 px-4 py-2 rounded active:bg-blue-600">
    <Text className="text-white font-semibold">Press Me</Text>
  </Pressable>
</View>

// ❌ WRONG - don't use StyleSheet or inline styles
// Don't do: style={{ flex: 1, backgroundColor: '#111' }}
\`\`\`

**Common NativeWind Classes:**
- Layout: flex-1, flex-row, items-center, justify-center, gap-4
- Spacing: p-4, px-6, py-2, m-4, mx-auto
- Sizing: w-full, h-24, min-h-screen
- Background: bg-gray-900, bg-blue-500, bg-white
- Text: text-xl, font-bold, text-white, text-gray-400, text-center
- Borders: rounded-lg, rounded-full, border, border-gray-700
- Active states: active:bg-blue-600, active:opacity-80

### React Native Components:

**Use React Native core components, NOT web elements:**
\`\`\`tsx
// ✅ CORRECT - React Native components
import { View, Text, Pressable, TextInput, ScrollView, FlatList, Image } from 'react-native';

<View className="p-4">
  <Text className="text-lg">Hello</Text>
  <Pressable onPress={() => {}}>
    <Text>Button</Text>
  </Pressable>
  <TextInput 
    className="bg-gray-800 text-white px-4 py-2 rounded"
    placeholder="Enter text"
    placeholderTextColor="#9ca3af"
  />
</View>

// ❌ WRONG - Don't use HTML elements
// Don't use: <div>, <span>, <button>, <input>, <p>, <h1>
\`\`\`

**Lists - Use FlatList for performance:**
\`\`\`tsx
import { FlatList, View, Text } from 'react-native';

<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  contentContainerClassName="p-4 gap-4"
  renderItem={({ item }) => (
    <View className="bg-gray-800 p-4 rounded-xl">
      <Text className="text-white">{item.title}</Text>
    </View>
  )}
/>
\`\`\`

**Scrollable Content:**
\`\`\`tsx
import { ScrollView, View, Text } from 'react-native';

<ScrollView className="flex-1 bg-gray-900">
  <View className="p-6">
    <Text className="text-3xl font-bold text-white">Title</Text>
    {/* Long content */}
  </View>
</ScrollView>
\`\`\`

### Icons with lucide-react-native:

\`\`\`tsx
import { Home, Search, User, Settings, ChevronRight } from 'lucide-react-native';

<Home color="#fff" size={24} />
<Search color="#3b82f6" size={20} />
\`\`\`

### Form Inputs:

\`\`\`tsx
import { useState } from 'react';
import { View, TextInput, Text } from 'react-native';

function FormExample() {
  const [email, setEmail] = useState('');
  
  return (
    <View className="mb-4">
      <Text className="text-gray-300 mb-2">Email</Text>
      <TextInput
        className="bg-gray-800 text-white px-4 py-3 rounded-lg"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email"
        placeholderTextColor="#9ca3af"
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </View>
  );
}
\`\`\`

### Pressable Button Pattern:

\`\`\`tsx
import { Pressable, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

function Button({ title, onPress, loading, disabled }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={\`bg-blue-500 px-6 py-3 rounded-lg items-center \${
        disabled ? 'opacity-50' : 'active:bg-blue-600'
      }\`}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white font-semibold">{title}</Text>
      )}
    </Pressable>
  );
}
\`\`\`

### Safe Area:

\`\`\`tsx
import { SafeAreaView } from 'react-native-safe-area-context';

// For screens that need safe area insets
<SafeAreaView className="flex-1 bg-gray-900">
  {/* Content */}
</SafeAreaView>
\`\`\`

### Async Storage (Local Data):

\`\`\`tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data
await AsyncStorage.setItem('user', JSON.stringify(userData));

// Load data
const data = await AsyncStorage.getItem('user');
const user = data ? JSON.parse(data) : null;

// Remove data
await AsyncStorage.removeItem('user');
\`\`\`

### Key Conventions:

1. **Always use React Native components** - Never use HTML elements
2. **Use NativeWind className** - No StyleSheet or inline styles
3. **Use Pressable for buttons** - Not TouchableOpacity (deprecated pattern)
4. **Use FlatList for lists** - Not ScrollView with .map() for dynamic lists
5. **Icons from lucide-react-native** - Not web icon libraries
6. **TypeScript is required** - All files should be .tsx
7. **Export default for screens** - All app/ files need default exports
8. **Expo Router for navigation** - File-based routing, Link component

### What NOT to do:

\`\`\`tsx
// ❌ WRONG - Web patterns that don't work
<div className="p-4">          // Use <View>
<span>Text</span>              // Use <Text>
<button onClick={}>            // Use <Pressable onPress={}>
<input type="text">            // Use <TextInput>
<img src="">                   // Use <Image source={}>
<a href="">                    // Use <Link href="">
onClick, onChange              // Use onPress, onChangeText
style={{ flex: 1 }}            // Use className="flex-1"
document.getElementById        // React refs or state
window.location                // router.push()
\`\`\`

### File Naming:
- Screens in app/: lowercase with hyphens (e.g., about-us.tsx)
- Components: PascalCase (e.g., Button.tsx, Card.tsx)
- Hooks: camelCase with use prefix (e.g., useAuth.ts)
- Constants: PascalCase (e.g., Colors.ts)
`;

export default expoPrompt;