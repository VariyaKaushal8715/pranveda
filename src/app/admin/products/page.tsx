"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import type { Category, Product } from "@/types/store";
import { formatINR, HEALTH_CONCERNS } from "@/lib/format";
import { useStore } from "@/context/StoreContext";
import { AdminVerifyModal } from "@/components/admin/AdminVerifyModal";

const EMPTY_FORM = {
  id: "",
  name: "",
  subtitle: "",
  description: "",
  ingredients: "",
  benefits: "",
  howToUse: "",
  price: 499,
  compareAtPrice: 599,
  packSize: "100g",
  stock: 50,
  categoryId: "",
  concerns: [] as string[],
  images: [] as string[],
  isFeatured: false,
  isBestSeller: false,
  isActive: true,
};

export default function AdminProductsPage() {
  const { showToast } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [verifyModal, setVerifyModal] = useState<{
    action: () => Promise<void>;
    title: string;
    description: string;
    buttonText: string;
  } | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/products?includeInactive=true"),
        fetch("/api/categories"),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      setProducts(pData.products || []);
      setCategories(cData.categories || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id || "",
    });
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      subtitle: p.subtitle || "",
      description: p.description,
      ingredients: p.ingredients || "",
      benefits: p.benefits || "",
      howToUse: p.howToUse || "",
      price: p.price,
      compareAtPrice: p.compareAtPrice || 0,
      packSize: p.packSize,
      stock: p.stock,
      categoryId: p.categoryId,
      concerns: p.concerns || [],
      images: p.images || [],
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      isActive: p.isActive,
    });
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
        return;
      }
      setForm((prev) => ({ ...prev, images: [data.url, ...prev.images] }));
      showToast("Photo uploaded & set as primary product image!", "success");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const addImageUrl = () => {
    if (!customImageUrl.trim()) return;
    setForm((prev) => ({
      ...prev,
      images: [customImageUrl.trim(), ...prev.images],
    }));
    setCustomImageUrl("");
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const toggleConcern = (c: string) => {
    setForm((prev) => ({
      ...prev,
      concerns: prev.concerns.includes(c)
        ? prev.concerns.filter((x) => x !== c)
        : [...prev.concerns, c],
    }));
  };

  const executeSave = async () => {
    setSaving(true);
    try {
      const isEdit = Boolean(form.id);
      const url = isEdit ? `/api/products/${form.id}` : "/api/products";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          compareAtPrice: form.compareAtPrice > 0 ? form.compareAtPrice : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not save product", "error");
        return;
      }
      showToast(isEdit ? "Product updated!" : "New product added to store!", "success");
      setModalOpen(false);
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const handlePreSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Please enter a product name.", "error");
      return;
    }
    setVerifyModal({
      action: executeSave,
      title: form.id ? "Authorize Product Update" : "Authorize New Product",
      description: `Enter your Admin Password to authorize saving changes for "${form.name}".`,
      buttonText: form.id ? "Authorize & Update" : "Authorize & Create",
    });
  };

  const handleDelete = (p: Product) => {
    setVerifyModal({
      action: async () => {
        const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
        if (res.ok) {
          showToast(`"${p.name}" deleted.`, "info");
          await loadAll();
        } else {
          showToast("Failed to delete product.", "error");
        }
      },
      title: "Authorize Product Deletion",
      description: `Permanent deletion: Enter your Admin Password to authorize deleting "${p.name}".`,
      buttonText: "Authorize & Delete",
    });
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Catalog Manager</p>
          <h1 className="font-serif text-4xl font-bold text-forest">Products &amp; Photos</h1>
          <p className="text-xs text-muted mt-1">
            Click Edit on any demo product to upload your own product photos, or add brand-new PranVeda products.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-forest-light transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 text-gold" /> Add New Product
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted py-12">Loading catalog...</div>
      ) : (
        <div className="bg-white rounded-3xl border border-sand overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-linen/70 border-b border-sand text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Stock</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/70">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-cream/50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={p.images[0] || "/images/ashwagandha.jpg"}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-sand shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-forest truncate max-w-[240px]">
                            {p.name}
                          </div>
                          <div className="text-xs text-muted">{p.packSize}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">{p.category?.name}</td>
                    <td className="px-5 py-4 font-bold text-forest">{formatINR(p.price)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-semibold ${
                          p.stock <= 15 ? "text-terracotta" : "text-forest"
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          p.isActive
                            ? "bg-[#1F6E43]/15 text-[#1F6E43]"
                            : "bg-sand text-muted"
                        }`}
                      >
                        {p.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-linen text-forest text-xs font-semibold hover:bg-forest hover:text-cream transition cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit / Photo
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="inline-flex items-center p-1.5 rounded-full text-muted hover:text-terracotta hover:bg-terracotta/10 transition cursor-pointer"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-sand">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-sand flex items-center justify-between z-10">
              <h2 className="font-serif text-2xl font-bold text-forest">
                {form.id ? "Edit Product & Photos" : "Add New PranVeda Product"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full hover:bg-linen text-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePreSave} className="p-6 space-y-5">
              {/* Photo Upload Section */}
              <div className="p-5 rounded-2xl bg-cream border border-sand space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-gold" /> Product Photos (Upload Your Own!)
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-forest text-cream text-xs font-semibold hover:bg-forest-light cursor-pointer transition">
                    <Upload className="w-4 h-4 text-gold" />
                    {uploading ? "Uploading..." : "Upload Photo from PC"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 flex gap-2 min-w-[200px]">
                    <input
                      type="text"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="Or paste image URL..."
                      className="flex-1 rounded-full border border-sand bg-white px-3.5 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="px-3.5 py-2 rounded-full bg-linen border border-sand text-xs font-semibold text-forest cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt=""
                          className={`w-20 h-20 rounded-xl object-cover border-2 ${
                            idx === 0 ? "border-gold" : "border-sand"
                          }`}
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-forest/90 text-gold text-[9px] font-bold">
                            PRIMARY
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-terracotta text-white flex items-center justify-center text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Product Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-sand px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">Category *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-sand px-3.5 py-2.5 text-sm bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Short Tagline / Subtitle
                </label>
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full rounded-xl border border-sand px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-sand px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.compareAtPrice}
                    onChange={(e) => setForm({ ...form, compareAtPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-sand px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">Pack Size</label>
                  <input
                    value={form.packSize}
                    onChange={(e) => setForm({ ...form, packSize: e.target.value })}
                    placeholder="e.g., 200g / 60 Caps"
                    className="w-full rounded-xl border border-sand px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className="w-full rounded-xl border border-sand px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Health Concerns */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-2">
                  Health Concerns
                </label>
                <div className="flex flex-wrap gap-2">
                  {HEALTH_CONCERNS.map((c) => {
                    const selected = form.concerns.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleConcern(c.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border inline-flex items-center gap-1 cursor-pointer ${
                          selected
                            ? "bg-forest text-cream border-forest"
                            : "bg-cream text-forest border-sand"
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 text-gold" />} {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-sand px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Key Ingredients
                  </label>
                  <textarea
                    rows={2}
                    value={form.ingredients}
                    onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                    className="w-full rounded-xl border border-sand px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">How to Use</label>
                  <textarea
                    rows={2}
                    value={form.howToUse}
                    onChange={(e) => setForm({ ...form, howToUse: e.target.value })}
                    className="w-full rounded-xl border border-sand px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">Key Benefits</label>
                <textarea
                  rows={2}
                  value={form.benefits}
                  onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                  className="w-full rounded-xl border border-sand px-3.5 py-2 text-sm"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6 pt-1 text-xs font-semibold text-forest">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active in Storefront
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isBestSeller}
                    onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })}
                  />
                  Bestseller Badge
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  />
                  Featured on Home
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-sand">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-sand text-xs font-semibold text-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-2.5 rounded-full bg-forest text-cream text-sm font-bold hover:bg-forest-light disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : form.id ? "Save Changes" : "Publish Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Real Security Verification Modal */}
      {verifyModal && (
        <AdminVerifyModal
          isOpen={Boolean(verifyModal)}
          title={verifyModal.title}
          description={verifyModal.description}
          actionButtonText={verifyModal.buttonText}
          onClose={() => setVerifyModal(null)}
          onVerified={async () => {
            await verifyModal.action();
          }}
        />
      )}
    </div>
  );
}
