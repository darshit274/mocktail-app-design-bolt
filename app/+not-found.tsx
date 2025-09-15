import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);
  return (
    <>
      <Stack.Screen options={{ title: t.common.oops }} />
      <View style={styles.container}>
        <Text style={styles.text}>{t.common.screenNotExist}</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t.common.goToHome}</Text>
        </Link>
      </View>
    </>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    color: Colors.textLink,
    fontSize: 16,
  },
});
