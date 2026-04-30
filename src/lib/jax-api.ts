// JAX API Integration for Carpet Manager PRO
// Using Token and ID provided via Environment Variables

const JAX_TOKEN = process.env.JAX_TOKEN;
const EXPEDITEUR_NAME = process.env.JAX_EXPEDITEUR_NAME || "ZARBITI V4";

const GOVERNORATE_MAP: Record<string, string> = {
  "Nabeul": "1",
  "Gafsa": "2",
  "Sfax": "3",
  "Tunis": "4",
  "Bizerte": "5",
  "Jendouba": "6",
  "Tozeur": "7",
  "Tataouine": "8",
  "Kef": "9",
  "Sidi Bouzid": "10",
  "Manouba": "11",
  "Beja": "12",
  "Gabès": "13",
  "Zaghouan": "14",
  "Ariana": "15",
  "Kairouan": "16",
  "Monastir": "17",
  "Mahdia": "18",
  "Siliana": "19",
  "Ben Arous": "20",
  "Medenine": "21",
  "Kasserine": "22",
  "Sousse": "23",
  "Kebili": "24"
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
    return { success: false, error: "JAX API Token is not configured." };
  }

  try {
    const govId = GOVERNORATE_MAP[order.customerGovernorate] || "4"; // Default to Tunis if not found
    
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
      expediteur_phone: "55123456",
      expediteur_name: EXPEDITEUR_NAME
    };

    const response = await fetch(`https://core.jax-delivery.com/api/user/colis/add?token=${JAX_TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`JAX API Network Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.status === "success" || data.ean) {
      return {
        success: true,
        trackingId: data.ean || data.tracking_id || data.id?.toString(),
        receiptUrl: `https://core.jax-delivery.com/api/user/colis/pdf/${data.ean || data.id}?token=${JAX_TOKEN}`
      };
    } else {
      return {
        success: false,
        error: data.message || JSON.stringify(data) || "JAX API returned an unknown error"
      };
    }
  } catch (error: any) {
    console.error("JAX_API_CRITICAL_FAILURE:", error);
    return {
      success: false,
      error: error.message || "Failed to connect to JAX API"
    };
  }
}
