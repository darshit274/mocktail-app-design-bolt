import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

// =====================
// PDF PAYMENT INTERFACES (EXACT WEB MATCH)
// =====================

export interface PDFAccessResponse {
  success: boolean;
  data: {
    hasAccess: boolean;
    accessType: 'free' | 'premium' | 'subscription';
    canPurchase: boolean;
    subscription?: {
      id: string;
      purchaseDate: string;
      expiryDate: string | null;
      amountPaid: number;
    };
  };
}

export interface CreateOrderRequest {
  pdfId: string;
  planType: 'pdf_purchase';
}

export interface CreateOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    amount: number;
    currency: string;
    subscription_id: string;
  };
}

export interface PaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  subscription_id: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  data: {
    verified: boolean;
    subscriptionActivated: boolean;
    subscription?: {
      id: string;
      status: string;
      activatedAt: string;
    };
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    orderId: string;
    status: 'created' | 'attempted' | 'paid' | 'failed';
    amount: number;
    currency: string;
    paymentId?: string;
  };
}

// =====================
// PDF PAYMENT API (WEB-COMPATIBLE)
// =====================

export const pdfPaymentApi = createApi({
  reducerPath: 'pdfPaymentApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PDFAccess', 'PaymentOrder', 'Subscription'],
  endpoints: (builder) => ({

    // Check PDF Access (EXACT WEB MATCH)
    checkPDFAccess: builder.query<PDFAccessResponse, { pdfId: string }>({
      query: ({ pdfId }) => ({
        url: `/subscription-access/pdf/${pdfId}`,
        method: 'GET',
      }),
      providesTags: ['PDFAccess'],
    }),

    // Create Payment Order for PDF (EXACT WEB MATCH)
    createPDFPaymentOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (body) => ({
        url: '/payments/create-order',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PaymentOrder'],
    }),

    // Verify Payment (EXACT WEB MATCH)
    verifyPDFPayment: builder.mutation<PaymentVerificationResponse, PaymentVerificationRequest>({
      query: (body) => ({
        url: '/payments/verify-payment',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PDFAccess', 'Subscription'],
    }),

    // Check Payment Status (EXACT WEB MATCH)
    checkPaymentStatus: builder.query<PaymentStatusResponse, { orderId: string }>({
      query: ({ orderId }) => ({
        url: `/payments/status/${orderId}`,
        method: 'GET',
      }),
      providesTags: ['PaymentOrder'],
    }),

    // Get User Subscriptions (EXACT WEB MATCH)
    getUserSubscriptions: builder.query<{
      success: boolean;
      data: Array<{
        id: string;
        type: 'pdf_purchase' | 'test_series';
        status: string;
        purchaseDate: string;
        expiryDate: string | null;
        amountPaid: number;
        metadata?: any;
      }>;
    }, void>({
      query: () => ({
        url: '/subscription-access/my-subscriptions',
        method: 'GET',
      }),
      providesTags: ['Subscription'],
    }),

  }),
});

// Export hooks
export const {
  useCheckPDFAccessQuery,
  useCreatePDFPaymentOrderMutation,
  useVerifyPDFPaymentMutation,
  useCheckPaymentStatusQuery,
  useGetUserSubscriptionsQuery,
} = pdfPaymentApi;