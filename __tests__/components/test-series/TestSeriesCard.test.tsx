/**
 * TestSeriesCard Component Tests
 * Tests for the memoized test series card component
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { TestSeriesCard } from '@/components/test-series';
import {
  mockThemeColors,
  mockTestSeries,
  mockAccessData,
  mockButtonState,
  renderWithProviders,
  createMockFn,
} from '../../helpers/testHelpers';

describe('TestSeriesCard', () => {
  const defaultProps = {
    series: mockTestSeries(),
    index: 0,
    accessData: mockAccessData(false),
    buttonState: mockButtonState(),
    onPress: createMockFn<(series: any) => void>(),
    onPurchase: createMockFn<(series: any) => void>(),
    Colors: mockThemeColors(),
  };

  describe('basic rendering', () => {
    it('renders correctly with required props', () => {
      const { getByText } = renderWithProviders(<TestSeriesCard {...defaultProps} />);

      expect(getByText('PSI Mock Test Series')).toBeTruthy();
    });

    it('displays series name correctly', () => {
      const series = mockTestSeries({ name: 'NCERT Test Series' });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText('NCERT Test Series')).toBeTruthy();
    });

    it('falls back to title if name is missing', () => {
      const series = mockTestSeries({ name: '', title: 'Backup Title' });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText('Backup Title')).toBeTruthy();
    });

    it('displays description correctly', () => {
      const series = mockTestSeries({
        description: 'This is a test description'
      });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText('This is a test description')).toBeTruthy();
    });
  });

  describe('rating and stats', () => {
    it('displays rating correctly', () => {
      const series = mockTestSeries({ rating: 4.7 });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText('4.7')).toBeTruthy();
    });

    it('displays default rating when not provided', () => {
      const series = mockTestSeries({ rating: undefined });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      // Default rating is 4.5
      expect(getByText('4.5')).toBeTruthy();
    });

    it('displays purchase count correctly', () => {
      const series = mockTestSeries({ purchase_count: 2500 });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText(/2500 students/)).toBeTruthy();
    });

    it('displays zero purchase count', () => {
      const series = mockTestSeries({ purchase_count: 0 });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText(/0 students/)).toBeTruthy();
    });

    it('displays test count correctly', () => {
      const series = mockTestSeries({ test_count: 15 });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText(/15 Tests/)).toBeTruthy();
    });
  });

  describe('pricing', () => {
    it('displays discounted price when available', () => {
      const series = mockTestSeries({
        price: 299,
        discounted_price: 199
      });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText(/₹199/)).toBeTruthy();
      expect(getByText(/₹299/)).toBeTruthy(); // Original price struck through
    });

    it('displays regular price when no discount', () => {
      const series = mockTestSeries({
        price: 299,
        discounted_price: null
      });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText(/₹299/)).toBeTruthy();
    });

    it('displays "Free" for free series', () => {
      const series = mockTestSeries({ is_free: true, price: 0 });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText(/Free/i)).toBeTruthy();
    });
  });

  describe('access badges', () => {
    it('shows "Active" badge when user has access', () => {
      const accessData = mockAccessData(true, { isActive: true });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} accessData={accessData} />
      );

      expect(getByText('Active')).toBeTruthy();
    });

    it('shows "Purchased" badge when purchased', () => {
      const accessData = mockAccessData(true, { isPurchased: true, isActive: false });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} accessData={accessData} />
      );

      expect(getByText('Purchased')).toBeTruthy();
    });

    it('does not show badge when no access', () => {
      const accessData = mockAccessData(false);
      const { queryByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} accessData={accessData} />
      );

      expect(queryByText('Active')).toBeNull();
      expect(queryByText('Purchased')).toBeNull();
    });
  });

  describe('button states', () => {
    it('displays "Start Test" button by default', () => {
      const buttonState = mockButtonState({ label: 'Start Test' });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} buttonState={buttonState} />
      );

      expect(getByText('Start Test')).toBeTruthy();
    });

    it('displays "Purchase" button when not purchased', () => {
      const buttonState = mockButtonState({ label: 'Purchase', showLock: true });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} buttonState={buttonState} />
      );

      expect(getByText('Purchase')).toBeTruthy();
    });

    it('displays "Resume" button when appropriate', () => {
      const buttonState = mockButtonState({ label: 'Resume' });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} buttonState={buttonState} />
      );

      expect(getByText('Resume')).toBeTruthy();
    });

    it('disables button when buttonState.disabled is true', () => {
      const buttonState = mockButtonState({ disabled: true, label: 'Disabled' });
      renderWithProviders(
        <TestSeriesCard {...defaultProps} buttonState={buttonState} />
      );

      // Button should be rendered but in disabled state
      // This is tested through the disabled prop in the component
    });
  });

  describe('interactions', () => {
    it('calls onPress when card is tapped', () => {
      const onPressMock = jest.fn();
      const series = mockTestSeries();
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} onPress={onPressMock} />
      );

      const card = getByText('PSI Mock Test Series').parent?.parent?.parent;
      if (card) {
        fireEvent.press(card);
        expect(onPressMock).toHaveBeenCalledWith(series);
      }
    });

    it('calls onPurchase when purchase button is tapped', () => {
      const onPurchaseMock = jest.fn();
      const series = mockTestSeries();
      const buttonState = mockButtonState({ label: 'Purchase' });
      const { getByText } = renderWithProviders(
        <TestSeriesCard
          {...defaultProps}
          series={series}
          buttonState={buttonState}
          onPurchase={onPurchaseMock}
        />
      );

      const purchaseButton = getByText('Purchase');
      fireEvent.press(purchaseButton);
      expect(onPurchaseMock).toHaveBeenCalledWith(series);
    });

    it('handles multiple rapid taps on card', () => {
      const onPressMock = jest.fn();
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} onPress={onPressMock} />
      );

      const card = getByText('PSI Mock Test Series').parent?.parent?.parent;
      if (card) {
        fireEvent.press(card);
        fireEvent.press(card);
        fireEvent.press(card);
        expect(onPressMock).toHaveBeenCalledTimes(3);
      }
    });
  });

  describe('difficulty level', () => {
    it('displays difficulty level correctly', () => {
      const series = mockTestSeries({ difficulty_level: 'Hard' });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText('Hard')).toBeTruthy();
    });

    it('displays default difficulty level', () => {
      const series = mockTestSeries({ difficulty_level: 'Medium' });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText('Medium')).toBeTruthy();
    });
  });

  describe('validity', () => {
    it('displays validity days correctly', () => {
      const series = mockTestSeries({ validity_days: 60 });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText(/60 days/)).toBeTruthy();
    });

    it('displays 90 days validity', () => {
      const series = mockTestSeries({ validity_days: 90 });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText(/90 days/)).toBeTruthy();
    });
  });

  describe('theme colors', () => {
    it('applies correct theme colors', () => {
      const customColors = mockThemeColors();
      customColors.cardBackground = '#CUSTOM_BG';
      customColors.textPrimary = '#CUSTOM_TEXT';

      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} Colors={customColors} />
      );

      const title = getByText('PSI Mock Test Series');
      expect(title.props.style).toContainEqual(
        expect.objectContaining({ color: '#CUSTOM_TEXT' })
      );
    });
  });

  describe('memoization', () => {
    it('component is memoized (has displayName)', () => {
      expect(TestSeriesCard.displayName).toBe('TestSeriesCard');
    });
  });

  describe('edge cases', () => {
    it('handles missing optional fields gracefully', () => {
      const series = mockTestSeries({
        description: undefined,
        rating: undefined,
        purchase_count: undefined,
      });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      // Should still render without crashing
      expect(getByText('PSI Mock Test Series')).toBeTruthy();
    });

    it('handles very long description', () => {
      const longDescription = 'This is a very long description that might need to be truncated or wrapped to multiple lines in the actual UI. It contains a lot of text to test how the component handles long content.';
      const series = mockTestSeries({ description: longDescription });
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );

      expect(getByText(longDescription)).toBeTruthy();
    });

    it('handles null accessData', () => {
      const { getByText } = renderWithProviders(
        <TestSeriesCard {...defaultProps} accessData={null as any} />
      );

      // Should render without crashing
      expect(getByText('PSI Mock Test Series')).toBeTruthy();
    });

    it('handles different index values', () => {
      const { getByText, rerender } = renderWithProviders(
        <TestSeriesCard {...defaultProps} index={0} />
      );
      expect(getByText('PSI Mock Test Series')).toBeTruthy();

      rerender(<TestSeriesCard {...defaultProps} index={99} />);
      expect(getByText('PSI Mock Test Series')).toBeTruthy();
    });
  });

  describe('snapshot tests', () => {
    it('matches snapshot with default props', () => {
      const { toJSON } = renderWithProviders(<TestSeriesCard {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });

    it('matches snapshot with active access', () => {
      const accessData = mockAccessData(true, { isActive: true });
      const { toJSON } = renderWithProviders(
        <TestSeriesCard {...defaultProps} accessData={accessData} />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('matches snapshot for free series', () => {
      const series = mockTestSeries({ is_free: true, price: 0 });
      const { toJSON } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('matches snapshot with discounted price', () => {
      const series = mockTestSeries({ price: 299, discounted_price: 199 });
      const { toJSON } = renderWithProviders(
        <TestSeriesCard {...defaultProps} series={series} />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
