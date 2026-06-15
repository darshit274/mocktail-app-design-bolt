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
  pdfId?: string;
  pdfCategoryId?: string;
  planType: 'pdf_purchase' | 'pdf_category';
}

export interface PDFCategoryAccessResponse {
  success: boolean;
  data: {
    hasAccess: boolean;
    accessType: 'free' | 'purchased' | 'restricted' | 'none';
    canPurchase: boolean;
    showEnrollButton: boolean;
    subscription?: {
      id: string;
      purchaseDate: string;
      expiryDate: string | null;
      amountPaid: number;
    };
    category: {
      id: number;
      uuid: string;
      name: string;
      pricing_type: 'free' | 'paid' | 'restricted';
      price: number;
      discount_percentage: number;
      discounted_price: number;
    };
  };
}

export interface CreateOrderResponse {
  success: boolean;
  message?: string;
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
    userDetails?: {
      name: string;
      email: string;
      contact: string;
    };
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

    // Check PDF Category Access (whole-category purchase flow)
    checkPDFCategoryAccess: builder.query<PDFCategoryAccessResponse, { categoryUuid: string }>({
      query: ({ categoryUuid }) => ({
        url: `/subscription-access/pdf-category/${categoryUuid}`,
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

    // Get User Subscriptions — returns { data: { subscriptions: [...], totalCount } }
    getUserSubscriptions: builder.query<{
      success: boolean;
      data: {
        subscriptions: Array<{
          id: string;
          test_series_id: number | null;
          purchase_date: string;
          expiry_date: string | null;
          amount_paid: number;
          metadata?: {
            plan_type?: string;
            pdf_category_id?: number;
            pdf_category_uuid?: string;
            [key: string]: any;
          } | null;
        }>;
        totalCount: number;
      };
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
  useCheckPDFCategoryAccessQuery,
  useCreatePDFPaymentOrderMutation,
  useVerifyPDFPaymentMutation,
  useCheckPaymentStatusQuery,
  useGetUserSubscriptionsQuery,
} = pdfPaymentApi;