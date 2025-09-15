import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

interface PaymentOrder {
  testSeriesId?: string;
  pdfId?: string;
  planType: 'test_series' | 'pdf';
}

interface PaymentOrderResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    amount: number;
    currency: string;
    receiptId: string;
    keyId: string;
    itemDetails: {
      name: string;
      type: string;
      price: number;
    };
    subscriptionId: string;
  };
}

interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  subscription_id: string;
}

interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  data: {
    subscriptionId: string;
    paymentId: string;
    amount: number;
    status: string;
    expiryDate: string;
  };
}

interface PaymentStatusResponse {
  success: boolean;
  data: {
    orderId: string;
    subscriptionId: string;
    status: string;
    amount: number;
    currency: string;
    purchaseDate: string;
    expiryDate: string;
    paymentDetails?: {
      paymentId: string;
      method: string;
      status: string;
    };
  };
}

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Payment', 'Subscription'],
  endpoints: (builder) => ({
    // Create payment order
    createPaymentOrder: builder.mutation<PaymentOrderResponse, PaymentOrder>({
      query: (orderData) => ({
        url: '/payments/create-order',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Payment'],
    }),

    // Verify payment
    verifyPayment: builder.mutation<PaymentVerificationResponse, PaymentVerification>({
      query: (verificationData) => ({
        url: '/payments/verify-payment',
        method: 'POST',
        body: verificationData,
      }),
      invalidatesTags: ['Payment', 'Subscription'],
    }),

    // Get payment status
    getPaymentStatus: builder.query<PaymentStatusResponse, string>({
      query: (orderId) => `/payments/status/${orderId}`,
      providesTags: ['Payment'],
    }),
  }),
});

export const {
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useGetPaymentStatusQuery,
} = paymentApi;