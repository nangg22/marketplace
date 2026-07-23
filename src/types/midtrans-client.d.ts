declare module 'midtrans-client' {
  interface SnapOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface CustomerDetails {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    shipping_address?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      country?: string;
    };
  }

  interface SnapParameter {
    transaction_details: TransactionDetails;
    credit_card?: {
      secure?: boolean;
      bank?: string;
      installment?: boolean;
    };
    customer_details?: CustomerDetails;
    callbacks?: {
      finish?: string;
      error?: string;
      pending?: string;
    };
    expiry?: {
      unit: string;
      duration: number;
    };
    item_details?: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }>;
  }

  interface SnapResponse {
    token: string;
    redirect_url: string;
  }

  class Snap {
    constructor(options: SnapOptions);
    createTransaction(parameter: SnapParameter): Promise<SnapResponse>;
    createTransactionToken(parameter: SnapParameter): Promise<string>;
    createTransactionUrl(parameter: SnapParameter): Promise<string>;
  }

  interface CoreApiOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  class CoreApi {
    constructor(options: CoreApiOptions);
    charge(parameter: Record<string, any>): Promise<any>;
    capture(parameter: Record<string, any>): Promise<any>;
    deny(parameter: Record<string, any>): Promise<any>;
    cancel(parameter: Record<string, any>): Promise<any>;
    refund(parameter: Record<string, any>): Promise<any>;
    status(orderId: string): Promise<any>;
  }

  export { Snap, CoreApi };
}
