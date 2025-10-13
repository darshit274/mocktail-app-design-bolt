# 🔧 Mobile App Refactoring Plan

**Project**: Mocktail React Native App
**Created**: 2025-01-11
**Status**: In Progress
**Goal**: Improve code quality, reduce duplication, enhance type safety, optimize performance

---

## 📊 Current State Analysis

### Critical Issues Summary
1. **Monolithic Components**: 3 files over 800 lines each
2. **Code Duplication**: ~600 lines duplicated across files
3. **Poor TypeScript**: 25+ `any` types, no interfaces
4. **Style Duplication**: ~500 lines of repeated styles
5. **Zero Performance Optimization**: No memoization or React.memo

---

## 🎯 Refactoring Phases

### **PHASE 1: Break Down Monolithic Components (Week 1)**

#### **Task 1.1: Refactor `app/test/web-quiz.tsx` (1,307 lines)**

**Current Structure**:
```
web-quiz.tsx (1,307 lines)
├── Component Logic (462 lines)
├── 4 Modal Definitions (248 lines)
├── Grid Navigator (65 lines)
├── StyleSheet (845 lines)
└── Main Render (300 lines)
```

**Target Structure**:
```
app/test/web-quiz.tsx (150 lines) - Main orchestrator
components/quiz/
├── QuizHeader.tsx (80 lines)
├── QuizTimer.tsx (60 lines)
├── QuestionDisplay.tsx (120 lines)
├── OptionsGrid.tsx (100 lines)
├── QuizNavigation.tsx (80 lines)
├── modals/
│   ├── LanguageSelectionModal.tsx (100 lines)
│   ├── NegativeMarkingModal.tsx (120 lines)
│   ├── SubmitConfirmationModal.tsx (100 lines)
│   └── SubmissionLoaderModal.tsx (60 lines)
└── QuestionNavigatorGrid.tsx (150 lines)
hooks/
├── useQuizState.ts (100 lines)
└── useQuizTimer.ts (60 lines)
styles/
├── quizStyles.ts (200 lines)
└── modalStyles.ts (150 lines)
```

**Files to Create**:
1. `components/quiz/QuizHeader.tsx`
2. `components/quiz/QuizTimer.tsx`
3. `components/quiz/QuestionDisplay.tsx`
4. `components/quiz/OptionsGrid.tsx`
5. `components/quiz/QuizNavigation.tsx`
6. `components/quiz/modals/LanguageSelectionModal.tsx`
7. `components/quiz/modals/NegativeMarkingModal.tsx`
8. `components/quiz/modals/SubmitConfirmationModal.tsx`
9. `components/quiz/modals/SubmissionLoaderModal.tsx`
10. `components/quiz/QuestionNavigatorGrid.tsx`
11. `hooks/quiz/useQuizState.ts`
12. `hooks/quiz/useQuizTimer.ts`
13. `styles/quizStyles.ts`
14. `styles/modalStyles.ts`

---

#### **Task 1.2: Refactor `app/test/solutions.tsx` (1,378 lines)**

**Current Structure**:
```
solutions.tsx (1,378 lines)
├── Component Logic (400 lines)
├── Question Transformation (180 lines)
├── Practice Mode Logic (150 lines)
├── Grid Navigator (100 lines)
├── StyleSheet (548 lines)
└── Main Render (400 lines)
```

**Target Structure**:
```
app/test/solutions.tsx (120 lines) - Main orchestrator
components/solutions/
├── SolutionHeader.tsx (80 lines)
├── QuestionCard.tsx (150 lines)
├── AnswerOptions.tsx (120 lines)
├── ExplanationCard.tsx (100 lines)
├── PracticeModeToggle.tsx (80 lines)
├── ReattemptStatus.tsx (100 lines)
└── SolutionNavigation.tsx (80 lines)
hooks/
├── useSolutionsData.ts (100 lines)
└── usePracticeMode.ts (80 lines)
utils/
└── questionTransformers.ts (150 lines)
styles/
└── solutionsStyles.ts (200 lines)
```

**Files to Create**:
1. `components/solutions/SolutionHeader.tsx`
2. `components/solutions/QuestionCard.tsx`
3. `components/solutions/AnswerOptions.tsx`
4. `components/solutions/ExplanationCard.tsx`
5. `components/solutions/PracticeModeToggle.tsx`
6. `components/solutions/ReattemptStatus.tsx`
7. `components/solutions/SolutionNavigation.tsx`
8. `hooks/solutions/useSolutionsData.ts`
9. `hooks/solutions/usePracticeMode.ts`
10. `utils/questionTransformers.ts` (SHARED - used by quiz and solutions)
11. `styles/solutionsStyles.ts`

---

#### **Task 1.3: Refactor `app/test/results.tsx` (881 lines)**

