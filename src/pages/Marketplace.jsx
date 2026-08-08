import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { compressImage } from '@/utils/helpers';
import { uploadImageToCloudinary } from '@/utils/cloudinary';
import { Tag, ShoppingBag, Search, Plus, Filter, ArrowRight, ShieldAlert, Sparkles, MessageCircleCode, Image as ImageIcon, Upload, X, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FAKE_SELLERS = [
  'preeti deshmukh',
  'divya joshi',
  'rohan verma',
  'aarav sharma',
  'kavya nair',
  'ananya roy',
  'priya sharma',
  'arjun kumar',
  'neha patel',
  'rahul roy',
  'aditya gupta'
];

export default function Marketplace() {
  const { user } = useAuth();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);

  // Edit / Delete State inside Marketplace
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Subscribe to real-time marketplace items and purge fake listings
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'marketplace'), (snapshot) => {
      const loaded = [];
      snapshot.forEach(d => {
        const data = d.data();
        const sellerName = (data.seller || '').toLowerCase();
        const isFake = !data.sellerUid || FAKE_SELLERS.some(fake => sellerName.includes(fake)) ||
                       ['sanya sen', 'amit patel', 'karan mehra'].some(fake => sellerName.includes(fake));

        if (isFake) {
          // Permanently purge fake seed listing from Firestore
          deleteDoc(doc(db, 'marketplace', d.id)).catch(err => console.error('Purging fake marketplace item:', err));
        } else {
          loaded.push({
            id: d.id,
            docId: d.id,
            ...data
          });
        }
      });

      setItems(loaded);
      setLoading(false);
    }, (err) => {
      console.error('Marketplace listener error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: 'Books',
    condition: 'Excellent',
    age: '',
    desc: '',
    imageUrl: '',
  });

  const categories = ['All', 'Books', 'Electronics', 'Bicycles', 'Clothing', 'Room Essentials'];
  const conditions = ['Like New', 'Excellent', 'Good', 'Fair'];
  const gradients = [
    'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-500',
    'from-emerald-400 to-teal-500',
    'from-purple-400 to-indigo-600',
    'from-rose-400 to-pink-500'
  ];

  const handleImageUpload = async (file, setTargetState) => {
    if (!file) return;
    setImageUploading(true);
    try {
      let finalUrl = '';
      try {
        finalUrl = await uploadImageToCloudinary(file);
      } catch (err) {
        console.warn('Cloudinary upload failed, using compressed base64 image:', err);
        finalUrl = await compressImage(file);
      }
      setTargetState(prev => ({ ...prev, imageUrl: finalUrl }));
    } catch (err) {
      console.error('Failed to process image:', err);
    } finally {
      setImageUploading(false);
    }
  };

  const validateForm = (itemState) => {
    const newErrors = {};
    if (!itemState.name.trim()) newErrors.name = 'Item name is required';
    if (!itemState.price || isNaN(itemState.price) || Number(itemState.price) <= 0) {
      newErrors.price = 'Please enter a valid positive price';
    }
    if (!itemState.age.trim()) newErrors.age = 'Age is required';
    if (!itemState.desc.trim()) newErrors.desc = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(newItem)) return;

    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    const created = {
      name: newItem.name.trim(),
      price: Number(newItem.price),
      category: newItem.category,
      condition: newItem.condition,
      age: newItem.age.trim(),
      desc: newItem.desc.trim(),
      imageUrl: newItem.imageUrl || '',
      seller: user?.name || user?.email?.split('@')[0] || 'Student',
      sellerUid: user?.uid || null,
      gradient: randomGradient,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'marketplace'), created);
      setIsSellOpen(false);
      setNewItem({ name: '', price: '', category: 'Books', condition: 'Excellent', age: '', desc: '', imageUrl: '' });
      setErrors({});
      showSuccess(`Listing for "${created.name}" created successfully!`);
    } catch (e) {
      console.error('Failed to save listing to Firestore:', e);
    }
  };

  const handleSaveEditItem = async (e) => {
    e.preventDefault();
    if (!editingItem || !validateForm(editingItem)) return;

    try {
      await updateDoc(doc(db, 'marketplace', editingItem.id), {
        name: editingItem.name.trim(),
        price: Number(editingItem.price),
        category: editingItem.category,
        condition: editingItem.condition,
        age: editingItem.age.trim(),
        desc: editingItem.desc.trim(),
        imageUrl: editingItem.imageUrl || '',
        updatedAt: new Date().toISOString()
      });

      showSuccess(`Updated listing for "${editingItem.name}"!`);
      setEditingItem(null);
      setErrors({});
    } catch (err) {
      console.error('Failed to update listing:', err);
    }
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      await deleteDoc(doc(db, 'marketplace', deletingItem.id));
      showSuccess(`Deleted listing for "${deletingItem.name}"`);
      setDeletingItem(null);
      if (selectedItem?.id === deletingItem.id) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error('Failed to delete listing:', err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.desc.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleContactSeller = (sellerName, itemTitle, sellerUid) => {
    setSelectedItem(null);
    if (sellerUid && user?.uid && sellerUid === user.uid) {
      navigate('/messages');
      return;
    }
    const productParam = itemTitle ? `&product=${encodeURIComponent(itemTitle)}` : '';
    if (sellerUid) {
      navigate(`/messages?recipientUid=${sellerUid}&recipientName=${encodeURIComponent(sellerName)}${productParam}`);
    } else {
      navigate(`/messages?recipientName=${encodeURIComponent(sellerName)}${productParam}`);
    }
  };

  const isOwner = (item) => {
    if (!user || !item) return false;
    return (item.sellerUid && item.sellerUid === user.uid) ||
           (user.name && item.seller?.toLowerCase() === user.name.toLowerCase());
  };

  return (
    <div className="section-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-sm">
            Campus Marketplace
            <Tag className="w-6 h-6 text-primary-500" />
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-xs">
            Buy and sell textbooks, devices, cycles, and room gear directly with fellow students.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsSellOpen(true)}
          className="self-start md:self-auto flex items-center gap-sm shadow-md"
        >
          <Plus className="w-5 h-5" /> Sell an Item
        </Button>
      </div>

      {/* Safety Notice */}
      <div className="mb-lg p-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center gap-md text-xs text-amber-800 dark:text-amber-300">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-500" />
        <span>
          <strong>Campus Safety Tip:</strong> Always meet buyers/sellers in public campus spots like libraries or food courts. Pay on inspection.
        </span>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row gap-md mb-xl">
        <div className="relative flex-1">
          <Search className="absolute left-lg top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search textbook name, cycle, study desk, laptop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-3xl py-md text-sm"
          />
        </div>

        <div className="flex gap-xs overflow-x-auto pb-xs scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-lg py-md rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Listings */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-lg">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {filteredItems.map(item => {
            const userIsOwner = isOwner(item);
            return (
              <Card key={item.id} className="overflow-hidden p-0 border-neutral-100 dark:border-neutral-800 flex flex-col group hover:shadow-lg transition-all duration-200 relative">
                {/* Product Visual Banner or Photo */}
                <div className="h-48 relative overflow-hidden bg-neutral-900">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-r ${item.gradient || 'from-primary-500 to-blue-600'} p-lg flex flex-col justify-between`}>
                      <div className="text-white mt-auto">
                        <span className="text-xs opacity-90">Listed price</span>
                        <p className="text-2xl font-bold font-heading">₹{item.price}</p>
                      </div>
                    </div>
                  )}

                  {/* Category Badges Overlay */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-black/50 backdrop-blur-md text-white px-md py-xs rounded-full border border-white/10">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-semibold bg-black/50 backdrop-blur-md text-white px-md py-xs rounded-full border border-white/10">
                      {item.condition}
                    </span>
                  </div>

                  {/* Price Tag overlay for image items */}
                  {item.imageUrl && (
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-md py-xs rounded-lg text-white font-mono font-bold text-lg shadow-sm border border-white/10">
                      ₹{item.price}
                    </div>
                  )}

                  {/* Quick Edit/Delete for Owner */}
                  {userIsOwner && (
                    <div className="absolute top-3 right-3 flex items-center gap-xs z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                        className="p-2 bg-black/60 hover:bg-primary-500 text-white rounded-full backdrop-blur-md transition-all shadow-md"
                        title="Edit Listing"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingItem(item); }}
                        className="p-2 bg-black/60 hover:bg-rose-500 text-white rounded-full backdrop-blur-md transition-all shadow-md"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-lg flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-white group-hover:text-primary-500 transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-xs mb-md">
                      Used • {item.age} • listed by {userIsOwner ? 'You' : item.seller}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed mb-lg">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-md border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-lg font-bold text-neutral-900 dark:text-white font-mono">₹{item.price}</span>
                    <div className="flex items-center gap-xs">
                      {userIsOwner ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-xs text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/messages');
                          }}
                        >
                          <MessageCircleCode className="w-3.5 h-3.5 text-primary-500" /> My DMs
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex items-center gap-xs text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactSeller(item.seller, item.name, item.sellerUid);
                          }}
                        >
                          <MessageCircleCode className="w-3.5 h-3.5" /> DM Seller
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-xs text-xs"
                        onClick={() => setSelectedItem(item)}
                      >
                        Details <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-5xl">
          <ShoppingBag className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-md" />
          <h3 className="font-bold text-lg mb-xs">No items listed yet</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-lg">
            Be the first student to list a textbook, cycle, or room essential!
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsSellOpen(true)}>
            Sell an Item Now
          </Button>
        </Card>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.name}
          size="md"
        >
          <div className="space-y-lg">
            {selectedItem.imageUrl ? (
              <div className="h-64 rounded-2xl overflow-hidden bg-neutral-900 relative shadow-inner">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-lg py-xs rounded-xl text-white">
                  <span className="text-[10px] font-semibold opacity-80 uppercase tracking-wider block">{selectedItem.category}</span>
                  <span className="text-2xl font-extrabold font-mono">₹{selectedItem.price}</span>
                </div>
              </div>
            ) : (
              <div className={`h-48 bg-gradient-to-r ${selectedItem.gradient || 'from-primary-500 to-blue-600'} rounded-2xl p-xl text-white flex flex-col justify-end shadow-inner`}>
                <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">{selectedItem.category} • {selectedItem.condition}</span>
                <p className="text-4xl font-extrabold font-mono mt-xs">₹{selectedItem.price}</p>
              </div>
            )}

            <div className="space-y-sm text-sm">
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-xs">
                <span className="text-neutral-500">Seller:</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {isOwner(selectedItem) ? `${selectedItem.seller} (You)` : selectedItem.seller}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-xs">
                <span className="text-neutral-500">Usage Age:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{selectedItem.age}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-xs">
                <span className="text-neutral-500">Condition:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{selectedItem.condition}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-xs">Seller Description</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-800/50 p-md rounded-xl border border-neutral-100 dark:border-neutral-800">
                {selectedItem.desc}
              </p>
            </div>

            <div className="flex gap-md pt-md border-t border-neutral-100 dark:border-neutral-800">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
              {isOwner(selectedItem) ? (
                <div className="flex gap-xs flex-1">
                  <Button
                    variant="primary"
                    className="flex-1 flex items-center justify-center gap-xs text-xs"
                    onClick={() => {
                      const itemToEdit = selectedItem;
                      setSelectedItem(null);
                      setEditingItem(itemToEdit);
                    }}
                  >
                    <Edit2 className="w-4 h-4" /> Edit Listing
                  </Button>
                  <Button
                    variant="secondary"
                    className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border-rose-500/20 text-xs px-md"
                    onClick={() => {
                      const itemToDelete = selectedItem;
                      setSelectedItem(null);
                      setDeletingItem(itemToDelete);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="flex-1 flex items-center justify-center gap-xs"
                  onClick={() => handleContactSeller(selectedItem.seller, selectedItem.name, selectedItem.sellerUid)}
                >
                  <MessageCircleCode className="w-4 h-4" /> Direct Message Seller
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Sell Item Modal */}
      <Modal
        isOpen={isSellOpen}
        onClose={() => { setIsSellOpen(false); setErrors({}); }}
        title="Sell an Item on Campus"
        size="md"
      >
        <form onSubmit={handleSellSubmit} className="space-y-lg">
          {/* Image Upload Component */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
              Product Photo (Optional)
            </label>
            {newItem.imageUrl ? (
              <div className="relative h-40 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-900 group">
                <img
                  src={newItem.imageUrl}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setNewItem({ ...newItem, imageUrl: '' })}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors shadow-md"
                  title="Remove Photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-32 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary-500 dark:hover:border-primary-500 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col items-center justify-center cursor-pointer transition-all p-md text-center group"
              >
                {imageUploading ? (
                  <div className="flex items-center gap-xs text-xs font-semibold text-primary-500">
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing image...
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-neutral-200/60 dark:bg-neutral-800 flex items-center justify-center mb-xs group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-primary-500" />
                    </div>
                    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Click to upload product photo
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      PNG, JPG, WebP up to 5MB
                    </p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files?.[0], setNewItem)}
            />
          </div>

          <Input
            label="Item Title"
            placeholder="e.g. Firefox Target Cycle / Core Java 11th Ed."
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            error={errors.name}
          />

          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
                Category
              </label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="input-base text-sm py-md"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
                Condition
              </label>
              <select
                value={newItem.condition}
                onChange={(e) => setNewItem({ ...newItem, condition: e.target.value })}
                className="input-base text-sm py-md"
              >
                {conditions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md">
            <Input
              label="Price (₹)"
              type="number"
              placeholder="e.g. 1200"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              error={errors.price}
            />

            <Input
              label="Item Age / Usage"
              placeholder="e.g. 6 months old"
              value={newItem.age}
              onChange={(e) => setNewItem({ ...newItem, age: e.target.value })}
              error={errors.age}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
              Detailed Description
            </label>
            <textarea
              rows={3}
              placeholder="Mention features, reason for selling, hostel pickup location..."
              value={newItem.desc}
              onChange={(e) => setNewItem({ ...newItem, desc: e.target.value })}
              className="input-base text-sm resize-none"
            />
            {errors.desc && <p className="text-xs text-danger mt-xs">{errors.desc}</p>}
          </div>

          <div className="flex gap-md pt-md border-t border-neutral-100 dark:border-neutral-800">
            <Button variant="secondary" className="flex-1" onClick={() => setIsSellOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="flex-1" disabled={imageUploading}>
              Publish Listing
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      {editingItem && (
        <Modal
          isOpen={Boolean(editingItem)}
          onClose={() => { setEditingItem(null); setErrors({}); }}
          title="Edit Product Listing"
          size="md"
        >
          <form onSubmit={handleSaveEditItem} className="space-y-lg">
            {/* Image Upload Component */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
                Product Photo
              </label>
              {editingItem.imageUrl ? (
                <div className="relative h-40 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-900 group">
                  <img
                    src={editingItem.imageUrl}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, imageUrl: '' })}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors shadow-md"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => editFileInputRef.current?.click()}
                  className="h-32 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary-500 dark:hover:border-primary-500 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col items-center justify-center cursor-pointer transition-all p-md text-center group"
                >
                  {imageUploading ? (
                    <div className="flex items-center gap-xs text-xs font-semibold text-primary-500">
                      <Loader2 className="w-5 h-5 animate-spin" /> Processing image...
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-neutral-200/60 dark:bg-neutral-800 flex items-center justify-center mb-xs group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-primary-500" />
                      </div>
                      <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Upload or replace product photo
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        PNG, JPG, WebP up to 5MB
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0], setEditingItem)}
              />
            </div>

            <Input
              label="Item Title"
              value={editingItem.name}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              error={errors.name}
            />

            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
                  Category
                </label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="input-base text-sm py-md"
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
                  Condition
                </label>
                <select
                  value={editingItem.condition}
                  onChange={(e) => setEditingItem({ ...editingItem, condition: e.target.value })}
                  className="input-base text-sm py-md"
                >
                  {conditions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <Input
                label="Price (₹)"
                type="number"
                value={editingItem.price}
                onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                error={errors.price}
              />

              <Input
                label="Item Age / Usage"
                value={editingItem.age}
                onChange={(e) => setEditingItem({ ...editingItem, age: e.target.value })}
                error={errors.age}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-xs">
                Detailed Description
              </label>
              <textarea
                rows={3}
                value={editingItem.desc}
                onChange={(e) => setEditingItem({ ...editingItem, desc: e.target.value })}
                className="input-base text-sm resize-none"
              />
              {errors.desc && <p className="text-xs text-danger mt-xs">{errors.desc}</p>}
            </div>

            <div className="flex gap-md pt-md border-t border-neutral-100 dark:border-neutral-800">
              <Button variant="secondary" className="flex-1" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="flex-1" disabled={imageUploading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Item Confirmation Modal */}
      {deletingItem && (
        <Modal
          isOpen={Boolean(deletingItem)}
          onClose={() => setDeletingItem(null)}
          title="Delete Marketplace Listing"
          size="sm"
        >
          <div className="text-center py-sm space-y-md">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white">Delete "{deletingItem.name}"?</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-xs leading-relaxed">
                This listing will be permanently removed from the Campus Marketplace. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-md pt-sm">
              <Button variant="secondary" size="sm" onClick={() => setDeletingItem(null)} className="w-full">
                Cancel
              </Button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                className="w-full py-2 px-md bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
