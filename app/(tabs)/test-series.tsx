import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Filter } from "lucide-react-native";
import { router } from "expo-router";
import { getTheme } from "@/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useGetDynamicTestSeriesQuery,
  DynamicTestSeries,
} from "@/store/api/dynamicHierarchyApi";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import {
  useMultipleSubscriptionAccess,
  getSeriesButtonState,
} from "@/hooks/useSubscriptionAccess";
import { TestSeriesCard } from "@/components/test-series";

export default function TestSeriesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");

  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);

  const { data, error, isLoading, refetch } = useGetDynamicTestSeriesQuery({
    page,
    limit: 20,
    search: searchQuery || undefined,
  });

  // ==== Client filter fixes ====
  const allTestSeries = data?.data || [];

  const filteredSeries = useMemo(() => {
    let filtered = allTestSeries;

    if (filter === "free") {
      filtered = filtered.filter((item) => Number(item.price) === 0);
    }

    if (filter === "paid") {
      filtered = filtered.filter((item) => Number(item.price) > 0);
    }

    return filtered.filter(
      (series) => series.pricing_type !== "previous_years_question_papers"
    );
  }, [allTestSeries, filter]);

  // access
  const seriesIds = filteredSeries.map((s) => s.id);
  const { accessDataMap } = useMultipleSubscriptionAccess(seriesIds);

  const handleSelect = useCallback((series: DynamicTestSeries) => {
    router.push({
      pathname: "/test/series-detail",
      params: { seriesUuid: series.uuid, title: series.name },
    });
  }, []);

  const handlePurchase = useCallback(
    (series: DynamicTestSeries) => {
      const accessData = accessDataMap[series.id];
      const buttonState = getSeriesButtonState(accessData);

      if (!buttonState.showEnrollButton || buttonState.isDisabled) return;

      router.push({
        pathname: "/payment",
        params: {
          seriesId: series.id.toString(),
          title: series.name,
          price: series.price.toString(),
          type: "test-series",
        },
      });
    },
    [accessDataMap]
  );

  const styles = useMemo(() => getStyles(Colors), [Colors]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Test Series</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilter(p=>!p)}>
          <Filter size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textSubtle} />
          <TextInput
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* FILTER BUTTONS */}
       {showFilter && <View style={styles.filterRow}>
          {["all", "free", "paid"].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f as any)}
              style={[
                styles.filterChip,
                filter === f && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f && { color: Colors.white },
                ]}
              >
                {f === "all" ? "All" : f === "free" ? "Free" : "Paid"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>}
      </View>

      {/* LIST */}
      <FlatList
        data={filteredSeries}
        keyExtractor={(item) => item.id.toString()}
        // numColumns={2}
        // columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          isLoading ? (
<View style={styles.content}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={styles.seriesCard}>
                <SkeletonLoader width="70%" height={20} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="100%" height={16} style={{ marginBottom: 16 }} />
                <View style={styles.statsContainer}>
                  <SkeletonLoader width={80} height={16} />
                  <SkeletonLoader width={80} height={16} />
                  <SkeletonLoader width={80} height={16} />
                </View>
                <SkeletonLoader width="100%" height={48} style={{ marginTop: 16, borderRadius: 12 }} />
              </View>
            ))}
          </View>          ) : (
            <Text style={{ textAlign: "center", marginTop: 40 }}>
              No test series found
            </Text>
          )
        }
        renderItem={({ item, index }) => {
          const accessData = accessDataMap[item.id];
          const buttonState = getSeriesButtonState(accessData);

          return (
            <TestSeriesCard
              series={item}
              index={index}
              accessData={accessData}
              buttonState={buttonState}
              onPress={handleSelect}
              onPurchase={handlePurchase}
              Colors={Colors}
              compact // 👈 added flag for slim layout
            />
          );
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },

    header: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: Colors.cardBackground,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    headerTitle: { fontSize: 20, fontWeight: "600", color: Colors.textPrimary },
    filterButton: { padding: 6 },

    searchContainer: { padding: 12 },
    searchBar: {
      flexDirection: "row",
      padding: 10,
      backgroundColor: Colors.light,
      borderRadius: 10,
      alignItems: "center",
    },
    searchInput: {
      marginLeft: 10,
      flex: 1,
      fontSize: 14,
      color: Colors.textPrimary,
    }, content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

    columnWrapper: {
      justifyContent: "space-between",
      marginBottom: 12,
    },

    // filter chips
    filterRow: {
      flexDirection: "row",
      marginTop: 10,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: Colors.light,
    }, seriesCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
    filterChipActive: {
      backgroundColor: Colors.primary,
    },
    filterChipText: {
      fontSize: 13,
      color: Colors.textSubtle,
    },  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  });
