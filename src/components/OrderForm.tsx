"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, User, MapPin, Phone, Palette, ShoppingBag, Plus, Trash2, Globe, PlusCircle, Loader2, RefreshCw, ExternalLink, Hash, Info, CheckCircle2 } from "lucide-react";
import { TUNISIA_LOCATIONS } from "@/lib/tunisia-locations";

interface Item {
  id: string | number;
  brandId: string;
  designId: string;
  productId: string;
  size: string;
  price: number;
  quantity: number;
  status?: string;
}

interface Product {
  id: string;
  brandId: string;
  category: string;
  name: string;
  size: string;
  price: number;
  isPack: boolean;
}

export default function OrderForm({ 
  brands = [], 
  designs = [], 
  action, 
  initialData 
}: { 
  brands: any[], 
  designs: any[], 
  action: (formData: FormData) => Promise<any>, 
  initialData?: any 
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialData?.customerPhone || "");
  const [name, setName] = useState(initialData?.customerName || "");
  const [address, setAddress] = useState(initialData?.customerAddress || "");
  const [postalCode, setPostalCode] = useState(initialData?.customerPostalCode || "");
  const [governorate, setGovernorate] = useState(initialData?.customerGovernorate || "");
  const [delegation, setDelegation] = useState(initialData?.customerDelegation || "");
  
  const [isFreeDelivery, setIsFreeDelivery] = useState(initialData?.isFreeDelivery || false);
  const [isExchange, setIsExchange] = useState(initialData?.isExchange || false);
  
  const [localDesigns, setLocalDesigns] = useState(designs);
  const [isRefreshingDesigns, setIsRefreshingDesigns] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());

  const refreshDesigns = async (silent = false) => {
    if (!silent) setIsRefreshingDesigns(true);
    try {
      const res = await fetch('/api/designs');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLocalDesigns(data);
        setLastRefreshed(Date.now());
      }
    } catch (e) {
      console.error("Failed to refresh designs", e);
    } finally {
      if (!silent) setIsRefreshingDesigns(false);
    }
  };

  const handleDesignFocus = (itemId: string | number) => {
    setShowDesignList(prev => ({ ...prev, [itemId]: true }));
    if (Date.now() - lastRefreshed > 30000) {
      refreshDesigns(true);
    }
  };

  const [items, setItems] = useState<Item[]>(initialData?.items || (initialData ? [] : [{ 
    id: 'init-1',
    brandId: "",
    designId: "",
    productId: "",
    size: "",
    price: 0,
    quantity: 1
  }]));

  const [isSearching, setIsSearching] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Record<string, Product[]>>({});
  const [designSearch, setDesignSearch] = useState<Record<string | number, string>>({});
  const [showDesignList, setShowDesignList] = useState<Record<string | number, boolean>>({});

  useEffect(() => {
    if (initialData?.items && localDesigns.length > 0 && Object.keys(designSearch).length === 0) {
      const searchInit: Record<string | number, string> = {};
      initialData.items.forEach((item: any) => {
        const design = localDesigns.find(d => d.id === item.designId);
        if (design) searchInit[item.id] = design.code;
      });
      setDesignSearch(searchInit);
    }
  }, [initialData, localDesigns]);

  useEffect(() => {
    if (initialData) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (phone.length >= 8) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/customers?phone=${phone}`, { signal: controller.signal });
          const data = await res.json();
          if (data) {
            setName(data.name);
            setAddress(data.address);
            setPostalCode(data.postalCode || "");
            setGovernorate(data.governorate || "");
            setDelegation(data.delegation || "");
          }
        } finally {
          setIsSearching(false);
        }
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [phone, initialData]);

  const fetchProductsForBrand = async (brandId: string) => {
    if (!brandId || availableProducts[brandId]) return;
    try {
      const res = await fetch(`/api/products?brandId=${brandId}`);
      const products = await res.json();
      setAvailableProducts(prev => ({ ...prev, [brandId]: products }));
    } catch (e) {
      console.error("Failed to fetch products", e);
    }
  };

  const updateItem = async (id: string | number, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        if (field === "brandId") {
          newItem.productId = "";
          newItem.size = "";
          newItem.price = 0;
          fetchProductsForBrand(value);
        }
        if (field === "productId") {
          const product = availableProducts[item.brandId]?.find((p: any) => p.id === value);
          if (product) {
            newItem.size = product.size;
            newItem.price = product.price;
          } else {
            newItem.size = "";
            newItem.price = 0;
          }
        }
        return newItem;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, { 
      id: Date.now(), 
      brandId: "", 
      designId: "", 
      productId: "", 
      size: "", 
      price: 0,
      quantity: 1
    }]);
  };

  const removeItem = (id: string | number) => {
    setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  };

  const totalPrice = items.length > 0 
    ? items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) + (isFreeDelivery || isExchange ? 0 : 8) 
    : 0;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const timeoutId = setTimeout(() => {
      setIsSubmitting(false);
      alert("Order processing is taking longer than expected. Please check your Orders List.");
    }, 12000);

    try {
      const result = await action(formData);
      clearTimeout(timeoutId);
      if (result?.success) {
        window.location.href = "/orders";
      } else {
        alert(`Error: ${result?.error || "Unknown error occurred"}`);
        setIsSubmitting(false);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Order submission failed:", error);
      alert("Order submission failed.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
      {/* Customer Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Customer Details</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Shipping & Contact Information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
          <div className="relative group">
            <input 
              name="customerPhone"
              type="text" 
              required 
              placeholder="e.g. 55 123 456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-200 focus:border-slate-900 focus:ring-0 h-16 bg-slate-50/50 font-bold text-slate-900 px-6 transition-all group-hover:border-slate-300"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isSearching ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" /> : <Phone className="w-5 h-5 text-slate-300" />}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
          <div className="relative group">
            <input 
              name="customerName"
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-200 focus:border-slate-900 focus:ring-0 h-16 bg-slate-50/50 font-bold text-slate-900 px-6 transition-all group-hover:border-slate-300"
            />
            <User className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Delivery Address</label>
        <div className="relative group">
          <input 
            name="customerAddress"
            type="text" 
            required 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-200 focus:border-slate-900 focus:ring-0 h-16 bg-slate-50/50 font-bold text-slate-900 px-6 transition-all group-hover:border-slate-300"
          />
          <MapPin className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Gouvernorat</label>
          <select 
            name="customerGovernorate"
            required 
            value={governorate}
            onChange={(e) => {
              setGovernorate(e.target.value);
              setDelegation("");
            }}
            className="w-full rounded-2xl border-2 border-slate-200 focus:border-slate-900 focus:ring-0 h-16 bg-slate-50/50 font-bold text-slate-900 px-6 transition-all cursor-pointer"
          >
            <option value="">Sélectionner</option>
            {Object.keys(TUNISIA_LOCATIONS).map(gov => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Délégation</label>
          <select 
            name="customerDelegation"
            required 
            value={delegation}
            onChange={(e) => setDelegation(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-200 focus:border-slate-900 focus:ring-0 h-16 bg-slate-50/50 font-bold text-slate-900 px-6 transition-all cursor-pointer"
          >
            <option value="">Sélectionner</option>
            {governorate && TUNISIA_LOCATIONS[governorate as keyof typeof TUNISIA_LOCATIONS]?.map(del => (
              <option key={del} value={del}>{del}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Postal Code</label>
          <div className="relative group">
            <input 
              name="customerPostalCode"
              type="text" 
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-200 focus:border-slate-900 focus:ring-0 h-16 bg-slate-50/50 font-bold text-slate-900 px-6 transition-all group-hover:border-slate-300"
            />
            <Hash className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          </div>
        </div>
      </div>
      
      {/* Shipping Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
        <label className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-500 transition-all cursor-pointer group">
          <input 
            type="checkbox" 
            name="isFreeDelivery"
            checked={isFreeDelivery}
            onChange={(e) => setIsFreeDelivery(e.target.checked)}
            className="w-6 h-6 rounded-lg border-2 border-slate-300 text-emerald-600 focus:ring-0 transition-all"
          />
          <div className="flex-1">
            <p className="font-black text-slate-900 uppercase text-xs">Free Delivery</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Remove 8 DT Delivery Fee</p>
          </div>
          <Globe className={`w-5 h-5 transition-all ${isFreeDelivery ? 'text-emerald-500 scale-110' : 'text-slate-300'}`} />
        </label>

        <label className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 transition-all cursor-pointer group">
          <input 
            type="checkbox" 
            name="isExchange"
            checked={isExchange}
            onChange={(e) => setIsExchange(e.target.checked)}
            className="w-6 h-6 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-0 transition-all"
          />
          <div className="flex-1">
            <p className="font-black text-slate-900 uppercase text-xs">Exchange (Echange)</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Delivery already paid</p>
          </div>
          <RefreshCw className={`w-5 h-5 transition-all ${isExchange ? 'text-blue-500 scale-110' : 'text-slate-300'}`} />
        </label>
      </div>

      {/* Articles Section */}
      <div className="pt-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Order Articles</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Select products & designs</p>
          </div>
        </div>

        <div className="space-y-6">
          {items.map((item, index) => {
            const selectedDesign = localDesigns.find(d => d.id === item.designId);
            return (
            <div key={item.id} className="group relative bg-slate-50/50 rounded-[2rem] border-2 border-slate-100 p-8 transition-all hover:bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 animate-in fade-in slide-in-from-top-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Brand Selection */}
                <div className="lg:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Brand</label>
                  <select 
                    name={`brandId_${index}`} 
                    required 
                    value={item.brandId}
                    onChange={(e) => updateItem(item.id, "brandId", e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 h-14 bg-white font-bold text-sm text-slate-900 px-4 transition-all"
                  >
                    <option value="">Select Brand</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Design Selection */}
                <div className="lg:col-span-3 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Design</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => refreshDesigns(false)}
                        className={`p-1.5 rounded-lg transition-all border ${
                          isRefreshingDesigns ? 'bg-slate-100 text-slate-400 animate-spin' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title="Refresh Catalog"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <a 
                        href="/designs/new" 
                        target="_blank" 
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Add New Design"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search Design Code..."
                      value={designSearch[item.id] || ""}
                      onChange={(e) => {
                        setDesignSearch(prev => ({ ...prev, [item.id]: e.target.value }));
                        setShowDesignList(prev => ({ ...prev, [item.id]: true }));
                      }}
                      onFocus={() => handleDesignFocus(item.id)}
                      className={`w-full rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 h-14 bg-white font-bold text-sm text-slate-900 ${selectedDesign ? 'pl-20' : 'pl-12'} pr-4 transition-all`}
                    />
                    {selectedDesign ? (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-14 h-10 bg-slate-100 rounded-lg border-2 border-emerald-500 overflow-hidden shadow-sm">
                        {selectedDesign.imageUrl ? (
                          <img src={selectedDesign.imageUrl} className="w-full h-full object-cover" alt={selectedDesign.code} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 text-[8px]">N/A</div>
                        )}
                      </div>
                    ) : (
                      <Palette className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                    )}
                    
                    {showDesignList[item.id] && (
                      <div className="absolute top-full left-0 right-0 mt-3 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto p-2">
                        {/* Sticky Add New Design Option */}
                        <a
                          href="/designs/new"
                          target="_blank"
                          onClick={() => setShowDesignList(prev => ({ ...prev, [item.id]: false }))}
                          className="w-full flex items-center gap-3 p-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all mb-2 sticky top-0 z-10 border border-emerald-500 text-white shadow-lg shadow-emerald-200"
                        >
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <Plus className="w-4 h-4 text-white" />
                          </div>
                          <p className="font-black text-[10px] uppercase tracking-wider">New Design</p>
                        </a>

                        {localDesigns
                          .filter(d => 
                            d.code.toLowerCase().includes((designSearch[item.id] || "").toLowerCase()) ||
                            d.name.toLowerCase().includes((designSearch[item.id] || "").toLowerCase())
                          )
                          .slice(0, 10)
                          .map(d => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                updateItem(item.id, "designId", d.id);
                                setDesignSearch(prev => ({ ...prev, [item.id]: d.code }));
                                setShowDesignList(prev => ({ ...prev, [item.id]: false }));
                              }}
                              className="w-full text-left p-3 hover:bg-emerald-50 rounded-xl transition-all flex items-center gap-4 group/opt"
                            >
                              <div className="w-12 h-12 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                                {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover transition-transform group-hover/opt:scale-110" alt={d.code} />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-slate-900 text-xs uppercase tracking-tight leading-none mb-1">{d.code}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{d.name}</p>
                              </div>
                            </button>
                          ))}
                        {localDesigns.length === 0 && <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-200" /></div>}
                      </div>
                    )}
                  </div>
                  <input type="hidden" name={`designId_${index}`} value={item.designId} />
                  {showDesignList[item.id] && <div className="fixed inset-0 z-40" onClick={() => setShowDesignList(prev => ({ ...prev, [item.id]: false }))}></div>}
                </div>

                {/* Article Selection */}
                <div className="lg:col-span-3 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Article & Size</label>
                  <select 
                    name={`productId_${index}`} 
                    required 
                    value={item.productId}
                    onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 h-14 bg-white font-bold text-sm text-slate-900 px-4 transition-all"
                  >
                    <option value="">Select Article</option>
                    {availableProducts[item.brandId]?.map(p => (
                      <option key={p.id} value={p.id}>{p.category}: {p.name}</option>
                    ))}
                  </select>
                  <input type="hidden" name={`size_${index}`} value={item.size} />
                </div>

                {/* Quantity Selection */}
                <div className="lg:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quantity</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, "quantity", Math.max(1, (item.quantity || 1) - 1))}
                      className="h-14 w-12 flex items-center justify-center border-2 border-r-0 border-slate-200 bg-white rounded-l-xl hover:bg-slate-50 text-slate-500 font-bold transition-all"
                    >
                      -
                    </button>
                    <input 
                      type="number"
                      name={`quantity_${index}`}
                      required
                      min="1"
                      value={item.quantity || 1}
                      onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                      className="w-full h-14 border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 bg-white font-black text-center text-slate-900 px-2 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, "quantity", (item.quantity || 1) + 1)}
                      className="h-14 w-12 flex items-center justify-center border-2 border-l-0 border-slate-200 bg-white rounded-r-xl hover:bg-slate-50 text-slate-500 font-bold transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price Display */}
                <div className="lg:col-span-2 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Total</label>
                    <div className="h-14 flex items-center justify-center bg-emerald-50 rounded-xl font-black text-emerald-600 border-2 border-emerald-100 text-lg">
                      {(item.price || 0) * (item.quantity || 1)} <span className="ml-1 text-[10px] text-slate-900 uppercase">DT</span>
                    </div>
                  </div>
                  {items.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeItem(item.id)}
                      className="mt-6 p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            type="button" 
            onClick={addItem}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Footer / Total Area */}
      <div className="mt-16 bg-slate-900 rounded-[2.5rem] p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-slate-900/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-32 translate-x-32 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full translate-y-32 -translate-x-32 blur-3xl pointer-events-none"></div>
        
        <div className="text-center md:text-left relative z-10">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Ready to process</p>
          </div>
          <div className="text-6xl md:text-7xl font-black text-white tracking-tighter flex items-baseline gap-3 justify-center md:justify-start">
            {totalPrice} <span className="text-2xl text-slate-500 font-bold uppercase tracking-widest">DT</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
            {isFreeDelivery || isExchange ? "(Delivery Fee: 0 DT)" : "(Includes 8 DT Delivery Cost)"}
          </p>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full md:w-auto bg-white text-slate-900 px-16 py-7 rounded-[1.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed group relative z-10 overflow-hidden"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Creating Order...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span>Confirm Final Order</span>
              <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </div>
          )}
        </button>
      </div>
      <input type="hidden" name="itemCount" value={items.length} />
    </form>
  );
}