**Current Structure**:
```
results.tsx (881 lines)
├── Component Logic (200 lines)
├── Chart Calculations (100 lines)
├── StyleSheet (400 lines)
└── Main Render (281 lines)
```

**Target Structure**:
```
app/test/results.tsx (100 lines) - Main orchestrator
components/results/
├── ResultsHeader.tsx (100 lines)
├── PerformanceBadge.tsx (60 lines)
├── StatsOverview.tsx (120 lines)
├── NegativeMarkingCard.tsx (100 lines)
├── PerformanceChart.tsx (120 lines)
├── SubjectAnalysis.tsx (150 lines)
└── ResultsActions.tsx (100 lines)
hooks/
└── useResultsData.ts (80 lines)
styles/
└── resultsStyles.ts (200 lines)
```

**Files to Create**:
1. `components/results/ResultsHeader.tsx`
2. `components/results/PerformanceBadge.tsx`
3. `components/results/StatsOverview.tsx`
4. `components/results/NegativeMarkingCard.tsx`
5. `components/results/PerformanceChart.tsx`
6. `components/results/SubjectAnalysis.tsx`
7. `components/results/ResultsActions.tsx`
8. `hooks/results/useResultsData.ts`
9. `styles/resultsStyles.ts`

---

### **PHASE 2: Extract Duplicated Code & Add Types (Week 2)**

#### **Task 2.1: Create TypeScript Interfaces**

**File**: `types/quiz.types.ts`
```typescript
export interface Question {
  id: number;
  question_text: string;
  question_text_gujarati: string;
  option_a: string;
  option_a_gujarati: string;
  option_b: string;
  option_b_gujarati: string;
  option_c: string;
  option_c_gujarati: string;
  option_d: string;
  option_d_gujarati: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  explanation_gujarati: string;
  subject: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
}

export interface QuizAnswer {
  questionId: number;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect: boolean;
  timeSpent: number;
  isMarkedForReview: boolean;
}

export interface QuizSubmission {
  userId: string;
  testSeriesId: string;
  answers: QuizAnswer[];
  totalTimeSpent: number;
  markedForReviewCount: number;
}

export interface QuizResult {
  leaderboardEntryId: number;
  score: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
}
```

**File**: `types/theme.types.ts`
```typescript
export interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  background: string;
  backgroundSecondary: string;
  cardBackground: string;
  text: string;
  textPrimary: string;
  textSecondary: string;
  textSubtle: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  danger: string;
  muted: string;
  white: string;
  shadow: string;
  // ... add all other theme properties
}
```

**File**: `types/api.types.ts`
```typescript
export interface ApiError {
  status: number;
  data: {
    success: false;
    message: string;
    error?: string;
  };
}

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}
```

---

#### **Task 2.2: Extract Validation Utilities**

**File**: `utils/validation.ts`
```typescript
import { TFunction } from '@/contexts/LanguageContext';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validatePassword = (password: string): boolean => {
  return password.trim().length >= 6;
};

export const validateOTP = (otp: string): boolean => {
  return otp.trim().length === 4;
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateLoginForm = (
  email: string,
  password: string,
  t: TFunction
): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: t.auth.validation.emailRequired };
  }
  if (!validateEmail(email)) {
    return { isValid: false, error: t.auth.validation.invalidEmail };
  }
  if (!password.trim()) {
    return { isValid: false, error: t.auth.validation.passwordRequired };
  }
  return { isValid: true };
};

export const validateSignupForm = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
  t: TFunction
): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, error: t.auth.validation.nameRequired };
  }
  if (!email.trim()) {
    return { isValid: false, error: t.auth.validation.emailRequired };
  }
  if (!validateEmail(email)) {
    return { isValid: false, error: t.auth.validation.invalidEmail };
  }
  if (!password.trim()) {
    return { isValid: false, error: t.auth.validation.passwordRequired };
  }
  if (password.length < 6) {
    return { isValid: false, error: t.auth.validation.passwordMinLength };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: t.auth.validation.passwordMismatch };
  }
  return { isValid: true };
};
```

---

#### **Task 2.3: Extract Error Handling**

**File**: `utils/errorHandler.ts`
```typescript
import Toast from 'react-native-toast-message';
import { ApiError } from '@/types/api.types';
import { TFunction } from '@/contexts/LanguageContext';

export const handleApiError = (
  error: unknown,
  defaultMessage: string,
  t: TFunction,
  dispatch?: any
) => {
  const apiError = error as ApiError;
  const errorMessage = apiError?.data?.message || defaultMessage;

  if (dispatch) {
    dispatch(setError(errorMessage));
  }

  Toast.show({
    type: 'error',
    text1: t.common.error,
    text2: errorMessage,
  });
};

export const handleValidationError = (
  errorMessage: string,
  t: TFunction
) => {
  Toast.show({
    type: 'error',
    text1: t.common.error,
    text2: errorMessage,
  });
};

export const handleSuccess = (
  title: string,
  message: string
) => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
  });
};
```

