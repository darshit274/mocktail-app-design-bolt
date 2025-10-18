import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  Calendar,
  School,
  MapPin,
  Save,
  Loader2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { useGetProfileQuery, useUpdateProfileMutation } from '@/store/api/userApi';
import { setCredentials } from '@/store/slices/authSlice';
import Toast from 'react-native-toast-message';
import logger from '@/utils/logger';

const settingsLogger = logger.createLogger('AccountSettings');

interface ProfileFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  schoolName: string;
  city: string;
  state: string;
  avatarUrl?: string;
}

export default function AccountSettingsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const { data: profileData, isLoading: loadingProfile } = useGetProfileQuery();
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();

  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    schoolName: '',
    city: '',
    state: '',
    avatarUrl: '',
  });

  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (profileData?.data) {
      const profile = profileData.data;
      setFormData({
        fullName: profile.fullName || profile.username || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        dateOfBirth: profile.dateOfBirth || '',
        schoolName: profile.schoolName || '',
        city: profile.city || '',
        state: profile.state || '',
        avatarUrl: profile.avatarUrl || '',
      });
      setImageUri(profile.avatarUrl || null);
      
      // Set the date picker date if dateOfBirth exists
      if (profile.dateOfBirth) {
        setSelectedDate(new Date(profile.dateOfBirth));
      }
    }
  }, [profileData]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      handleInputChange('dateOfBirth', formattedDate);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber.replace(/[^\d]/g, ''))) {
      newErrors.phoneNumber = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      // Request permissions based on platform
      if (Platform.OS === 'web') {
        // For web, directly launch the image picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true, // Enable base64 for consistency
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          setImageUri(result.assets[0].uri);
          setHasChanges(true);
        }
      } else {
        // For native platforms, check permissions first
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please grant photo library permissions to upload a profile picture.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => {
                // This will open app settings on iOS/Android
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }}
            ]
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true, // Enable base64 for consistency
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          // For mobile, we'll use the URI which will be converted to base64 by the API layer
          setImageUri(result.assets[0].uri);
          setHasChanges(true);
        }
      }
    } catch (error) {
      settingsLogger.error('Error picking image', error);
      Toast.show({
        type: 'error',
        text1: 'Image Selection Failed',
        text2: 'Unable to select image. Please try again.',
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare update data
      const updateData: any = {
        ...formData,
        dateOfBirth: formData.dateOfBirth && formData.dateOfBirth !== '' 
          ? formData.dateOfBirth 
          : null,
      };

      // Handle image upload
      if (imageUri && imageUri !== formData.avatarUrl) {
        settingsLogger.info('Image changed', {
          hasNewImage: !!imageUri,
          hadPreviousAvatar: !!formData.avatarUrl
        });

        // Both web and mobile now use the same approach - pass the URI/blob
        // The API layer will handle base64 conversion
        updateData.avatar = imageUri;
        settingsLogger.debug('Added avatar to update data');
      }

      const result = await updateProfile(updateData).unwrap();

      // Update the local image URI if the update was successful
      if (result.data?.avatarUrl) {
        setImageUri(result.data.avatarUrl);
      }

      // Update Redux state with the new profile data
      if (token) {
        dispatch(setCredentials({
          user: result.data,
          token: token
        }));
      }

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated successfully',
      });

      setHasChanges(false);
      router.back();
    } catch (error) {
      settingsLogger.error('Update error', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update profile. Please try again.',
      });
    }
  };

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
            {imageUri ? (
              <Image 
                source={{ uri: imageUri }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <User size={40} color={Colors.textSubtle} />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Camera size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
              <User size={20} color={Colors.textSubtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.textSubtle}
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
              />
            </View>
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Mail size={20} color={Colors.textSubtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textSubtle}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false} // Email should not be editable
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={[styles.inputContainer, errors.phoneNumber && styles.inputError]}>
              <Phone size={20} color={Colors.textSubtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor={Colors.textSubtle}
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.inputContainer}>
                <Calendar size={20} color={Colors.textSubtle} style={styles.inputIcon} />
                <input
                  type="date"
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: Colors.textPrimary,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                  } as any}
                  value={formData.dateOfBirth || ''}
                  onChange={(e: any) => handleInputChange('dateOfBirth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]} // Max date is today
                />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={Colors.textSubtle} style={styles.inputIcon} />
                <Text style={[
                  styles.input, 
                  { 
                    color: formData.dateOfBirth ? Colors.textPrimary : Colors.textSubtle,
                    paddingVertical: Platform.OS === 'ios' ? 18 : 16,
                  }
                ]}>
                  {formData.dateOfBirth ? formatDisplayDate(formData.dateOfBirth) : 'Select Date'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* School Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>School/Institution</Text>
            <View style={styles.inputContainer}>
              <School size={20} color={Colors.textSubtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your school name"
                placeholderTextColor={Colors.textSubtle}
                value={formData.schoolName}
                onChangeText={(value) => handleInputChange('schoolName', value)}
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>City</Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color={Colors.textSubtle} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor={Colors.textSubtle}
                  value={formData.city}
                  onChangeText={(value) => handleInputChange('city', value)}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>State</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { paddingLeft: 12 }]}
                  placeholder="State"
                  placeholderTextColor={Colors.textSubtle}
                  value={formData.state}
                  onChangeText={(value) => handleInputChange('state', value)}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasChanges || updating) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || updating}
        >
          {updating ? (
            <Loader2 size={20} color={Colors.white} />
          ) : (
            <Save size={20} color={Colors.white} />
          )}
          <Text style={styles.saveButtonText}>
            {updating ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal - Only for native platforms */}
      {showDatePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()} // Can't select future dates for birth date
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  changePhotoText: {
    fontSize: 14,
    color: Colors.primary,
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 50,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});