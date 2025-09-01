import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Image, Clipboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Share2, Copy, Trophy, Star, TrendingUp, Users, Instagram, 
  Twitter, MessageCircle, Download, Camera, CheckCircle 
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface TestResult {
  score: number;
  percentage: number;
  rank: number;
  testName: string;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  percentile: number;
  completionDate: string;
}

interface TestSharingFeaturesProps {
  testResult: TestResult;
  onClose?: () => void;
}

export default function TestSharingFeatures({ testResult, onClose }: TestSharingFeaturesProps) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [sharedSuccessfully, setSharedSuccessfully] = useState(false);
  
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(isDarkMode);
  const styles = getStyles(Colors);
  
  const achievementCardRef = React.useRef<View>(null);
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };
  
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { label: 'Excellent', emoji: '🏆', color: Colors.success };
    if (percentage >= 80) return { label: 'Very Good', emoji: '⭐', color: Colors.success };
    if (percentage >= 70) return { label: 'Good', emoji: '👍', color: Colors.warning };
    if (percentage >= 60) return { label: 'Average', emoji: '📚', color: Colors.warning };
    return { label: 'Keep Learning', emoji: '💪', color: Colors.error };
  };
  
  const performance = getPerformanceLevel(testResult.percentage);
  
  // Generate shareable text content
  const generateShareText = (format: 'basic' | 'detailed' | 'motivational' = 'basic') => {
    const baseText = `🎯 Just completed "${testResult.testName}"!\n\n`;
    
    if (format === 'basic') {
      return `${baseText}📊 Score: ${testResult.percentage.toFixed(1)}%\n🏆 Rank: #${testResult.rank}\n⏱️ Time: ${formatTime(testResult.timeTaken)}\n\n#MocktailAcademy #TestSuccess`;
    }
    
    if (format === 'detailed') {
      return `${baseText}📊 Score: ${testResult.percentage.toFixed(1)}% (${testResult.correctAnswers}/${testResult.totalQuestions})\n🏆 Rank: #${testResult.rank} (Top ${testResult.percentile}%)\n⏱️ Time: ${formatTime(testResult.timeTaken)}\n${performance.emoji} Performance: ${performance.label}\n\n💪 Ready to challenge yourself? Join me on Mocktail Academy!\n#MocktailAcademy #TestSuccess #Learning`;
    }
    
    if (format === 'motivational') {
      const motivationalMessages = [
        "Every test is a step forward! 🚀",
        "Practice makes perfect! 📚",
        "Learning never stops! 🎓",
        "Challenging myself every day! 💪",
        "Knowledge is power! ⚡"
      ];
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      
      return `${baseText}${performance.emoji} ${performance.label} performance!\n📊 ${testResult.percentage.toFixed(1)}% | 🏆 Rank #${testResult.rank}\n\n${randomMessage}\n#MocktailAcademy #NeverStopLearning`;
    }
    
    return baseText;
  };
  
  // Share via native sharing
  const shareResult = async (format: 'basic' | 'detailed' | 'motivational' = 'basic') => {
    try {
      const shareText = generateShareText(format);
      
      const result = await Share.share({
        message: shareText,
        title: `Test Result - ${testResult.testName}`,
      });
      
      if (result.action === Share.sharedAction) {
        setSharedSuccessfully(true);
        setTimeout(() => setSharedSuccessfully(false), 3000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share result');
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      const text = generateShareText('detailed');
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied!', 'Result details copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };
  
  // Generate achievement card image
  const generateAchievementImage = async () => {
    if (!achievementCardRef.current) return;
    
    setIsGeneratingImage(true);
    try {
      // Capture the achievement card as image
      const uri = await captureRef(achievementCardRef.current, {
        format: 'png',
        quality: 1.0,
      });
      
      // Share the image
      await Share.share({
        url: uri,
        message: generateShareText('motivational'),
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to generate achievement image');
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  // Social media specific sharing
  const shareToSocialMedia = async (platform: 'instagram' | 'twitter' | 'whatsapp') => {
    const text = generateShareText('motivational');
    let url = '';
    
    switch (platform) {
      case 'instagram':
        // For Instagram, we'll generate an image and let user share
        await generateAchievementImage();
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
    }
    
    if (url) {
      // In a real app, you'd open the URL or use a deep link
      await Share.share({ message: text });
    }
  };
  
  // Challenge friends
  const challengeFriends = () => {
    const challengeText = `🎯 I just scored ${testResult.percentage.toFixed(1)}% on "${testResult.testName}"!\n\n💪 Think you can beat my score? Take the challenge on Mocktail Academy!\n\n🏆 Current leaderboard position: #${testResult.rank}\n⏱️ My time: ${formatTime(testResult.timeTaken)}\n\n#MocktailChallenge #BeatMyScore`;
    
    Share.share({
      message: challengeText,
      title: `Challenge: ${testResult.testName}`,
    });
  };
  
  return (
    <View style={styles.container}>
      {/* Achievement Card for Image Generation */}
      <View ref={achievementCardRef} style={styles.achievementCard}>
        <LinearGradient
          colors={[performance.color, `${performance.color}80`]}
          style={styles.achievementGradient}
        >
          <View style={styles.achievementHeader}>
            <Text style={styles.achievementTitle}>Test Completed! 🎉</Text>
            <Text style={styles.testName}>{testResult.testName}</Text>
          </View>
          
          <View style={styles.achievementStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{testResult.percentage.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>#{testResult.rank}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{testResult.percentile}th</Text>
              <Text style={styles.statLabel}>Percentile</Text>
            </View>
          </View>
          
          <View style={styles.achievementPerformance}>
            <Text style={styles.performanceEmoji}>{performance.emoji}</Text>
            <Text style={styles.performanceText}>{performance.label} Performance!</Text>
          </View>
          
          <Text style={styles.achievementFooter}>Mocktail Academy</Text>
        </LinearGradient>
      </View>
      
      {/* Sharing Options */}
      <View style={styles.sharingSection}>
        <Text style={styles.sectionTitle}>Share Your Success! 🎊</Text>
        
        {/* Quick Share Buttons */}
        <View style={styles.quickShareButtons}>
          <TouchableOpacity 
            style={styles.primaryShareButton}
            onPress={() => shareResult('detailed')}
          >
            <Share2 size={20} color={Colors.background} />
            <Text style={styles.primaryShareButtonText}>Share Result</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryShareButton}
            onPress={copyToClipboard}
          >
            <Copy size={18} color={Colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryShareButton}
            onPress={generateAchievementImage}
            disabled={isGeneratingImage}
          >
            {isGeneratingImage ? (
              <Camera size={18} color={Colors.textSecondary} />
            ) : (
              <Download size={18} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Social Media Options */}
        <View style={styles.socialButtons}>
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#E1306C20' }]}
            onPress={() => shareToSocialMedia('instagram')}
          >
            <Instagram size={20} color="#E1306C" />
            <Text style={[styles.socialButtonText, { color: '#E1306C' }]}>Instagram</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#1DA1F220' }]}
            onPress={() => shareToSocialMedia('twitter')}
          >
            <Twitter size={20} color="#1DA1F2" />
            <Text style={[styles.socialButtonText, { color: '#1DA1F2' }]}>Twitter</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#25D36620' }]}
            onPress={() => shareToSocialMedia('whatsapp')}
          >
            <MessageCircle size={20} color="#25D366" />
            <Text style={[styles.socialButtonText, { color: '#25D366' }]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
        
        {/* Challenge Friends */}
        <TouchableOpacity style={styles.challengeButton} onPress={challengeFriends}>
          <Users size={20} color={Colors.warning} />
          <Text style={styles.challengeButtonText}>Challenge Friends</Text>
          <TrendingUp size={16} color={Colors.warning} />
        </TouchableOpacity>
        
        {/* Share Templates */}
        <View style={styles.templatesSection}>
          <Text style={styles.templatesTitle}>Quick Share Templates:</Text>
          
          <TouchableOpacity 
            style={styles.templateButton}
            onPress={() => shareResult('basic')}
          >
            <Text style={styles.templateText}>📊 Basic Result Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.templateButton}
            onPress={() => shareResult('motivational')}
          >
            <Text style={styles.templateText}>💪 Motivational Post</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.templateButton}
            onPress={() => shareResult('detailed')}
          >
            <Text style={styles.templateText}>📈 Detailed Analysis</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Success Indicator */}
      {sharedSuccessfully && (
        <View style={styles.successBanner}>
          <CheckCircle size={16} color={Colors.success} />
          <Text style={styles.successText}>Shared successfully! 🎉</Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  achievementCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  achievementGradient: {
    padding: 24,
    alignItems: 'center',
  },
  achievementHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.background,
    textAlign: 'center',
  },
  testName: {
    fontSize: 16,
    color: Colors.background,
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },
  achievementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.background,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.background,
    opacity: 0.8,
    marginTop: 4,
  },
  achievementPerformance: {
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  performanceText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.background,
  },
  achievementFooter: {
    fontSize: 14,
    color: Colors.background,
    opacity: 0.7,
    fontWeight: '500',
  },
  sharingSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  quickShareButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  primaryShareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  primaryShareButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryShareButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  challengeButtonText: {
    color: Colors.warning,
    fontSize: 16,
    fontWeight: '600',
  },
  templatesSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  templatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  templateButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  successBanner: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  successText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
});

export { TestSharingFeatures };