---

#### **Task 2.4: Extract Question Transformers (SHARED)**

**File**: `utils/questionTransformers.ts`
```typescript
import { Question } from '@/types/quiz.types';

export const preserveLineBreaks = (text: string): string => {
  if (!text) return '';
  return text.replace(/\\n/g, '\n');
};

export const getQuestionText = (
  question: Question,
  useGujarati: boolean
): string => {
  let text = '';
  if (useGujarati) {
    text = question.question_text_gujarati || question.question_text || 'No question available';
  } else {
    text = question.question_text || question.question_text_gujarati || 'No question available';
  }
  return preserveLineBreaks(text);
};

export const getOptionText = (
  question: Question,
  optionKey: 'A' | 'B' | 'C' | 'D',
  useGujarati: boolean
): string => {
  const gujaratiKey = `option_${optionKey.toLowerCase()}_gujarati` as keyof Question;
  const englishKey = `option_${optionKey.toLowerCase()}` as keyof Question;

  let text = '';
  if (useGujarati) {
    text = (question[gujaratiKey] as string) || (question[englishKey] as string) || `Option ${optionKey}`;
  } else {
    text = (question[englishKey] as string) || (question[gujaratiKey] as string) || `Option ${optionKey}`;
  }
  return preserveLineBreaks(text);
};

export const getExplanation = (
  question: Question,
  useGujarati: boolean
): string => {
  const explanation = useGujarati
    ? (question.explanation_gujarati || question.explanation || 'No explanation available.')
    : (question.explanation || question.explanation_gujarati || 'No explanation available.');
  return preserveLineBreaks(explanation);
};

export const transformQuestion = (
  question: any,
  useGujarati: boolean,
  index: number
): Question => {
  return {
    id: question.id || index + 1,
    question_text: question.question_text || '',
    question_text_gujarati: question.question_text_gujarati || '',
    option_a: question.option_a || '',
    option_a_gujarati: question.option_a_gujarati || '',
    option_b: question.option_b || '',
    option_b_gujarati: question.option_b_gujarati || '',
    option_c: question.option_c || '',
    option_c_gujarati: question.option_c_gujarati || '',
    option_d: question.option_d || '',
    option_d_gujarati: question.option_d_gujarati || '',
    correct_answer: question.correct_answer || question.correct_option || 'A',
    explanation: question.explanation || '',
    explanation_gujarati: question.explanation_gujarati || '',
    subject: question.subject || 'General',
    difficulty_level: question.difficulty_level || 'medium',
  };
};
```

---

### **PHASE 3: Extract Common Styles (Week 3)**

#### **Task 3.1: Create Modal Styles**

**File**: `styles/modalStyles.ts`
```typescript
import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/types/theme.types';

export const createModalStyles = (Colors: ThemeColors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  modalPrimaryButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
```

---

#### **Task 3.2: Create Card Styles**

**File**: `styles/cardStyles.ts`
```typescript
import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/types/theme.types';

export const createCardStyles = (Colors: ThemeColors) => StyleSheet.create({
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSubtle,
    marginTop: 4,
  },
});
```

---

### **PHASE 4: Add Performance Optimizations**

#### **Task 4.1: Add Memoization to Components**

**Example**: `components/quiz/OptionsGrid.tsx`
```typescript
import React, { memo } from 'react';

interface OptionsGridProps {
  options: string[];
  selectedOption: string | null;
  onSelect: (option: 'A' | 'B' | 'C' | 'D') => void;
}

export const OptionsGrid = memo<OptionsGridProps>(({ options, selectedOption, onSelect }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return prevProps.selectedOption === nextProps.selectedOption &&
         prevProps.options === nextProps.options;
});
```

---

#### **Task 4.2: Add useCallback for Event Handlers**

**Example**: In main quiz component
```typescript
const handleAnswerSelect = useCallback((questionId: string, option: 'A' | 'B' | 'C' | 'D') => {
  setSelectedAnswers(prev => ({
    ...prev,
    [questionId]: option
  }));
}, []);

const handleFlagQuestion = useCallback((questionId: string) => {
  setFlaggedQuestions(prev => {
    const newSet = new Set(prev);
    if (newSet.has(questionId)) {
      newSet.delete(questionId);
    } else {
      newSet.add(questionId);
    }
    return newSet;
  });
}, []);
```

---

## 📝 Progress Tracking

