/**
 * Expo with Expo Router Project Type Configuration
 * 
 * This project type enables cross-platform mobile apps with
 * Expo Router (file-based routing), NativeWind (Tailwind for React Native),
 * and full TypeScript support.
 */

import type { ProjectTypeConfig, ProjectTypeFile } from '../project-type';

// Entry files for Expo with Expo Router
const entryFiles: ProjectTypeFile[] = [
  {
    path: 'app/_layout.tsx',
    content: `import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1f2937',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </>
  );
}`
  },
  {
    path: 'app/index.tsx',
    content: `import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-gray-900 items-center justify-center p-4">
      <Text className="text-4xl font-bold text-white mb-4">
        Expo Sandbox Ready
      </Text>
      <Text className="text-lg text-gray-400 text-center mb-8">
        Start building your cross-platform mobile app!
      </Text>
      <Link href="/about" asChild>
        <Pressable className="bg-blue-500 px-6 py-3 rounded-lg active:bg-blue-600">
          <Text className="text-white font-semibold">Learn More</Text>
        </Pressable>
      </Link>
    </View>
  );
}`
  },
  {
    path: 'app/about.tsx',
    content: `import { View, Text, ScrollView } from 'react-native';

export default function AboutScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-6">
        <Text className="text-3xl font-bold text-white mb-4">About</Text>
        <Text className="text-gray-300 text-base leading-6">
          This app was built with Expo Router and NativeWind.
          It supports iOS, Android, and Web from a single codebase.
        </Text>
      </View>
    </ScrollView>
  );
}`
  },
  {
    path: 'app/(tabs)/_layout.tsx',
    content: `import { Tabs } from 'expo-router';
import { Home, Search, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#1f2937',
          borderTopColor: '#374151',
        },
        headerStyle: {
          backgroundColor: '#1f2937',
        },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}`
  },
  {
    path: 'app/(tabs)/home.tsx',
    content: `import { View, Text, FlatList } from 'react-native';
import Card from '../../components/Card';

const items = [
  { id: '1', title: 'Welcome', description: 'Get started with your app' },
  { id: '2', title: 'Features', description: 'Explore what you can build' },
  { id: '3', title: 'Community', description: 'Join the Expo community' },
];

export default function HomeTab() {
  return (
    <View className="flex-1 bg-gray-900">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 gap-4"
        renderItem={({ item }) => (
          <Card title={item.title} description={item.description} />
        )}
      />
    </View>
  );
}`
  },
  {
    path: 'app/(tabs)/search.tsx',
    content: `import { View, Text, TextInput } from 'react-native';
import { useState } from 'react';

export default function SearchTab() {
  const [query, setQuery] = useState('');

  return (
    <View className="flex-1 bg-gray-900 p-4">
      <TextInput
        className="bg-gray-800 text-white px-4 py-3 rounded-lg mb-4"
        placeholder="Search..."
        placeholderTextColor="#9ca3af"
        value={query}
        onChangeText={setQuery}
      />
      <Text className="text-gray-400 text-center">
        {query ? \`Searching for: \${query}\` : 'Enter a search term'}
      </Text>
    </View>
  );
}`
  },
  {
    path: 'app/(tabs)/profile.tsx',
    content: `import { View, Text, Image, Pressable } from 'react-native';

export default function ProfileTab() {
  return (
    <View className="flex-1 bg-gray-900 items-center p-6">
      <View className="w-24 h-24 bg-gray-700 rounded-full items-center justify-center mb-4">
        <Text className="text-4xl">👤</Text>
      </View>
      <Text className="text-2xl font-bold text-white mb-2">User Name</Text>
      <Text className="text-gray-400 mb-6">user@example.com</Text>
      <Pressable className="bg-blue-500 px-6 py-3 rounded-lg active:bg-blue-600">
        <Text className="text-white font-semibold">Edit Profile</Text>
      </Pressable>
    </View>
  );
}`
  },
  {
    path: 'components/Card.tsx',
    content: `import { View, Text, Pressable } from 'react-native';

interface CardProps {
  title: string;
  description: string;
  onPress?: () => void;
}

export default function Card({ title, description, onPress }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-gray-800 rounded-xl p-4 active:bg-gray-700"
    >
      <Text className="text-xl font-semibold text-white mb-2">{title}</Text>
      <Text className="text-gray-400">{description}</Text>
    </Pressable>
  );
}`
  },
  {
    path: 'components/Button.tsx',
    content: `import { Pressable, Text, ActivityIndicator } from 'react-native';
import { forwardRef } from 'react';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

const Button = forwardRef<typeof Pressable, ButtonProps>(
  ({ title, onPress, variant = 'primary', loading, disabled }, ref) => {
    const baseClasses = 'px-6 py-3 rounded-lg items-center justify-center';
    const variantClasses = {
      primary: 'bg-blue-500 active:bg-blue-600',
      secondary: 'bg-gray-600 active:bg-gray-700',
      outline: 'border-2 border-blue-500 active:bg-blue-500/20',
    };
    const textClasses = {
      primary: 'text-white',
      secondary: 'text-white',
      outline: 'text-blue-500',
    };

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={disabled || loading}
        className={\`\${baseClasses} \${variantClasses[variant]} \${disabled ? 'opacity-50' : ''}\`}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' ? '#3b82f6' : '#fff'} />
        ) : (
          <Text className={\`font-semibold \${textClasses[variant]}\`}>{title}</Text>
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

export default Button;`
  },
  {
    path: 'components/Input.tsx',
    content: `import { View, Text, TextInput, TextInputProps } from 'react-native';
import { forwardRef, useState } from 'react';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View className="mb-4">
        {label && (
          <Text className="text-gray-300 mb-2 font-medium">{label}</Text>
        )}
        <TextInput
          ref={ref}
          className={\`bg-gray-800 text-white px-4 py-3 rounded-lg border \${
            error
              ? 'border-red-500'
              : isFocused
              ? 'border-blue-500'
              : 'border-gray-700'
          }\`}
          placeholderTextColor="#9ca3af"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {error && (
          <Text className="text-red-500 text-sm mt-1">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export default Input;`
  },
  {
    path: 'hooks/useColorScheme.ts',
    content: `import { useColorScheme as useNativeColorScheme } from 'react-native';

export function useColorScheme() {
  const colorScheme = useNativeColorScheme();
  return colorScheme ?? 'dark';
}

export default useColorScheme;`
  },
  {
    path: 'hooks/useLocalStorage.ts',
    content: `import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadValue = async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error('Error loading from AsyncStorage:', error);
      } finally {
        setLoading(false);
      }
    };
    loadValue();
  }, [key]);

  const setValue = useCallback(
    async (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('Error saving to AsyncStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue, loading] as const;
}

export default useLocalStorage;`
  },
  {
    path: 'global.css',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
  },
  {
    path: 'constants/Colors.ts',
    content: `export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#3b82f6',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#3b82f6',
  },
  dark: {
    text: '#ECEDEE',
    background: '#111827',
    tint: '#3b82f6',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#3b82f6',
  },
};

export default Colors;`
  }
];

