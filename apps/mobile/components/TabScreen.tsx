import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Root wrapper for tab screens when native headers are hidden. */
export function TabScreen({ children, style }: TabScreenProps) {
  return (
    <SafeAreaView style={[styles.root, style]} edges={['top']}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
