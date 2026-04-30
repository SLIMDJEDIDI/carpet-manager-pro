"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, User, MapPin, Phone, Palette, ShoppingBag, Plus, Trash2, Globe, PlusCircle, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { TUNISIA_LOCATIONS } from "@/lib/tunisia-locations";

interface Item {
  id: string | number;
  brandId: string;
  designId: string;
  productId: string;
  size: string;
  price: number;
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
  
  const [localDesigns, setLocalDesigns] = useState(designs);
  const [isRefreshingDesigns, setIsRefreshingDesigns] = useState(false);
  const [activeItemIdForDesign, setActiveItemIdForDesign] = useState<string | number | null>(null);

  const refreshDesigns = async () => {
    setIsRefreshingDesigns(true);
    try {
      const res = await fetch('/api/designs');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLocalDesigns(data);
      }
    } catch (e) {
      console.error("Failed to refresh designs", e);
    } finally {
      setIsRefreshingDesigns(false);
    }
  };

  const [items, setItems] = useState<Item[]>(initialData?.items || (initialData ? [] : [{ 
    id: 'init-1',
    brandId: "",
    designId: "",
    productId: "",
    size: "",
    price: 0
  }]));

  const [isSearching, setIsSearching] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Record<string, Product[]>>({});
  const [designSearch, setDesignSearch] = useState<Record<string | number, string>>({});
  const [showDesignList, setShowDesignList] = useState<Record<string | number, boolean>>({});

  useEffect(() => {
    // Only initialize search from initialData ONCE on mount
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
        // If brand changes, clear product and design
        if (field === "brandId") {
          newItem.productId = "";
          newItem.size = "";
          newItem.price = 0;
          fetchProductsForBrand(value);
        }
        // If product changes, update price and size
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
      id: 'new-' + Date.now(), 
      brandId: "", 
      designId: "", 
      productId: "", 
      size: "", 
      price: 0 
    }]);
  };

  const removeItem = (id: string | number) => {
    setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // Safety Timeout: Force-unlock UI after 12 seconds
    const timeoutId = setTimeout(() => {
      setIsSubmitting(false);
      alert("Order processing is taking longer than expected. Please check your Orders List to see if the order was created.");
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
      alert("Order submission failed. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 bg-white p-5 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
              <Phone className="w-3 h-3" /> Customer Phone
            </label>
            <div className="relative">
              <input 
                name="customerPhone"
                type="text" 
                required 
                placeholder="e.g. 55 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black px-4"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
              <User className="w-3 h-3" /> Full Name
            </label>
            <input 
              name="customerName"
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black px-4"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
            <MapPin className="w-3 h-3" /> Delivery Address
          </label>
          <input 
            name="customerAddress"
            type="text" 
            required 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black px-4"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
              <Search className="w-3 h-3" /> Postal Code
            </label>
            <input 
              name="customerPostalCode"
              type="text" 
              placeholder="e.g. 1001"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black px-4"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-3 h-3" /> Gouvernorat
            </label>
            <select 
              name="customerGovernorate"
              required 
              value={governorate}
              onChange={(e) => {
                setGovernorate(e.target.value);
                setDelegation("");
              }}
              className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black px-4"
            >
              <option value="">Sélectionner</option>
              {Object.keys(TUNISIA_LOCATIONS).map(gov => (
                <option key={gov} value={gov}>{gov}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Délégation
            </label>
            <select 
              name="customerDelegation"
              required 
              value={delegation}
              onChange={(e) => setDelegation(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black px-4"
            >
              <option value="">Sélectionner</option>
              {governorate && TUNISIA_LOCATIONS[governorate as keyof typeof TUNISIA_LOCATIONS]?.map(del => (
                <option key={del} value={del}>{del}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-slate-100"></div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Carpet Articles in this Order</h2>
            <div className="h-px flex-1 bg-slate-100"></div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest">Brand</label>
                  <select 
                    name={`brandId_${index}`} 
                    required 
                    value={item.brandId}
                    onChange={(e) => updateItem(item.id, "brandId", e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-11 bg-white font-bold text-sm text-black px-4"
                  >
                    <option value="">Brand</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-black uppercase tracking-widest">Design</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={refreshDesigns}
                        className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:bg-emerald-50 px-2 py-0.5 rounded-md transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshingDesigns ? 'animate-spin' : ''}`} />
                        Refresh Catalog
                      </button>
                      <a 
                        href="/designs/new" 
                        target="_blank" 
                        className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:bg-emerald-50 px-2 py-0.5 rounded-md transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        New Design
                      </a>
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search Design Code"
                      value={designSearch[item.id] || ""}
                      onChange={(e) => {
                        setDesignSearch(prev => ({ ...prev, [item.id]: e.target.value }));
                        setShowDesignList(prev => ({ ...prev, [item.id]: true }));
                      }}
                      onFocus={() => setShowDesignList(prev => ({ ...prev, [item.id]: true }))}
                      className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-11 bg-white font-bold text-sm text-black pl-10 pr-4"
                    />
                    <Palette className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    {!item.designId && (
                      <p className="absolute -bottom-5 left-0 text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Please select a design from the list</p>
                    )}
                    
                    {showDesignList[item.id] && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto">
                        <a
                          href="/designs/new"
                          target="_blank"
                          onClick={() => {
                            setShowDesignList(prev => ({ ...prev, [item.id]: false }));
                          }}
                          className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-3 border-b-2 border-emerald-100 sticky top-0 z-10"
                        >
                          <ExternalLink className="w-5 h-5 text-emerald-600" />
                          <div>
                            <p className="font-black text-emerald-600 text-xs uppercase">Add New Design</p>
                            <p className="text-[9px] text-emerald-500 font-bold">Opens in new tab</p>
                          </div>
                        </a>
                        
                        {localDesigns
                          .filter(d => 
                            d.code.toLowerCase().includes((designSearch[item.id] || "").toLowerCase()) ||
                            d.name.toLowerCase().includes((designSearch[item.id] || "").toLowerCase())
                          )
                          .slice(0, 15)
                          .map(d => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                updateItem(item.id, "designId", d.id);
                                setDesignSearch(prev => ({ ...prev, [item.id]: d.code }));
                                setShowDesignList(prev => ({ ...prev, [item.id]: false }));
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3"
                            >
                              <div className="w-8 h-8 bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                                {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-contain" alt={d.code} />}
                              </div>
                              <div>
                                <p className="font-black text-black text-xs uppercase">{d.code}</p>
                                <p className="text-[10px] text-slate-500 font-bold">{d.name}</p>
                              </div>
                            </button>
                          ))}
                        {localDesigns.filter(d => d.code.toLowerCase().includes((designSearch[item.id] || "").toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase">No designs found</div>
                        )}
                      </div>
                    )}
                  </div>
                  <input type="hidden" name={`designId_${index}`} value={item.designId} />
                  {showDesignList[item.id] && <div className="fixed inset-0 z-40" onClick={() => setShowDesignList(prev => ({ ...prev, [item.id]: false }))}></div>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest">Article / Size</label>
                  <select 
                    name={`productId_${index}`} 
                    required 
                    value={item.productId}
                    onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-11 bg-white font-bold text-sm text-black px-4"
                  >
                    <option value="">Select Article</option>
                    {availableProducts[item.brandId]?.map(p => (
                      <option key={p.id} value={p.id}>{p.category}: {p.name} ({p.price} DT)</option>
                    ))}
                  </select>
                  <input type="hidden" name={`size_${index}`} value={item.size} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-black uppercase tracking-widest">Price</label>
                    <div className="h-11 flex items-center px-4 bg-white border-2 border-slate-300 rounded-xl font-black text-emerald-600">
                      {item.price || 0} <span className="ml-1 text-[10px] text-black uppercase">DT</span>
                    </div>
                  </div>
                  {items.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeItem(item.id)}
                      className="mt-6 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button 
              type="button" 
              onClick={addItem}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2 group"
            >
              <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              ADD ANOTHER ARTICLE
            </button>
          </div>
        </div>

        <div className="mt-12 bg-slate-900 rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-200">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Order Total</p>
            <div className="text-5xl font-black text-white tracking-tighter">
              {totalPrice} <span className="text-emerald-500 text-2xl ml-2 uppercase">DT</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto bg-emerald-500 text-white px-12 py-5 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 min-w-[280px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                PROCESSING...
              </>
            ) : (
              'CONFIRM FINAL ORDER'
            )}
          </button>
        </div>
        <input type="hidden" name="itemCount" value={items.length} />
      </form>
    </>
  );
}