// Config files for Expo with Expo Router
const configFiles: ProjectTypeFile[] = [
  {
    path: 'package.json',
    content: JSON.stringify({
      name: 'sandbox-expo-app',
      version: '1.0.0',
      main: 'expo-router/entry',
      scripts: {
        start: 'expo start',
        android: 'expo start --android',
        ios: 'expo start --ios',
        web: 'expo start --web'
      },
      dependencies: {
        'expo': '~51.0.0',
        'expo-router': '~3.5.0',
        'expo-status-bar': '~1.12.0',
        'expo-linking': '~6.3.0',
        'expo-constants': '~16.0.0',
        'react': '18.2.0',
        'react-native': '0.74.0',
        'react-native-screens': '~3.31.0',
        'react-native-safe-area-context': '4.10.0',
        'react-native-gesture-handler': '~2.16.0',
        'react-native-reanimated': '~3.10.0',
        'nativewind': '^4.0.0',
        'lucide-react-native': '^0.378.0',
        '@react-native-async-storage/async-storage': '1.23.0',
        'react-native-svg': '15.2.0'
      },
      devDependencies: {
        '@babel/core': '^7.24.0',
        '@types/react': '~18.2.0',
        'typescript': '^5.3.0',
        'tailwindcss': '^3.4.0'
      }
    }, null, 2)
  },
  {
    path: 'app.json',
    content: JSON.stringify({
      expo: {
        name: 'Sandbox App',
        slug: 'sandbox-app',
        version: '1.0.0',
        orientation: 'portrait',
        icon: './assets/icon.png',
        scheme: 'sandbox',
        userInterfaceStyle: 'automatic',
        splash: {
          image: './assets/splash.png',
          resizeMode: 'contain',
          backgroundColor: '#111827'
        },
        ios: {
          supportsTablet: true,
          bundleIdentifier: 'com.sandbox.app'
        },
        android: {
          adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#111827'
          },
          package: 'com.sandbox.app'
        },
        web: {
          bundler: 'metro',
          output: 'static',
          favicon: './assets/favicon.png'
        },
        plugins: [
          'expo-router'
        ],
        experiments: {
          typedRoutes: true
        }
      }
    }, null, 2)
  },
  {
    path: 'tsconfig.json',
    content: JSON.stringify({
      extends: 'expo/tsconfig.base',
      compilerOptions: {
        strict: true,
        paths: {
          '@/*': ['./*']
        }
      },
      include: [
        '**/*.ts',
        '**/*.tsx',
        '.expo/types/**/*.ts',
        'expo-env.d.ts'
      ]
    }, null, 2)
  },
  {
    path: 'tailwind.config.js',
    content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};`
  },
  {
    path: 'babel.config.js',
    content: `module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};`
  },
  {
    path: 'metro.config.js',
    content: `const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });`
  },
  {
    path: 'nativewind-env.d.ts',
    content: `/// <reference types="nativewind/types" />`
  }
];

