/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Phone, ShieldAlert, ShieldCheck, User, Eye, Lock, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { Listing, User as UserType } from '../types';

interface ListingCardProps {
  key?: string;
  listing: Listing;
  currentUser: UserType | null;
  onOpenAuth: (role: 'seller' | 'buyer' | 'admin' | null) => void;
  onDeleteListing?: (id: string) => Promise<void>;
  onToggleAvailability?: (id: string, currentAvailable: boolean) => Promise<void>;
}

export default function ListingCard({
  listing,
  currentUser,
  onOpenAuth,
  onDeleteListing,
  onToggleAvailability,
}: ListingCardProps) {
  const [showContact, setShowContact] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const isApproved = listing.status === 'approved';
  const isSellerOwner = currentUser?.role === 'seller' && listing.seller_id === currentUser.id;
  const isAvailable = listing.is_available !== false; // Default true if undefined

  const handleToggleAvailable = async () => {
    if (isUpdating || !onToggleAvailability) return;
    setIsUpdating(true);
    try {
      await onToggleAvailability(listing.id, isAvailable);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (isUpdating || !onDeleteListing) return;
    setIsUpdating(true);
    try {
      await onDeleteListing(listing.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className={`group relative flex flex-col bg-white border-thick box-shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_#000000] transition-all duration-200 ${
        !isAvailable ? 'opacity-90' : ''
      }`}
    >
      {/* Listing Image */}
      <div className="relative aspect-[4/3] w-full bg-gray-100 border-b-3 border-black overflow-hidden">
        {imageError ? (
          <div className="absolute inset-0 bg-[#FFF0E6] flex flex-col items-center justify-center p-4 text-center select-none">
            <div className="bg-brand-orange border-2 border-black p-2 box-shadow-brutal-sm rotate-[-3deg] mb-2">
              <span className="text-2xl">📦</span>
            </div>
            <span className="text-xs font-black uppercase text-black tracking-wider">No Preview Image</span>
            <span className="text-[9px] font-mono font-bold text-gray-500 max-w-[85%] uppercase mt-1 truncate">
              {listing.title}
            </span>
          </div>
        ) : (
          <img
            src={listing.image_url}
            alt={listing.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* SOLD OUT Stamp / Overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-20">
            <span className="bg-red-600 text-white font-black text-lg sm:text-xl uppercase px-4 py-2 border-4 border-black rotate-[-8deg] shadow-[4px_4px_0px_#000] tracking-widest font-display">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          {isApproved ? (
            <span className="inline-flex items-center space-x-1 bg-white px-2.5 py-1 text-xs font-black text-black border-2 border-black shadow-[2px_2px_0px_#000]">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-orange" />
              <span>VERIFIED SELLER</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 bg-[#FFF0E6] px-2.5 py-1 text-xs font-black text-brand-orange border-2 border-black shadow-[2px_2px_0px_#000]">
              <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
              <span>PENDING VERIFICATION</span>
            </span>
          )}
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-3 left-3 z-10 bg-brand-orange px-3 py-1 text-sm font-black text-white font-mono tracking-tight border-2 border-black shadow-[3px_3px_0px_#000]">
          ₹{listing.price.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Listing Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-xs text-black font-bold font-mono">
            <User className="h-3.5 w-3.5 text-black" />
            <span className="truncate max-w-[120px]">{listing.seller_name}</span>
          </span>
          <span className="text-[10px] font-mono font-black text-gray-500">
            {new Date(listing.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <h3 className="text-lg font-black text-black tracking-tight leading-tight mb-2 group-hover:text-brand-orange transition-colors uppercase text-display">
          {listing.title}
        </h3>

        <p className="text-xs text-gray-700 leading-relaxed mb-4 line-clamp-3 font-sans">
          {listing.description}
        </p>

        {/* Spacer */}
        <div className="mt-auto pt-4 border-t-2 border-dashed border-black">
          {/* Seller Owner Action Options */}
          {isSellerOwner ? (
            <div className="space-y-2.5">
              {showConfirmDelete ? (
                <div className="bg-red-50 border-2 border-black p-3 text-center">
                  <div className="text-xs font-black text-red-600 uppercase tracking-wider mb-2">
                    Delete this listing permanently?
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={handleConfirmDelete}
                      className="flex-1 bg-red-600 text-white py-2 text-xs font-black uppercase border-2 border-black active:translate-x-0.5 active:translate-y-0.5 transition-all hover:bg-red-500 disabled:opacity-50"
                    >
                      {isUpdating ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => setShowConfirmDelete(false)}
                      className="flex-1 bg-white text-black py-2 text-xs font-black uppercase border-2 border-black active:translate-x-0.5 active:translate-y-0.5 transition-all hover:bg-gray-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={handleToggleAvailable}
                    className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 text-xs font-black uppercase tracking-wider border-2 border-black active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50 ${
                      isAvailable
                        ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                        : 'bg-green-500 text-white hover:bg-green-400'
                    }`}
                  >
                    {isUpdating ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : isAvailable ? (
                      <span>Mark Sold</span>
                    ) : (
                      <span>Mark Available</span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => setShowConfirmDelete(true)}
                    className="flex items-center justify-center bg-red-600 text-white px-3.5 py-2.5 border-2 border-black hover:bg-red-500 transition-all disabled:opacity-50"
                    title="Delete Listing"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              {!showConfirmDelete && (
                <div className="flex items-center justify-center space-x-1 text-[10px] font-mono font-bold text-gray-500 uppercase">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>You own this listing</span>
                </div>
              )}
            </div>
          ) : !isAvailable ? (
            /* Buyer viewing sold out listing */
            <div className="bg-gray-100 border-2 border-black p-3 text-center">
              <div className="flex items-center justify-center space-x-1.5 text-xs font-black text-gray-500 uppercase font-display">
                <Lock className="h-3.5 w-3.5" />
                <span>Product Sold Out</span>
              </div>
              <p className="text-[10px] text-gray-500 font-mono font-bold leading-normal mt-1">
                This item has been successfully sold and is no longer available.
              </p>
            </div>
          ) : isApproved ? (
            currentUser ? (
              // Logged in user viewing approved item
              <div className="space-y-2">
                {showContact ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between bg-[#FFF0E6] border-2 border-black px-3 py-2 text-sm font-black text-black font-mono"
                  >
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-brand-orange" />
                      <span>{listing.contact_number}</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-black bg-brand-orange text-white px-2 py-0.5 border border-black">
                      DIRECT
                    </span>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setShowContact(true)}
                    className="flex w-full items-center justify-center space-x-2 bg-black py-2.5 text-xs font-black text-white uppercase tracking-wider border-2 border-black hover:bg-brand-orange active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  >
                    <Eye className="h-4 w-4 text-brand-orange" />
                    <span>View Contact Number</span>
                  </button>
                )}
              </div>
            ) : (
              // Unauthenticated buyer viewing approved item
              <div className="space-y-2">
                <button
                  onClick={() => onOpenAuth('buyer')}
                  className="flex w-full items-center justify-center space-x-2 bg-white py-2.5 text-xs font-black text-black uppercase tracking-wider border-2 border-black hover:bg-black hover:text-white transition-all"
                >
                  <Lock className="h-3.5 w-3.5 text-brand-orange" />
                  <span>Login to View Contact</span>
                </button>
                <p className="text-[10px] text-center font-mono font-bold text-gray-500">
                  Secure direct phone hidden to avoid scraping.
                </p>
              </div>
            )
          ) : (
            // Listing still pending - Admin button must release it first
            <div className="bg-[#FFF0E6] border-2 border-black p-3 text-center">
              <div className="flex items-center justify-center space-x-1.5 text-xs font-black text-black uppercase mb-1 font-display">
                <Lock className="h-3.5 w-3.5 text-brand-orange" />
                <span>Contact Locked</span>
              </div>
              <p className="text-[10px] text-gray-700 font-mono font-bold leading-normal">
                Seller contact & Aadhar verification is currently being reviewed by admin.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
