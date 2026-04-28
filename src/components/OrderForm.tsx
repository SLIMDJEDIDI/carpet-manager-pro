"use client";

import { useState, useEffect } from "react";
import { Search, User, MapPin, Phone, Palette, Ruler, ShoppingBag, Plus, Trash2 } from "lucide-react";

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
  brands, 
  designs, 
  action, 
  initialData 
}: { 
  brands: any[], 
  designs: any[], 
  action: any, 
  initialData?: any 
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [items, setItems] = useState<Item[]>(initialData?.items || [{ 
    id: 'init-' + Math.random().toString(36).substr(2, 9), 
    brandId: "", 
    designId: "", 
    productId: "", 
    size: "", 
    price: 0 
  }]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Record<string, Product[]>>({});
  const [designSearch, setDesignSearch] = useState<Record<string, string>>({});
  const [showDesignList, setShowDesignList] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Only auto-fill if we are NOT in edit mode (no initialData)
    if (initialData) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (phone.length >= 8) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/customers/search?phone=${phone}`, { signal: controller.signal });
          const data = await res.json();
          if (data.found) {
            setName(data.name);
            setAddress(data.address);
          }
          setHasPending(data.hasPending);
        } catch (e) {
          if (e instanceof Error && e.name !== 'AbortError') {
            console.error("Search failed", e);
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

  useEffect(() => {
    // Load products for each selected brand
    const brandsToFetch = [...new Set(items.map(item => item.brandId).filter(id => id && !availableProducts[id]))];
    
    brandsToFetch.forEach(async (brandId) => {
      try {
        const res = await fetch(`/api/products?brandId=${brandId}`);
        const products = await res.json();
        setAvailableProducts(prev => ({ ...prev, [brandId]: products }));
      } catch (e) {
        console.error("Failed to fetch products", e);
      }
    });
  }, [items, availableProducts]);

  const addItem = () => {
    setItems([...items, { 
      id: 'new-' + Date.now(), 
      brandId: "", 
      designId: "", 
      productId: "", 
      size: "", 
      price: 0 
    }]);
  };

  const removeItem = (id: string | number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string | number, field: keyof Item, value: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        if (field === 'productId') {
          const product = availableProducts[item.brandId]?.find(p => p.id === value);
          if (product) {
            newItem.size = product.size;
            newItem.price = product.price;
          }
        }
        return newItem;
      }
      return item;
    }));
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <form action={action} className="space-y-8 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
      {/* Customer Info Section */}
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            Phone Number
          </label>
          <div className="relative">
            <input 
              type="text" 
              name="customerPhone" 
              required 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold pl-12 text-black" 
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {isSearching ? <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div> : <Search className="w-5 h-5 text-black" />}
            </div>
          </div>
          {hasPending && !initialData && (
            <p className="text-xs font-black text-amber-600 uppercase animate-bounce mt-2">
              ⚠️ Warning: This customer already has a pending order!
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Full Name
            </label>
            <input 
              type="text" 
              name="customerName" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black" 
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Delivery Address
            </label>
            <input 
              type="text" 
              name="customerAddress" 
              required 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-14 bg-white font-bold text-black" 
            />
          </div>
        </div>
      </div>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-100"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase font-black text-slate-400 bg-white px-4 tracking-widest">
          Carpet Articles in this Order
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group animate-in fade-in slide-in-from-top-2">
            <input type="hidden" name={`itemId_${index}`} value={typeof item.id === 'string' && !String(item.id).startsWith('init') && !String(item.id).startsWith('new') ? item.id : ''} />
            <input type="hidden" name={`itemStatus_${index}`} value={item.status || 'PENDING'} />
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-black uppercase tracking-widest">Brand</label>
              <select 
                name={`brandId_${index}`} 
                required 
                value={item.brandId}
                onChange={(e) => updateItem(item.id, "brandId", e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-11 bg-white font-bold text-sm text-black"
              >
                <option value="">Brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-black uppercase tracking-widest">Design</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search Design Code..."
                  value={designSearch[item.id] !== undefined ? designSearch[item.id] : (designs.find(d => d.id === item.designId)?.code || "")}
                  onChange={(e) => {
                    setDesignSearch(prev => ({ ...prev, [item.id]: e.target.value }));
                    setShowDesignList(prev => ({ ...prev, [item.id]: true }));
                  }}
                  onFocus={() => setShowDesignList(prev => ({ ...prev, [item.id]: true }))}
                  className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-11 bg-white font-bold text-sm text-black pl-10"
                />
                <Palette className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                
                {showDesignList[item.id] && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {designs
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
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                            {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-contain" />}
                          </div>
                          <div>
                            <p className="font-black text-black text-xs uppercase">{d.code}</p>
                            <p className="text-[10px] text-slate-500 font-bold">{d.name}</p>
                          </div>
                        </button>
                      ))}
                    {designs.filter(d => d.code.toLowerCase().includes((designSearch[item.id] || "").toLowerCase())).length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase">No designs found</div>
                    )}
                  </div>
                )}
              </div>
              <input type="hidden" name={`designId_${index}`} value={item.designId} required />
              {showDesignList[item.id] && <div className="fixed inset-0 z-40" onClick={() => setShowDesignList(prev => ({ ...prev, [item.id]: false }))}></div>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-black uppercase tracking-widest">Article / Size</label>
              <select 
                name={`productId_${index}`} 
                required 
                value={item.productId}
                onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-0 h-11 bg-white font-bold text-sm text-black"
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
                  className="mt-5 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
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
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
        >
          <Plus className="w-4 h-4" />
          Add Another Article
        </button>
      </div>

      <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Order Total</p>
          <p className="text-4xl font-black text-white">{totalPrice} <span className="text-xl text-emerald-500">DT</span></p>
        </div>
        <button 
          type="submit" 
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest px-10 py-5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 w-full md:w-auto"
        >
          {initialData ? 'Update Order' : 'Confirm Final Order'}
        </button>
      </div>
      <input type="hidden" name="itemCount" value={items.length} />
    </form>
  );
}