### Phase 1: Component Breakdown
- [ ] Task 1.1: Refactor web-quiz.tsx (14 files)
  - [ ] Create QuizHeader component
  - [ ] Create QuizTimer component
  - [ ] Create QuestionDisplay component
  - [ ] Create OptionsGrid component
  - [ ] Create QuizNavigation component
  - [ ] Create LanguageSelectionModal
  - [ ] Create NegativeMarkingModal
  - [ ] Create SubmitConfirmationModal
  - [ ] Create SubmissionLoaderModal
  - [ ] Create QuestionNavigatorGrid
  - [ ] Create useQuizState hook
  - [ ] Create useQuizTimer hook
  - [ ] Create quizStyles
  - [ ] Update web-quiz.tsx to use new components

- [ ] Task 1.2: Refactor solutions.tsx (11 files)
  - [ ] Create SolutionHeader component
  - [ ] Create QuestionCard component
  - [ ] Create AnswerOptions component
  - [ ] Create ExplanationCard component
  - [ ] Create PracticeModeToggle component
  - [ ] Create ReattemptStatus component
  - [ ] Create SolutionNavigation component
  - [ ] Create useSolutionsData hook
  - [ ] Create usePracticeMode hook
  - [ ] Create questionTransformers utility
  - [ ] Update solutions.tsx to use new components

- [ ] Task 1.3: Refactor results.tsx (9 files)
  - [ ] Create ResultsHeader component
  - [ ] Create PerformanceBadge component
  - [ ] Create StatsOverview component
  - [ ] Create NegativeMarkingCard component
  - [ ] Create PerformanceChart component
  - [ ] Create SubjectAnalysis component
  - [ ] Create ResultsActions component
  - [ ] Create useResultsData hook
  - [ ] Update results.tsx to use new components

### Phase 2: Code Quality
- [ ] Task 2.1: Create TypeScript interfaces (3 files)
  - [ ] Create quiz.types.ts
  - [ ] Create theme.types.ts
  - [ ] Create api.types.ts

- [ ] Task 2.2: Extract validation utilities
  - [ ] Create validation.ts

- [ ] Task 2.3: Extract error handling
  - [ ] Create errorHandler.ts

- [ ] Task 2.4: Already done in Task 1.2 (questionTransformers.ts)

- [ ] Task 2.5: Replace all `any` types
  - [ ] Update auth screens
  - [ ] Update quiz components
  - [ ] Update solution components
  - [ ] Update results components

### Phase 3: Style Extraction
- [ ] Task 3.1: Create modalStyles.ts
- [ ] Task 3.2: Create cardStyles.ts
- [ ] Task 3.3: Update all components to use shared styles

### Phase 4: Performance
- [ ] Task 4.1: Add React.memo to components
- [ ] Task 4.2: Add useCallback to event handlers
- [ ] Task 4.3: Add useMemo for expensive calculations

---

## 🎯 Success Metrics

### Before Refactoring
- **web-quiz.tsx**: 1,307 lines
- **solutions.tsx**: 1,378 lines
- **results.tsx**: 881 lines
- **Total**: 3,566 lines in 3 files
- **Duplicated code**: ~600 lines
- **Any types**: 25+
- **Max file size**: 1,378 lines

### After Refactoring (Target)
- **web-quiz.tsx**: ~150 lines
- **solutions.tsx**: ~120 lines
- **results.tsx**: ~100 lines
- **Total**: ~370 lines in main files + ~2,500 lines in organized components
- **Duplicated code**: <50 lines
- **Any types**: 0
- **Max file size**: ~200 lines

---

## 📚 Reference Links

### Key Files to Refactor
1. `app/test/web-quiz.tsx` (1,307 lines)
2. `app/test/solutions.tsx` (1,378 lines)
3. `app/test/results.tsx` (881 lines)
4. `app/(auth)/login.tsx` (163 lines)
5. `app/(auth)/signup.tsx` (158 lines)
6. `app/(auth)/forgot-password.tsx` (104 lines)
7. `app/(auth)/otp-verify.tsx` (208 lines)

### Shared Components Already Available
- `components/shared/AuthLayout.tsx`
- `components/shared/FormInput.tsx`
- `components/shared/GradientButton.tsx`
- `components/shared/LinkText.tsx`
- `components/shared/QuestionCard.tsx`
- `components/shared/OptionsList.tsx`
- `components/shared/QuestionNavigator.tsx`

---

## 🚀 Getting Started

1. **Read this document fully** before starting any refactoring
2. **Work in order**: Complete Phase 1 before Phase 2, etc.
3. **Test after each component**: Ensure functionality works before moving on
4. **Update progress**: Check off tasks as you complete them
5. **Commit frequently**: Small commits make it easier to rollback if needed

---

**Last Updated**: 2025-01-11
**Next Review**: After Phase 1 completion
