// JAX API Integration for Carpet Manager PRO
// Hardcoded Credentials as provided by the user for reliability

const JAX_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2NvcmUuamF4LWRlbGl2ZXJ5LmNvbS9hcGkvdXRpbGlzYXRldXJzL0xvbmdUb2tlbiIsImlhdCI6MTc3NzU0ODI4MSwiZXhwIjoxODQwNjIwMjgxLCJuYmYiOjE3Nzc1NDgyODEsImp0aSI6InlZZ00yTnNtdG5BOGVhVlQiLCJzdWIiOiIzNjYxIiwicHJ2IjoiZDA5MDViY2Y2NWE2ZDk5MmQ5MGNiZmU0NjIyNmJkMzEzYWU1MTkzZiJ9.C--tinUREhL30dgNh-RqhcM6Olr0PuzzfUg03G5r4UA";
const EXPEDITEUR_NAME = "ZARBITI V4";
const EXPEDITEUR_PHONE = 55123456; // Using number as per Postman collection

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
      expediteur_phone: EXPEDITEUR_PHONE,
      expediteur_name: EXPEDITEUR_NAME
    };

    console.log("JAX API Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(`https://core.jax-delivery.com/api/user/colis/add?token=${JAX_TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("JAX API Response:", JSON.stringify(data, null, 2));

    if (data.status === "success" || data.ean) {
      return {
        success: true,
        trackingId: data.ean || data.tracking_id || data.id?.toString(),
        receiptUrl: `https://core.jax-delivery.com/api/user/colis/pdf/${data.ean || data.id}?token=${JAX_TOKEN}`
      };
    } else {
      return {
        success: false,
        error: data.message || data.error || JSON.stringify(data) || "JAX API returned an unknown error"
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