export const expoConfig: ProjectTypeConfig = {
  id: 'expo',
  name: 'Expo (React Native)',
  description: 'Cross-platform mobile apps with Expo Router, NativeWind, and TypeScript',
  
  // File structure
  sourceDir: 'app',
  componentsDir: 'components',
  pagesDir: 'app',
  apiDir: null, // Expo uses external APIs or Expo Functions
  publicDir: 'assets',
  
  // Build configuration
  devCommand: 'npx expo start --web',
  buildCommand: 'npx expo export',
  devPort: 8081,
  startupDelay: 20000, // Expo takes longer to start
  
  // Dependencies
  baseDependencies: {
    'expo': '~51.0.0',
    'expo-router': '~3.5.0',
    'expo-status-bar': '~1.12.0',
    'react': '18.2.0',
    'react-native': '0.74.0',
    'nativewind': '^4.0.0',
    'react-native-screens': '~3.31.0',
    'react-native-safe-area-context': '4.10.0'
  },
  
  baseDevDependencies: {
    '@babel/core': '^7.24.0',
    '@types/react': '~18.2.0',
    'typescript': '^5.3.0',
    'tailwindcss': '^3.4.0'
  },
  
  // Entry files
  entryFiles,
  configFiles,
  
  // Path transformation - for Expo, routes go in app/, components in components/
  filePathTransform: (path: string): string => {
    if (path.startsWith('/')) path = path.slice(1);
    
    // Skip config files
    const configFileNames = [
      'package.json', 'app.json', 'tsconfig.json', 'tailwind.config.js',
      'babel.config.js', 'metro.config.js', 'nativewind-env.d.ts', 'global.css'
    ];
    if (configFileNames.includes(path)) {
      return path;
    }
    
    // Don't transform paths already in correct locations
    if (
      path.startsWith('app/') ||
      path.startsWith('components/') ||
      path.startsWith('hooks/') ||
      path.startsWith('constants/') ||
      path.startsWith('assets/')
    ) {
      return path;
    }
    
    // Transform src/components/ to components/
    if (path.startsWith('src/components/')) {
      return path.replace('src/components/', 'components/');
    }
    
    // Transform src/ to app/
    if (path.startsWith('src/')) {
      return path.replace('src/', 'app/');
    }
    
    // Check if it's a screen/page
    if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
      const fileName = path.split('/').pop() || '';
      const baseName = fileName.replace(/\.(tsx|jsx)$/, '');
      
      // If it looks like a component (PascalCase and doesn't end with Screen)
      if (/^[A-Z]/.test(baseName) && !baseName.endsWith('Screen')) {
        return `components/${path}`;
      }
      
      // Otherwise treat as a screen in app/
      return `app/${path}`;
    }
    
    // Default: put in app directory
    return `app/${path}`;
  },
  
  componentExtension: '.tsx',
  
  // Templates
  componentTemplate: `import { View, Text } from 'react-native';

interface {{name}}Props {
  // Add props here
}

export default function {{name}}({ }: {{name}}Props) {
  return (
    <View className="p-4">
      <Text className="text-2xl font-bold text-white">{{name}}</Text>
    </View>
  );
}`,
  
  pageTemplate: `import { View, Text, ScrollView } from 'react-native';

export default function {{name}}Screen() {
  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-6">
        <Text className="text-3xl font-bold text-white">{{name}}</Text>
      </View>
    </ScrollView>
  );
}`,
  
  apiRouteTemplate: null, // Expo doesn't have built-in API routes
  
  // Capabilities
  supportsApiRoutes: false,
  supportsSSR: false,
  usesTypeScript: true
};

export default expoConfig;