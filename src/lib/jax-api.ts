// JAX API Integration for Carpet Manager PRO
// Using Token and ID provided via Environment Variables

const JAX_TOKEN = process.env.JAX_TOKEN;
const EXPEDITEUR_NAME = process.env.JAX_EXPEDITEUR_NAME || "ZARBITI V4";
const EXPEDITEUR_PHONE = process.env.JAX_EXPEDITEUR_PHONE || "55123456";

const GOVERNORATE_MAP: Record<string, string> = {
  "nabeul": "1",
  "gafsa": "2",
  "sfax": "3",
  "tunis": "4",
  "bizerte": "5",
  "jendouba": "6",
  "tozeur": "7",
  "tataouine": "8",
  "kef": "9",
  "sidi bouzid": "10",
  "manouba": "11",
  "beja": "12",
  "béja": "12",
  "gabes": "13",
  "gabès": "13",
  "zaghouan": "14",
  "ariana": "15",
  "kairouan": "16",
  "monastir": "17",
  "mahdia": "18",
  "siliana": "19",
  "ben arous": "20",
  "medenine": "21",
  "kasserine": "22",
  "sousse": "23",
  "kebili": "24",
  "kébili": "24"
};

export interface JaxReceiptResponse {
  success: boolean;
  trackingId?: string;
  receiptUrl?: string;
  error?: string;
}

export async function createJaxReceipt(order: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerGovernorate: string;
  customerDelegation: string;
  totalAmount: number;
  reference?: string | number;
}): Promise<JaxReceiptResponse> {
  if (!JAX_TOKEN) {
    return { success: false, error: "JAX API Token is not configured in Environment Variables." };
  }

  // Pre-validation of required fields
  if (!order.customerName?.trim()) return { success: false, error: "Customer Name is required." };
  if (!order.customerPhone?.trim()) return { success: false, error: "Customer Phone is required." };
  if (!order.customerAddress?.trim()) return { success: false, error: "Delivery Address is required." };
  if (!order.customerGovernorate?.trim()) return { success: false, error: "Governorate is required." };
  if (!order.customerDelegation?.trim()) return { success: false, error: "Delegation is required." };
  if (order.totalAmount <= 0) return { success: false, error: "COD Amount must be greater than 0." };

  try {
    const govKey = order.customerGovernorate.toLowerCase().trim();
    const govId = GOVERNORATE_MAP[govKey] || "4"; // Default to Tunis if not found
    
    // Sanitize phone: Remove everything except digits
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 8) {
      return { success: false, error: "Invalid customer phone number (Too short)." };
    }

    const payload = {
      referenceExterne: order.reference?.toString() || "",
      nomContact: order.customerName,
      tel: cleanPhone,
      tel2: "",
      adresseLivraison: order.customerAddress,
      governorat: govId,
      delegation: order.customerDelegation,
      description: `Order REF: ${order.reference}`,
      cod: order.totalAmount.toString(),
      echange: 0,
      gouvernorat_pickup: 23, // Sousse
      adresse_pickup: "Sousse",
      expediteur_phone: parseInt(cleanPhone.startsWith("216") ? cleanPhone : "216" + cleanPhone), // Just an example, normally sender phone
      expediteur_name: EXPEDITEUR_NAME
    };

    // Override with actual sender phone if configured
    if (EXPEDITEUR_PHONE) {
      payload.expediteur_phone = parseInt(EXPEDITEUR_PHONE.replace(/[^0-9]/g, ""));
    }

    const response = await fetch(`https://core.jax-delivery.com/api/user/colis/add?token=${JAX_TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    // RELIABLE SUCCESS CHECK:
    // If JAX returns an object with 'ean', 'code', or 'id', it's a success even if 'status' field is missing.
    const trackingId = data.ean || data.code || data.id?.toString();

    if (trackingId || data.status === "success") {
      return {
        success: true,
        trackingId: trackingId,
        receiptUrl: `https://core.jax-delivery.com/api/user/colis/pdf/${trackingId}?token=${JAX_TOKEN}`
      };
    } else {
      return {
        success: false,
        error: data.message || data.error || JSON.stringify(data)
      };
    }
  } catch (error: any) {
    console.error("JAX_API_CRITICAL_FAILURE:", error);
    return {
      success: false,
      error: "Network error connecting to JAX platform."
    };
  }
}
