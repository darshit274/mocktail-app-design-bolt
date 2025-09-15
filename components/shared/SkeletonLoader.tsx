import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getTheme } from '@/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  children,
}) => {
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const animatedStyle = {
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  const styles = getStyles(Colors);

  return (
    <View style={[{ width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.skeleton,
          { 
            width: '100%', 
            height: '100%', 
            borderRadius,
          },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

interface PDFCardSkeletonProps {
  style?: ViewStyle;
}

export const PDFCardSkeleton: React.FC<PDFCardSkeletonProps> = ({ style }) => {
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);

  return (
    <View style={[styles.pdfCardSkeleton, style]}>
      {/* Header Section */}
      <View style={styles.headerSkeleton}>
        <View style={styles.headerLeft}>
          <SkeletonLoader width={48} height={48} borderRadius={12} />
          <View style={styles.titleSection}>
            <SkeletonLoader width="80%" height={18} borderRadius={4} />
            <View style={styles.metaSection}>
              <SkeletonLoader width={60} height={12} borderRadius={4} />
              <SkeletonLoader width={80} height={12} borderRadius={4} />
            </View>
          </View>
        </View>
        <SkeletonLoader width={40} height={16} borderRadius={8} />
      </View>

      {/* Description */}
      <View style={styles.descriptionSkeleton}>
        <SkeletonLoader width="100%" height={14} borderRadius={4} />
        <SkeletonLoader width="75%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
      </View>

      {/* Tags */}
      <View style={styles.tagsSkeleton}>
        <SkeletonLoader width={60} height={24} borderRadius={12} />
        <SkeletonLoader width={80} height={24} borderRadius={12} />
        <SkeletonLoader width={70} height={24} borderRadius={12} />
      </View>

      {/* Stats */}
      <View style={styles.statsSkeleton}>
        <SkeletonLoader width={100} height={12} borderRadius={4} />
        <SkeletonLoader width={80} height={12} borderRadius={4} />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSkeleton}>
        <SkeletonLoader width="48%" height={44} borderRadius={8} />
        <SkeletonLoader width="48%" height={44} borderRadius={8} />
      </View>
    </View>
  );
};

interface PDFListSkeletonProps {
  count?: number;
}

export const PDFListSkeleton: React.FC<PDFListSkeletonProps> = ({ count = 5 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <PDFCardSkeleton key={index} style={{ marginBottom: 16 }} />
      ))}
    </View>
  );
};

interface CategorySkeletonProps {
  count?: number;
}

export const CategorySkeleton: React.FC<CategorySkeletonProps> = ({ count = 4 }) => {
  return (
    <View style={styles.categorySkeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonLoader 
          key={index} 
          width={80 + Math.random() * 40} 
          height={36} 
          borderRadius={18} 
          style={{ marginRight: 12 }}
        />
      ))}
    </View>
  );
};

interface SearchSkeletonProps {
  style?: ViewStyle;
}

export const SearchSkeleton: React.FC<SearchSkeletonProps> = ({ style }) => {
  return (
    <SkeletonLoader 
      width="100%" 
      height={48} 
      borderRadius={12} 
      style={style}
    />
  );
};

const getStyles = (Colors: any) => StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.skeletonBase,
  },
  pdfCardSkeleton: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  titleSection: {
    flex: 1,
    marginLeft: 12,
  },
  metaSection: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  descriptionSkeleton: {
    marginBottom: 12,
  },
  tagsSkeleton: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statsSkeleton: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 20,
  },
  actionsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categorySkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});

const styles = StyleSheet.create({
  categorySkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});