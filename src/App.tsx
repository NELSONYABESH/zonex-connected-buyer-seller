/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  PlusCircle,
  FileText,
  Shield,
  HelpCircle,
  Mail,
  User,
  Phone,
  FileCheck,
  Check,
  AlertTriangle,
  X,
  MapPin,
  Lock,
  ArrowRight,
  Sparkles,
  Inbox,
  UploadCloud,
  Trash2
} from 'lucide-react';

import { dbService } from './dbService';
import { Listing, User as UserType, UserRole, ContactMessage } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ListingCard from './components/ListingCard';
import AuthModal from './components/AuthModal';

export default function App() {
  // Navigation & Sessions
  const [activePage, setActivePage] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<UserRole | null>(null);

  // Listings State
  const [listings, setListings] = useState<Listing[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Seller Posting Form Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postPrice, setPostPrice] = useState('');
  const [postContact, setPostContact] = useState('');
  const [postAadhar, setPostAadhar] = useState('');
  const [postImagePreset, setPostImagePreset] = useState('scooter');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [postAadharUrl, setPostAadharUrl] = useState('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=800');
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Admin Active Tab
  const [adminTab, setAdminTab] = useState<'listings' | 'messages'>('listings');
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);

  // Predefined image presets to make posting super easy without hunting for Unsplash URLs
  const IMAGE_PRESETS = [
    { id: 'scooter', label: 'Scooter/Bike', url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=600' },
    { id: 'phone', label: 'Smartphone', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600' },
    { id: 'camera', label: 'Camera Gear', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600' },
    { id: 'laptop', label: 'Laptop / PC', url: 'https://images.unsplash.com/photo-1496181130204-7552cc14ac49?auto=format&fit=crop&q=80&w=600' },
    { id: 'watch', label: 'Smart Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600' },
  ];

  // Fetch initial data
  const loadData = async () => {
    setIsLoading(true);
    const { listings: dbListings } = await dbService.getListings();
    setListings(dbListings);

    const { messages: dbMsgs } = await dbService.getContactMessages();
    setMessages(dbMsgs);

    const { users: dbUsers } = await dbService.getUsers();
    setUsersList(dbUsers || []);
    setIsLoading(false);
  };

  useEffect(() => {
    // Check session
    const storedUser = localStorage.getItem('zonex_logged_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        // Clear corrupt session
        localStorage.removeItem('zonex_logged_user');
      }
    }

    loadData();
  }, []);

  // Sync user status to listings contact view prefill
  useEffect(() => {
    if (currentUser && currentUser.role === 'seller' && currentUser.contact_number) {
      setPostContact(currentUser.contact_number);
    }
  }, [currentUser]);

  const handleAuthSuccess = (user: UserType) => {
    setCurrentUser(user);
    localStorage.setItem('zonex_logged_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('zonex_logged_user');
    setActivePage('home');
  };

  const openAuth = (role: UserRole | null) => {
    setAuthInitialRole(role);
    setIsAuthOpen(true);
  };

  // Submit Listing
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);
    setPostSuccess(null);

    if (!currentUser || currentUser.role !== 'seller') {
      setPostError('Only registered sellers can list products.');
      return;
    }

    if (!postTitle || !postDescription || !postPrice || !postContact || !postAadhar) {
      setPostError('Please complete all mandatory fields, including your Aadhar details.');
      return;
    }

    // Aadhar simple check
    const cleanAadhar = postAadhar.replace(/\s+/g, '');
    if (cleanAadhar.length !== 12 || isNaN(Number(cleanAadhar))) {
      setPostError('Invalid Aadhar number. Aadhar card must consist of exactly 12 numerical digits.');
      return;
    }

    let finalImageUrl = customImageUrl;
    if (postImagePreset !== 'custom') {
      const selected = IMAGE_PRESETS.find((p) => p.id === postImagePreset);
      if (selected) finalImageUrl = selected.url;
    }

    if (!finalImageUrl) {
      setPostError('Please select an image or provide a custom image URL.');
      return;
    }

    try {
      const { listing, error } = await dbService.createListing({
        title: postTitle,
        description: postDescription,
        price: Number(postPrice),
        image_url: finalImageUrl,
        contact_number: postContact,
        aadhar_number: postAadhar,
        aadhar_image_url: postAadharUrl,
        seller_id: currentUser.id,
        seller_name: currentUser.username,
        seller_email: currentUser.email,
      });

      if (error) {
        setPostError(error);
      } else if (listing) {
        setPostSuccess('Listing submitted successfully! Our Admin will verify your Aadhar card details shortly to unhide your contact number.');
        
        // Reload listing data
        await loadData();

        // Reset form fields
        setTimeout(() => {
          setIsPostModalOpen(false);
          setPostTitle('');
          setPostDescription('');
          setPostPrice('');
          setPostAadhar('');
          setCustomImageUrl('');
          setPostImagePreset('scooter');
          setPostSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      setPostError('Failed to create listing. Please try again.');
    }
  };

  // Contact Submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    const { success } = await dbService.saveContactMessage(contactName, contactEmail, contactMessage);
    if (success) {
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      
      // Reload admin messages
      const { messages: dbMsgs } = await dbService.getContactMessages();
      setMessages(dbMsgs);

      setTimeout(() => setContactSuccess(false), 4000);
    }
  };

  // Admin Actions
  const handleApproveListing = async (id: string) => {
    const { error } = await dbService.updateListingStatus(id, 'approved');
    if (!error) {
      await loadData();
    }
  };

  const handleRejectListing = async (id: string) => {
    const { error } = await dbService.updateListingStatus(id, 'rejected');
    if (!error) {
      await loadData();
    }
  };

  // Seller Action Handlers (Delete & Availability)
  const handleDeleteListing = async (id: string) => {
    setAdminActionError(null);
    const { success, error } = await dbService.deleteListing(id);
    if (error) {
      setAdminActionError(`Error deleting listing: ${error}`);
    } else if (success) {
      await loadData();
    }
  };

  const handleToggleAvailability = async (id: string, currentAvailable: boolean) => {
    setAdminActionError(null);
    const { listing, error } = await dbService.updateListingAvailability(id, !currentAvailable);
    if (error) {
      setAdminActionError(`Error updating availability: ${error}`);
    } else if (listing) {
      await loadData();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setPostError('Selected photo is too large. Max size allowed is 10MB.');
        return;
      }
      setPostError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Compress using canvas to ensure it fits perfectly in local storage / database
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max size 800x600 while preserving aspect ratio
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress quality to 0.7 JPEG
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setCustomImageUrl(compressedBase64);
            setPostImagePreset('custom');
          } else {
            // Fallback to uncompressed if canvas context is unavailable
            setCustomImageUrl(event.target?.result as string);
            setPostImagePreset('custom');
          }
        };
        img.onerror = () => {
          setPostError('Failed to load image file.');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter listings for client display
  // Buyers can only see approved listings. Sellers can see their own listings even if pending. Admin can see all.
  const displayedListings = listings.filter((listing) => {
    // Role level check
    const matchesRole =
      listing.status === 'approved' ||
      (currentUser && currentUser.role === 'admin') ||
      (currentUser && currentUser.role === 'seller' && listing.seller_id === currentUser.id);

    if (!matchesRole) return false;

    // Search query check
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.seller_name.toLowerCase().includes(searchQuery.toLowerCase());

    // Price check
    const matchesPrice = maxPrice === '' || listing.price <= Number(maxPrice);

    return matchesSearch && matchesPrice;
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#fdfdfd]" id="zonex-root">
      {/* Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={openAuth}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {/* HOME PAGE */}
          {activePage === 'home' && (
            <motion.div
              key="home-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-16 pb-16"
            >
              {/* Hero Banner Section */}
              <div className="relative overflow-hidden bg-[#fdfdfd] py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                  <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
                    <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center space-x-1.5 border-2 border-black bg-[#FFF0E6] px-3.5 py-1.5 text-xs font-black text-black mb-6 uppercase tracking-wider shadow-[3px_3px_0px_#000]"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-brand-orange" />
                        <span>ZERO AGENT FEES &bull; AADHAR VERIFIED</span>
                      </motion.div>
                      <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-5xl font-black tracking-tight text-black sm:text-6xl md:text-7xl uppercase text-display italic leading-none"
                      >
                        Direct Deals. <br />
                        <span className="text-brand-orange">Verified Sellers.</span>
                      </motion.h1>
                      <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mt-6 text-sm sm:text-base text-gray-800 leading-relaxed font-sans border-l-4 border-brand-orange pl-4"
                      >
                        Welcome to <strong>Zonex</strong>. Sellers post directly with physical Aadhar verification. 
                        Buyers transact directly with zero brokerage. Contacts are unlocked securely only upon 
                        official Admin validation.
                      </motion.p>

                      {/* Interactive Buttons */}
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mt-8 flex flex-wrap gap-4 sm:justify-center lg:justify-start"
                      >
                        {currentUser?.role === 'seller' ? (
                          <button
                            onClick={() => setIsPostModalOpen(true)}
                            className="inline-flex items-center space-x-2 bg-brand-orange px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white border-2 border-black box-shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150"
                          >
                            <PlusCircle className="h-5 w-5" />
                            <span>Post a New Listing</span>
                          </button>
                        ) : currentUser ? (
                          <div className="text-xs bg-white border-2 border-black px-4 py-3 font-mono font-bold text-black flex items-center space-x-2 box-shadow-brutal-sm">
                            <span>You are currently browsing as a <strong>{currentUser.role.toUpperCase()}</strong>.</span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => openAuth('seller')}
                              className="inline-flex items-center space-x-2 bg-brand-orange px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white border-2 border-black box-shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150"
                            >
                              <span>Start Selling Items</span>
                              <ArrowRight className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openAuth('buyer')}
                              className="inline-flex items-center bg-white px-6 py-3.5 text-xs font-black uppercase tracking-widest text-black border-2 border-black box-shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150"
                            >
                              <span>Browse Listings</span>
                            </button>
                          </>
                        )}
                      </motion.div>
                    </div>

                    {/* Branding Display Card */}
                    <div className="mt-12 sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="relative mx-auto w-full max-w-md bg-[#FFF0E6] border-thick-4 p-6 box-shadow-brutal"
                      >
                        <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="h-3.5 w-3.5 border border-black bg-green-500 animate-ping"></span>
                            <span className="text-xs font-black uppercase tracking-wider text-black font-display">Zonex Security Standard</span>
                          </div>
                          <Shield className="h-5 w-5 text-brand-orange" />
                        </div>
                        <div className="space-y-4 font-mono">
                          <div className="flex items-start space-x-3">
                            <span className="flex h-7 w-7 items-center justify-center border-2 border-black bg-brand-orange text-white text-xs font-black">1</span>
                            <div>
                              <h4 className="text-sm font-black text-black uppercase">Seller Posts with Aadhar</h4>
                              <p className="text-[11px] font-bold text-gray-700 mt-0.5 leading-normal">Sellers supply a valid 12-digit UID for verification before publication.</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <span className="flex h-7 w-7 items-center justify-center border-2 border-black bg-brand-orange text-white text-xs font-black">2</span>
                            <div>
                              <h4 className="text-sm font-black text-black uppercase">Admin Lock Active</h4>
                              <p className="text-[11px] font-bold text-gray-700 mt-0.5 leading-normal">Contact numbers are hidden from scraper bots & prospective buyers by default.</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <span className="flex h-7 w-7 items-center justify-center border-2 border-black bg-brand-orange text-white text-xs font-black">3</span>
                            <div>
                              <h4 className="text-sm font-black text-black uppercase">Manual Release</h4>
                              <p className="text-[11px] font-bold text-gray-700 mt-0.5 leading-normal">Admin triggers verification release, safely unhiding contact buttons for buyers.</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters & Product List Section */}
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Search Header banner */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-black tracking-tight uppercase text-display italic">Active Advertisements</h2>
                    <p className="text-xs font-mono font-bold text-gray-500 mt-1 uppercase">
                      Showing {displayedListings.length} verified and pending listings in your area.
                    </p>
                  </div>

                  {/* Search and Filters panel */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search Field */}
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                        <Search className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search bikes, tech..."
                        className="w-full sm:w-60 border-thick-2 rounded-none bg-white pl-9 pr-4 py-2.5 text-xs font-bold text-black font-mono focus:bg-[#FFF0E6] focus:outline-none"
                      />
                    </div>

                    {/* Price Filter */}
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                        <Filter className="h-3.5 w-3.5" />
                      </span>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Max price ($)"
                        className="w-full sm:w-36 border-thick-2 rounded-none bg-white pl-9 pr-4 py-2.5 text-xs font-bold text-black font-mono focus:bg-[#FFF0E6] focus:outline-none"
                      />
                    </div>

                    {/* Clear Button */}
                    {(searchQuery !== '' || maxPrice !== '') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setMaxPrice('');
                        }}
                        className="text-xs font-black uppercase tracking-wider bg-brand-orange text-white border-thick-2 rounded-none px-4 py-2.5 font-mono hover:bg-brand-orange-hover transition-colors"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </div>

                {/* Seller Dashboard banner inside Home */}
                {currentUser?.role === 'seller' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 bg-[#FFF0E6] border-thick-4 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 box-shadow-brutal"
                  >
                    <div className="flex items-center space-x-3.5 text-center sm:text-left">
                      <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-brand-orange text-white">
                        <PlusCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-black uppercase">Seller Hub Active &mdash; Post your Ads</h3>
                        <p className="text-xs font-medium text-gray-700 mt-0.5">Submit item image, price, and government Aadhar card for quick clearance.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPostModalOpen(true)}
                      className="bg-black text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest border-2 border-black box-shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150"
                    >
                      Create Listing
                    </button>
                  </motion.div>
                )}

                {/* Grid Loading */}
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="animate-pulse flex flex-col border-thick-4 bg-white h-96 p-5 box-shadow-brutal">
                        <div className="bg-gray-200 aspect-[4/3] w-full border-2 border-black mb-4"></div>
                        <div className="bg-gray-200 h-5 w-2/3 mb-2"></div>
                        <div className="bg-gray-200 h-3 w-full mb-2"></div>
                        <div className="bg-gray-200 h-3 w-1/2 mt-auto"></div>
                      </div>
                    ))}
                  </div>
                ) : displayedListings.length > 0 ? (
                  // Listings List
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayedListings.map((listing) => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        currentUser={currentUser}
                        onOpenAuth={openAuth}
                        onDeleteListing={handleDeleteListing}
                        onToggleAvailability={handleToggleAvailability}
                      />
                    ))}
                  </div>
                ) : (
                  // Empty State
                  <div className="text-center py-16 bg-white border-thick-4 p-8 max-w-md mx-auto box-shadow-brutal">
                    <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-[#FFF0E6] text-black mx-auto mb-4">
                      <HelpCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-black text-black uppercase">No Listings Match</h3>
                    <p className="text-xs font-medium text-gray-600 mt-1.5 leading-relaxed">
                      We couldn't find any results matches. Try adjusting your search keywords or price filters.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setMaxPrice('');
                      }}
                      className="mt-4 border-thick-2 rounded-none px-4 py-2 text-xs font-mono font-bold text-black bg-white hover:bg-[#FFF0E6] transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ABOUT PAGE */}
          {activePage === 'about' && (
            <motion.div
              key="about-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-12"
            >
              <div className="text-center space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-black bg-[#FFF0E6] border-2 border-black px-3.5 py-1.5 shadow-[3px_3px_0px_#000]">Our Core Philosophy</span>
                <h1 className="text-4xl font-black text-black tracking-tight sm:text-5xl uppercase text-display italic">Building Trust in Direct Commerce</h1>
                <p className="text-sm font-medium text-gray-700 max-w-xl mx-auto leading-relaxed border-l-4 border-brand-orange pl-4 text-left sm:text-center">
                  Zonex was conceptualized to resolve trust friction in online classified ads. By cross-referencing listings with seller Aadhar cards, we eradicate bad actors.
                </p>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                <div className="border-thick-4 bg-white p-6 sm:p-8 space-y-4 box-shadow-brutal">
                  <h3 className="text-xl font-black uppercase text-black font-display tracking-tight">100% Peer-to-Peer</h3>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed font-sans">
                    Most classified platforms require middlemen, escrow holds, or massive transaction fees. Zonex offers absolute zero brokerage deals. The transaction details remain fully peer-to-peer. You discuss terms, inspect goods, and hand over cash directly.
                  </p>
                </div>

                <div className="border-thick-4 bg-white p-6 sm:p-8 space-y-4 box-shadow-brutal">
                  <h3 className="text-xl font-black uppercase text-black font-display tracking-tight">Why Aadhar Verification?</h3>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed font-sans">
                    Online marketplace scams occur due to anonymous burners. At Zonex, sellers must upload their 12-digit Aadhar number and document copy on item submission. Our administrators audit every document to ensure safety for prospective buyers.
                  </p>
                </div>
              </div>

              {/* Interactive Stat banner */}
              <div className="border-thick-4 bg-black text-white p-8 grid grid-cols-3 gap-4 text-center box-shadow-brutal">
                <div>
                  <div className="text-3xl sm:text-5xl font-black text-brand-orange font-mono">100%</div>
                  <div className="text-[10px] sm:text-xs text-gray-300 uppercase font-black tracking-widest mt-1">Verified Sellers</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-5xl font-black text-brand-orange font-mono">$0</div>
                  <div className="text-[10px] sm:text-xs text-gray-300 uppercase font-black tracking-widest mt-1">Brokerage Fees</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-5xl font-black text-brand-orange font-mono">24/7</div>
                  <div className="text-[10px] sm:text-xs text-gray-300 uppercase font-black tracking-widest mt-1">Admin Auditing</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SERVICES PAGE */}
          {activePage === 'services' && (
            <motion.div
              key="services-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-12"
            >
              <div className="text-center space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-black bg-[#FFF0E6] border-2 border-black px-3.5 py-1.5 shadow-[3px_3px_0px_#000]">Our Services</span>
                <h1 className="text-4xl font-black text-black tracking-tight sm:text-5xl uppercase text-display italic">What Zonex Provides</h1>
                <p className="text-sm font-medium text-gray-700 max-w-xl mx-auto leading-relaxed border-l-4 border-brand-orange pl-4 text-left sm:text-center">
                  Explore how we utilize administrative screening and secure database workflows to make trading transparent.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
                {[
                  {
                    title: 'Direct Phone Lock',
                    desc: 'Seller contact numbers are securely obfuscated behind our database. No bots can scrape them.',
                    icon: Lock,
                  },
                  {
                    title: 'Government Identity Check',
                    desc: 'Every listing includes the seller’s verified national ID details, reviewed manually.',
                    icon: FileCheck,
                  },
                  {
                    title: 'Zero Commission Trading',
                    desc: 'Our platform charges absolutely nothing to list or buy items. 100% of the sale goes to the seller.',
                    icon: Shield,
                  },
                  {
                    title: 'Interactive Dashboards',
                    desc: 'Fully loaded dashboards for sellers to review their items and check administrative feedback.',
                    icon: FileText,
                  },
                  {
                    title: 'Admin Verification releasing',
                    desc: 'Our administrator is ready on the clock to verify Aadhar credentials, updating the catalog instantly.',
                    icon: User,
                  },
                  {
                    title: 'Dynamic Search Filtering',
                    desc: 'Smart, responsive query filtering to search listings by name, category, and max price limits.',
                    icon: Search,
                  },
                ].map((serv, idx) => (
                  <div key={idx} className="border-thick-4 bg-white p-6 space-y-4 box-shadow-brutal hover:bg-[#FFF0E6] transition-all duration-150">
                    <span className="inline-flex h-12 w-12 items-center justify-center border-2 border-black bg-brand-orange text-white">
                      <serv.icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-black uppercase text-black font-display tracking-tight">{serv.title}</h3>
                    <p className="text-xs font-bold text-gray-700 leading-relaxed font-sans">{serv.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* CONTACT PAGE */}
          {activePage === 'contact' && (
            <motion.div
              key="contact-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-12"
            >
              <div className="text-center space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-black bg-[#FFF0E6] border-2 border-black px-3.5 py-1.5 shadow-[3px_3px_0px_#000]">Contact Support</span>
                <h1 className="text-4xl font-black text-black tracking-tight sm:text-5xl uppercase text-display italic">We’re Here to Help</h1>
                <p className="text-sm font-medium text-gray-700 max-w-xl mx-auto leading-relaxed border-l-4 border-brand-orange pl-4 text-left sm:text-center">
                  Have inquiries about seller registration, Aadhar guidelines, or verification wait times? Send our team a message.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6">
                {/* Contact Information */}
                <div className="md:col-span-5 space-y-6">
                  <div className="border-thick-4 bg-white p-6 sm:p-8 box-shadow-brutal space-y-6">
                    <h3 className="text-xl font-black uppercase text-black font-display tracking-tight border-b-2 border-black pb-2">Headquarters</h3>
                    
                    <div className="space-y-4 font-mono text-xs font-bold">
                      <div className="flex items-start space-x-3.5">
                        <MapPin className="h-5 w-5 text-brand-orange flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800 leading-relaxed">
                          Zonex Operations Ltd.<br />
                          Secure Hub, 4th Floor, Vasant Kunj<br />
                          New Delhi, India
                        </span>
                      </div>
                      <div className="flex items-start space-x-3.5">
                        <Phone className="h-5 w-5 text-brand-orange flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800">+91 11 4050 9000</span>
                      </div>
                      <div className="flex items-start space-x-3.5">
                        <Mail className="h-5 w-5 text-brand-orange flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800">support@zonex.com</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="md:col-span-7 border-thick-4 bg-white p-6 sm:p-8 box-shadow-brutal">
                  {contactSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8 space-y-3"
                    >
                      <span className="inline-flex h-12 w-12 items-center justify-center border-2 border-black bg-green-100 text-green-700">
                        <Check className="h-6 w-6" />
                      </span>
                      <h3 className="text-xl font-black uppercase text-black font-display tracking-tight">Message Delivered!</h3>
                      <p className="text-xs font-medium text-gray-700 leading-relaxed max-w-xs mx-auto">
                        Thank you for reaching out. Your request has been stored in our secure database. Our administrators will respond shortly.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4" id="contact-form">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-black uppercase text-black font-mono">Full Name</label>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Rohan Verma"
                            className="w-full border-thick-2 rounded-none px-4 py-2.5 text-xs font-bold font-mono focus:bg-[#FFF0E6] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-black uppercase text-black font-mono">Email Address</label>
                          <input
                            type="email"
                            required
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="rohan@example.com"
                            className="w-full border-thick-2 rounded-none px-4 py-2.5 text-xs font-bold font-mono focus:bg-[#FFF0E6] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase text-black font-mono">Your Message</label>
                        <textarea
                          rows={4}
                          required
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Type your inquiry here..."
                          className="w-full border-thick-2 rounded-none px-4 py-2.5 text-xs font-bold font-mono focus:bg-[#FFF0E6] focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-brand-orange text-white font-black uppercase tracking-widest border-2 border-black py-3.5 text-xs box-shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150"
                      >
                        Submit Secure Message
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ADMIN PAGE */}
          {activePage === 'admin' && (
            <motion.div
              key="admin-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 space-y-8"
            >
              {/* Check Admin auth */}
              {currentUser?.role !== 'admin' ? (
                <div className="max-w-md mx-auto border-thick-4 bg-white p-6 sm:p-8 box-shadow-brutal">
                  <div className="text-center space-y-3 mb-6">
                    <span className="inline-flex h-12 w-12 items-center justify-center border-2 border-black bg-brand-orange text-white">
                      <Lock className="h-6 w-6" />
                    </span>
                    <h2 className="text-2xl font-black uppercase text-black font-display tracking-tight">Admin Authentication</h2>
                    <p className="text-xs font-mono font-bold text-gray-600 uppercase">
                      Sign in using your administrative credentials to audit pending listing queues.
                    </p>
                  </div>



                  <button
                    onClick={() => openAuth('admin')}
                    className="w-full bg-black text-white font-black uppercase tracking-widest border-2 border-black py-3.5 text-xs box-shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150 flex items-center justify-center space-x-2"
                  >
                    <span>Proceed to Admin Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                /* Authenticated Admin Console */
                <div className="space-y-8" id="admin-dashboard">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-black pb-5 gap-4">
                    <div>
                      <h1 className="text-3xl font-black text-black uppercase text-display italic tracking-tight">System Control Console</h1>
                      <p className="text-xs font-mono font-bold text-gray-500 mt-1 uppercase">
                        Welcome back, Administrator. Review pending listings and check user contacts.
                      </p>
                    </div>

                    <div className="flex border-thick-2 bg-[#FFF0E6] p-1 font-mono">
                      <button
                        onClick={() => setAdminTab('listings')}
                        className={`px-4 py-2 text-xs font-black uppercase transition-all ${
                          adminTab === 'listings'
                            ? 'bg-brand-orange text-white border border-black shadow-[2px_2px_0px_#000]'
                            : 'text-black hover:text-brand-orange'
                        }`}
                      >
                        Listing Queue ({listings.filter((l) => l.status === 'pending').length})
                      </button>
                      <button
                        onClick={() => setAdminTab('messages')}
                        className={`px-4 py-2 text-xs font-black uppercase transition-all ${
                          adminTab === 'messages'
                            ? 'bg-brand-orange text-white border border-black shadow-[2px_2px_0px_#000]'
                            : 'text-black hover:text-brand-orange'
                        }`}
                      >
                        Inquiries ({messages.length})
                      </button>
                    </div>
                  </div>

                  {/* Dashboard stats panel */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
                    <div className="border-thick-2 bg-white p-5 box-shadow-brutal-sm">
                      <div className="text-[10px] uppercase font-black tracking-wider text-black">Total Listings</div>
                      <div className="text-3xl font-black text-black mt-1">{listings.length}</div>
                    </div>
                    <div className="border-thick-2 bg-[#FFF0E6] p-5 box-shadow-brutal-sm">
                      <div className="text-[10px] uppercase font-black tracking-wider text-black">Approved / Released</div>
                      <div className="text-3xl font-black text-brand-orange mt-1">
                        {listings.filter((l) => l.status === 'approved').length}
                      </div>
                    </div>
                    <div className="border-thick-2 bg-white p-5 box-shadow-brutal-sm">
                      <div className="text-[10px] uppercase font-black tracking-wider text-black">Pending Action</div>
                      <div className="text-3xl font-black text-black mt-1">
                        {listings.filter((l) => l.status === 'pending').length}
                      </div>
                    </div>
                    <div className="border-thick-2 bg-[#FFF0E6] p-5 box-shadow-brutal-sm">
                      <div className="text-[10px] uppercase font-black tracking-wider text-black">Contact Forms</div>
                      <div className="text-3xl font-black text-black mt-1">{messages.length}</div>
                    </div>
                  </div>

                  {/* Admin lists */}
                  <AnimatePresence mode="wait">
                    {adminTab === 'listings' ? (
                      <motion.div
                        key="admin-listings"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white/50 p-2.5 border-2 border-black">
                          <h2 className="text-lg font-black uppercase text-black font-display tracking-tight">Review Auditing Queue</h2>
                          {adminActionError && (
                            <div className="bg-red-50 border-2 border-black px-3 py-1 text-xs text-red-600 font-mono font-bold flex items-center justify-between gap-4">
                              <span>{adminActionError}</span>
                              <button onClick={() => setAdminActionError(null)} className="font-black text-black hover:text-brand-orange uppercase text-[10px]">Dismiss</button>
                            </div>
                          )}
                        </div>

                        {listings.length === 0 ? (
                          <div className="text-center py-12 bg-white border-thick-2 font-mono text-gray-500 font-bold">
                            No listings registered in the system.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {listings.map((l) => (
                              <div
                                key={l.id}
                                className={`border-thick-4 bg-white p-5 sm:p-6 box-shadow-brutal flex flex-col md:flex-row md:items-start gap-6 transition-all ${
                                  l.status === 'approved'
                                    ? 'border-green-600 bg-green-50/10'
                                    : l.status === 'rejected'
                                    ? 'border-red-600 opacity-75'
                                    : 'border-brand-orange'
                                }`}
                              >
                                {/* Thumbnail */}
                                <div className="h-28 w-36 overflow-hidden border-2 border-black flex-shrink-0 bg-gray-50 flex items-center justify-center">
                                  <img
                                    src={l.image_url}
                                    alt={l.title}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600';
                                    }}
                                    className="h-full w-full object-cover"
                                  />
                                </div>

                                {/* Information */}
                                <div className="flex-1 space-y-3">
                                  <div className="flex flex-wrap items-center gap-2 font-mono">
                                    <span className="text-xs font-black text-black bg-gray-200 border border-black px-2.5 py-1">
                                      ID: {l.id}
                                    </span>
                                    <span className="text-xs font-black text-white bg-brand-orange border border-black px-2.5 py-1">
                                      ₹{l.price.toLocaleString('en-IN')}
                                    </span>
                                    <span
                                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border border-black ${
                                        l.status === 'approved'
                                          ? 'bg-green-500 text-white'
                                          : l.status === 'rejected'
                                          ? 'bg-red-500 text-white'
                                          : 'bg-yellow-500 text-black'
                                      }`}
                                    >
                                      {l.status}
                                    </span>
                                  </div>

                                  <div>
                                    <h3 className="text-lg font-black uppercase text-black font-display tracking-tight">{l.title}</h3>
                                    <p className="text-xs text-gray-600 mt-1">{l.description}</p>
                                  </div>

                                  {/* Verification Details - Critical Panel for Administrator */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FFF0E6] border-thick-2 p-4 mt-2 font-mono text-xs font-bold text-black">
                                    <div className="space-y-1">
                                      <div className="text-[10px] uppercase font-black text-brand-orange tracking-wider">Seller Identity Details</div>
                                      <div>
                                        Name: <strong className="text-black">{l.seller_name}</strong>
                                      </div>
                                      <div className="flex items-center space-x-1.5">
                                        <Mail className="h-3 w-3 text-black" />
                                        <span>Email: <span className="underline">{l.seller_email || usersList.find((u) => u.id === l.seller_id)?.email || 'Not provided'}</span></span>
                                      </div>
                                      <div className="flex items-center space-x-1.5">
                                        <Phone className="h-3 w-3 text-black" />
                                        <span>Phone: {l.contact_number}</span>
                                      </div>
                                    </div>

                                    <div className="space-y-1 border-t sm:border-t-0 sm:border-l-2 border-black sm:pl-4 pt-2 sm:pt-0">
                                      <div className="text-[10px] uppercase font-black text-brand-orange tracking-wider flex items-center space-x-1">
                                        <Shield className="h-3 w-3" />
                                        <span>National Aadhar verification</span>
                                      </div>
                                      <div>
                                        No: {l.aadhar_number}
                                      </div>
                                      <a
                                        href={l.aadhar_image_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-brand-orange hover:underline inline-flex items-center space-x-1 uppercase font-black"
                                      >
                                        <span>Preview Aadhar Document Scan</span>
                                      </a>
                                    </div>
                                  </div>
                                </div>

                                {/* Controls */}
                                <div className="flex flex-wrap md:flex-col items-center gap-2 mt-4 md:mt-0 md:self-center">
                                  {l.status === 'pending' ? (
                                    <>
                                      <button
                                        onClick={() => handleApproveListing(l.id)}
                                        className="bg-green-600 text-white font-black uppercase tracking-widest border-2 border-black px-4 py-2.5 text-xs box-shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150 flex items-center space-x-1.5"
                                      >
                                        <Check className="h-4 w-4" />
                                        <span>Approve</span>
                                      </button>
                                      <button
                                        onClick={() => handleRejectListing(l.id)}
                                        className="bg-white text-black font-black uppercase tracking-widest border-2 border-black px-4 py-2.5 text-xs box-shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150 hover:bg-red-50 hover:text-red-600"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-xs font-mono font-bold text-gray-500 uppercase">
                                      Audited & Resolved
                                    </span>
                                  )}
                                  {deletingListingId === l.id ? (
                                    <div className="bg-red-50 border-2 border-black p-3 text-center min-w-[200px] font-mono">
                                      <div className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">
                                        Delete permanently?
                                      </div>
                                      <div className="flex gap-2 justify-center">
                                        <button
                                          onClick={async () => {
                                            await handleDeleteListing(l.id);
                                            setDeletingListingId(null);
                                          }}
                                          className="bg-red-600 text-white py-1.5 px-3 text-[10px] font-black uppercase border-2 border-black hover:bg-red-500 active:translate-y-0.5 transition-all"
                                        >
                                          Yes, Delete
                                        </button>
                                        <button
                                          onClick={() => setDeletingListingId(null)}
                                          className="bg-white text-black py-1.5 px-3 text-[10px] font-black uppercase border-2 border-black hover:bg-gray-100 active:translate-y-0.5 transition-all"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeletingListingId(l.id)}
                                      className="bg-red-600 text-white font-black uppercase tracking-widest border-2 border-black px-4 py-2.5 text-xs box-shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150 flex items-center justify-center space-x-1.5 w-full md:w-auto"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span>Delete</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="admin-messages"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <h2 className="text-lg font-black uppercase text-black font-display tracking-tight">Inbound Contact Inquiries</h2>

                        {messages.length === 0 ? (
                          <div className="text-center py-16 bg-white border-thick-2 font-mono text-gray-400 flex flex-col items-center justify-center space-y-2">
                            <Inbox className="h-8 w-8 text-black" />
                            <span className="font-bold uppercase text-xs">No support messages received yet.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {messages.map((m) => (
                              <div key={m.id} className="border-thick-2 bg-white p-5 space-y-3 box-shadow-brutal-sm font-mono text-black">
                                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                                  <div>
                                    <h3 className="font-black uppercase text-black">{m.name}</h3>
                                    <span className="text-[10px] text-gray-600 font-bold">{m.email}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-500">
                                    {new Date(m.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-gray-700 leading-relaxed bg-[#FFF0E6] border border-black p-3 italic">
                                  "{m.message}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <Footer setActivePage={setActivePage} />

      {/* AUTHENTICATION MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialRole={authInitialRole}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* SELLER CREATION MODAL */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg overflow-y-auto max-h-[90vh] border-thick-4 bg-white p-6 sm:p-8 box-shadow-brutal rounded-none"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="absolute top-5 right-5 border-2 border-black bg-white hover:bg-[#FFF0E6] p-1.5 text-black"
                id="btn-close-post"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black uppercase text-black font-display tracking-tight">Create Listing Advert</h2>
                <p className="text-xs font-mono font-bold text-gray-600 mt-1 uppercase">
                  Fill in details below. Note: your contact number will only unhide for buyers after admin approves your Aadhar number.
                </p>
              </div>

              {/* Error / Success */}
              {postError && (
                <div className="mb-4 border-thick-2 bg-red-100 p-3 text-xs text-black font-mono font-bold">
                  {postError}
                </div>
              )}

              {postSuccess && (
                <div className="mb-4 border-thick-2 bg-green-100 p-3 text-xs text-black font-mono font-bold">
                  {postSuccess}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleCreateListing} className="space-y-4 font-mono" id="post-listing-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-black">Listing Title</label>
                    <input
                      type="text"
                      required
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="e.g. iPhone 15 Pro Max"
                      className="w-full border-thick-2 rounded-none px-4 py-2.5 text-xs font-bold focus:bg-[#FFF0E6] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-black">Price (₹ INR)</label>
                    <input
                      type="number"
                      required
                      value={postPrice}
                      onChange={(e) => setPostPrice(e.target.value)}
                      placeholder="e.g. 95000"
                      className="w-full border-thick-2 rounded-none px-4 py-2.5 text-xs font-bold focus:bg-[#FFF0E6] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-black">Item Description</label>
                  <textarea
                    rows={3}
                    required
                    value={postDescription}
                    onChange={(e) => setPostDescription(e.target.value)}
                    placeholder="Provide condition details, accessories, etc."
                    className="w-full border-thick-2 rounded-none px-4 py-2.5 text-xs font-bold focus:bg-[#FFF0E6] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-black block">Product Image</label>
                  <div className="grid grid-cols-3 gap-2">
                    {IMAGE_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPostImagePreset(p.id);
                        }}
                        className={`border-2 border-black py-2 text-center text-[10px] font-black uppercase transition-all ${
                          postImagePreset === p.id
                            ? 'bg-brand-orange text-white shadow-[2px_2px_0px_#000]'
                            : 'bg-white text-black hover:bg-[#FFF0E6]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                    {customImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPostImagePreset('custom');
                        }}
                        className={`border-2 border-black py-2 text-center text-[10px] font-black uppercase transition-all ${
                          postImagePreset === 'custom'
                            ? 'bg-brand-orange text-white shadow-[2px_2px_0px_#000]'
                            : 'bg-white text-black hover:bg-[#FFF0E6]'
                        }`}
                      >
                        Uploaded Photo
                      </button>
                    )}
                  </div>

                  {/* Real Photo Upload Zone */}
                  <div className="mt-2">
                    <div className="relative border-2 border-dashed border-black p-4 text-center bg-gray-50 hover:bg-[#FFF0E6] transition-colors cursor-pointer flex flex-col items-center justify-center space-y-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="Upload a photo"
                      />
                      <UploadCloud className="h-5 w-5 text-brand-orange" />
                      <span className="text-[11px] font-black uppercase text-black">Upload Real Photo</span>
                      <span className="text-[9px] font-bold text-gray-500 font-mono">JPG, PNG under 2MB (converts to database safe string)</span>
                    </div>
                  </div>

                  {/* Selected / Uploaded Image Preview */}
                  {customImageUrl && (
                    <div className="mt-2 flex items-center space-x-3 bg-gray-50 border-2 border-black p-2">
                      <div className="h-12 w-16 border border-black overflow-hidden flex-shrink-0 bg-white">
                        <img
                          src={customImageUrl}
                          alt="Uploaded Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-black uppercase text-black truncate">Real Image Selected</div>
                        <div className="text-[8px] font-mono font-bold text-gray-500 truncate">
                          Base64 Encoded Image Data
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomImageUrl('');
                          setPostImagePreset('scooter');
                        }}
                        className="bg-red-600 text-white px-2 py-1 border border-black text-[10px] font-black uppercase hover:bg-red-500 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                        title="Remove custom image"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 border-black pt-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-black">Direct Contact Number</label>
                    <input
                      type="tel"
                      required
                      value={postContact}
                      onChange={(e) => setPostContact(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full border-thick-2 rounded-none px-4 py-2.5 text-xs font-bold focus:bg-[#FFF0E6] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-black">Aadhar Card Number</label>
                      <span className="text-[9px] uppercase font-black text-white bg-brand-orange border border-black px-1.5 py-0.5">Required</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={14}
                      value={postAadhar}
                      onChange={(e) => {
                        // Format spaces automatically: 1234 5678 9012
                        const clean = e.target.value.replace(/\D/g, '');
                        const parts = [];
                        for (let i = 0; i < clean.length; i += 4) {
                          parts.push(clean.substring(i, i + 4));
                        }
                        setPostAadhar(parts.join(' ').substring(0, 14));
                      }}
                      placeholder="1234 5678 9012"
                      className="w-full border-thick-2 rounded-none px-4 py-2.5 text-xs font-bold focus:bg-[#FFF0E6] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-black">Aadhar Card Verification Scan</label>
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Simulation active</span>
                  </div>
                  <input
                    type="url"
                    value={postAadharUrl}
                    onChange={(e) => setPostAadharUrl(e.target.value)}
                    placeholder="Enter image URL or use default mock scanner"
                    className="w-full border-thick-2 rounded-none px-4 py-2.5 text-xs font-bold focus:bg-[#FFF0E6] focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-500 font-bold leading-normal">
                    A default high-fidelity placeholder scan is provided for sandbox testing.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-orange text-white font-black uppercase tracking-widest border-2 border-black py-3.5 text-xs box-shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-150 mt-2"
                >
                  Publish Listing for Auditing
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
