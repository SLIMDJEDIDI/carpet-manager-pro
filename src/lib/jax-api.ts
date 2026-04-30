// JAX API Integration for Carpet Manager PRO
// Using Token and ID provided by user

const JAX_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2NvcmUuamF4LWRlbGl2ZXJ5LmNvbS9hcGkvdXRpbGlzYXRldXJzL0xvbmdUb2tlbiIsImlhdCI6MTc3NzU0ODI4MSwiZXhwIjoxODQwNjIwMjgxLCJuYmYiOjE3Nzc1NDgyODEsImp0aSI6InlZZ00yTnNtdG5BOGVhVlQiLCJzdWIiOiIzNjYxIiwicHJ2IjoiZDA5MDViY2Y2NWE2ZDk5MmQ5MGNiZmU0NjIyNmJkMzEzYWU1MTkzZiJ9.C--tinUREhL30dgNh-RqhcM6Olr0PuzzfUg03G5r4UA";
const EXPEDITEUR_ID = "3264";
const EXPEDITEUR_NAME = "ZARBITI V4";

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
  reference?: string;
}): Promise<JaxReceiptResponse> {
  try {
    const govId = GOVERNORATE_MAP[order.customerGovernorate] || "4"; // Default to Tunis if not found
    
    const payload = {
      referenceExterne: order.reference || "",
      nomContact: order.customerName,
      tel: order.customerPhone.replace(/[^0-9]/g, ""),
      tel2: "",
      adresseLivraison: order.customerAddress,
      governorat: govId,
      delegation: order.customerDelegation,
      description: `Carpet Order Ref: ${order.reference}`,
      cod: order.totalAmount.toString(),
      echange: 0,
      gouvernorat_pickup: 23, // Sousse (Default pickup for ZARBITI)
      adresse_pickup: "Sousse", // Placeholder
      expediteur_phone: "55123456", // Placeholder shop phone
      expediteur_name: EXPEDITEUR_NAME
    };

    const response = await fetch(`https://core.jax-delivery.com/api/user/colis/add?token=${JAX_TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // The JAX API usually returns the EAN/Tracking ID on success
    // Based on standard JAX response: { "status": "success", "ean": "...", "id": ... }
    if (data.status === "success" || data.ean) {
      return {
        success: true,
        trackingId: data.ean || data.tracking_id || data.id?.toString(),
        receiptUrl: `https://core.jax-delivery.com/api/user/colis/pdf/${data.ean || data.id}?token=${JAX_TOKEN}`
      };
    } else {
      return {
        success: false,
        error: data.message || "JAX API returned an error"
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
