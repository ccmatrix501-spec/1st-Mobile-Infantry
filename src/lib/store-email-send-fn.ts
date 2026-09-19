import { createServerFn } from "@tanstack/react-start";

export type StoreEmailSendHistoryInput = {
  orderId: string;
  orderNumber: string;
  recipientName: string;
  emailType: string;
  orderStatus: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
};

export type StoreEmailSendInput = {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text: string;
  html: string;
  history?: StoreEmailSendHistoryInput;
};

export type StoreEmailSendResult = {
  ok: true;
  id: string | null;
  from: string;
  to: string[];
  historyRecorded: boolean;
  historyError: string | null;
};

export const sendLeadershipStoreEmail = createServerFn({ method: "POST" })
  .inputValidator((input: StoreEmailSendInput) => input)
  .handler(async ({ data }): Promise<StoreEmailSendResult> => {
    const leadership = await import("@/lib/local-leadership-access.server");
    await leadership.requireLocalLeadership();

    const sender = await import("@/lib/store-email.server");
    return sender.sendStoreEmailServer(data);
  });
