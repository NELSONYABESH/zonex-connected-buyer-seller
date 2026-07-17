/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { User, Listing, ContactMessage, UserRole } from './types';

// Retrieve Supabase credentials safely
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid and provided
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'MY_SUPABASE_URL' &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

console.log(
  isSupabaseConfigured
    ? 'Zonex: Connected to real Supabase database!'
    : 'Zonex: Supabase credentials not found. Running on high-fidelity Local Storage Engine.'
);

// --- PRE-SEEDED DATA FOR THE LOCAL ENGINE ---
const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'l-1',
    title: 'Super Meteor 650 Custom Cruiser',
    description: 'Immaculate condition Royal Enfield Super Meteor 650. Celestial Blue, first owner, only 2,500 km ridden. Fitted with official touring seats and engine guards. Selling because of relocation.',
    price: 320000,
    image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800',
    contact_number: '+91 98765 43210',
    aadhar_number: '1234 5678 9012',
    aadhar_image_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=800',
    seller_id: 's-1',
    seller_name: 'Vikram Singh',
    seller_email: 'vikram@zonex.com',
    status: 'approved',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    id: 'l-2',
    title: 'iPhone 15 Pro Max - 256GB (Natural Titanium)',
    description: 'Perfect condition, 100% battery health, under Apple warranty till December. Comes with original box, unused braided charging cable, and a premium Spigen armor cover. No scratches, tempered glass pre-applied.',
    price: 95000,
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800',
    contact_number: '+91 91234 56789',
    aadhar_number: '5678 1234 9012',
    aadhar_image_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=800',
    seller_id: 's-2',
    seller_name: 'Anjali Sharma',
    seller_email: 'anjali@zonex.com',
    status: 'approved',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'l-3',
    title: 'Sony Alpha 7 IV Mirrorless Camera (Body Only)',
    description: 'Professional-grade hybrid full-frame camera. 33MP sensor, stunning auto-focus. Used purely for family studio portraits. Shutter count is extremely low (around 3,200). Charger, strap, and 2 batteries included.',
    price: 185000,
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
    contact_number: '+91 88776 55443',
    aadhar_number: '9012 3456 7812',
    aadhar_image_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=800',
    seller_id: 's-3',
    seller_name: 'Rohan Verma',
    seller_email: 'rohan@zonex.com',
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: 'admin-1',
    username: 'admin',
    email: 'admin@zonex.com',
    role: 'admin',
    created_at: new Date().toISOString(),
  },
  {
    id: 's-1',
    username: 'vikram_singh',
    email: 'vikram@zonex.com',
    role: 'seller',
    contact_number: '+91 98765 43210',
    created_at: new Date().toISOString(),
  },
  {
    id: 's-2',
    username: 'anjali_sharma',
    email: 'anjali@zonex.com',
    role: 'seller',
    contact_number: '+91 91234 56789',
    created_at: new Date().toISOString(),
  }
];

// Helper to load/save from localStorage
const getLocalData = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    throw new Error('Local storage quota exceeded. The image file might be too large for browser storage. Please try uploading a different or smaller photo.');
  }
};

// --- DATA SERVICE API ---
export const dbService = {
  // Check if real database is active
  isRealDb: (): boolean => isSupabaseConfigured,

  // --- USER AUTHENTICATION ---
  register: async (
    username: string,
    email: string,
    role: UserRole,
    contactNumber?: string
  ): Promise<{ user: User | null; error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        // Since we are creating a static website with an API key, we simulate auth and write to users table
        const id = 'u-' + Math.random().toString(36).substr(2, 9);
        const newUser: User = {
          id,
          username,
          email,
          role,
          contact_number: contactNumber,
          created_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('users').insert([newUser]);
        if (error) throw error;
        return { user: newUser, error: null };
      } catch (err: any) {
        return { user: null, error: err.message || 'Supabase Registration failed' };
      }
    } else {
      // Local storage auth
      const users = getLocalData<User[]>('zonex_users', DEFAULT_USERS);
      const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return { user: null, error: 'User with this email already exists' };
      }

      const newUser: User = {
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        username,
        email,
        role,
        contact_number: contactNumber,
        created_at: new Date().toISOString(),
      };

      users.push(newUser);
      setLocalData('zonex_users', users);
      return { user: newUser, error: null };
    }
  },

  login: async (
    email: string,
    role: UserRole
  ): Promise<{ user: User | null; error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        // Query users table for existing account
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('role', role)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return { user: null, error: `Account not found with this email for role: ${role}. Please register first.` };
        }
        return { user: data as User, error: null };
      } catch (err: any) {
        return { user: null, error: err.message || 'Supabase Login failed' };
      }
    } else {
      // Local storage auth
      const users = getLocalData<User[]>('zonex_users', DEFAULT_USERS);
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role
      );

      if (!user) {
        // Special automatic registration for admin role in mock database
        if (email.toLowerCase() === 'admin@zonex.com' && role === 'admin') {
          const adminUser = users.find((u) => u.role === 'admin');
          if (adminUser) return { user: adminUser, error: null };
        }
        return { user: null, error: `Account not found with this email for role: ${role}. Please register first.` };
      }

      return { user, error: null };
    }
  },

  // --- LISTINGS / POSTS ---
  getListings: async (): Promise<{ listings: Listing[]; error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return { listings: data as Listing[], error: null };
      } catch (err: any) {
        return { listings: [], error: err.message || 'Failed to fetch listings from Supabase' };
      }
    } else {
      const listings = getLocalData<Listing[]>('zonex_listings', INITIAL_LISTINGS);
      // Sort newest first
      const sorted = [...listings].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { listings: sorted, error: null };
    }
  },

  createListing: async (listingData: {
    title: string;
    description: string;
    price: number;
    image_url: string;
    contact_number: string;
    aadhar_number: string;
    aadhar_image_url?: string;
    seller_id: string;
    seller_name: string;
    seller_email?: string;
  }): Promise<{ listing: Listing | null; error: string | null }> => {
    const newListing: Listing = {
      id: 'l-' + Math.random().toString(36).substr(2, 9),
      title: listingData.title,
      description: listingData.description,
      price: Number(listingData.price),
      image_url: listingData.image_url,
      contact_number: listingData.contact_number,
      aadhar_number: listingData.aadhar_number,
      aadhar_image_url: listingData.aadhar_image_url || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=800',
      seller_id: listingData.seller_id,
      seller_name: listingData.seller_name,
      seller_email: listingData.seller_email,
      status: 'pending', // Starts as pending, needs admin verification to unhide contact number
      is_available: true,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('listings').insert([newListing]);
        if (error) {
          // If error is about missing column (is_available or seller_email), try pruning them
          if (
            error.message?.includes('is_available') || 
            error.message?.includes('seller_email') || 
            error.message?.includes('column "is_available"') ||
            error.message?.includes('column "seller_email"')
          ) {
            const prunnedListing: any = { ...newListing };
            delete prunnedListing.is_available;
            delete prunnedListing.seller_email;
            const { error: retryError } = await supabase.from('listings').insert([prunnedListing]);
            if (retryError) throw retryError;
            return { listing: newListing, error: null };
          }
          throw error;
        }
        return { listing: newListing, error: null };
      } catch (err: any) {
        return { listing: null, error: err.message || 'Failed to create listing in Supabase' };
      }
    } else {
      try {
        const listings = getLocalData<Listing[]>('zonex_listings', INITIAL_LISTINGS);
        listings.push(newListing);
        setLocalData('zonex_listings', listings);
        return { listing: newListing, error: null };
      } catch (err: any) {
        return { listing: null, error: err.message || 'Local storage is full. Please try uploading a different or smaller photo.' };
      }
    }
  },

  deleteListing: async (
    id: string
  ): Promise<{ success: boolean; error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('listings')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to delete listing from Supabase' };
      }
    } else {
      const listings = getLocalData<Listing[]>('zonex_listings', INITIAL_LISTINGS);
      const filtered = listings.filter((l) => l.id !== id);
      setLocalData('zonex_listings', filtered);
      return { success: true, error: null };
    }
  },

  updateListingAvailability: async (
    id: string,
    isAvailable: boolean
  ): Promise<{ listing: Listing | null; error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('listings')
          .update({ is_available: isAvailable })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          if (error.message?.includes('is_available') || error.message?.includes('column "is_available" of relation "listings" does not exist')) {
            // Graceful instructions for adding column
            return { listing: null, error: 'Database requires "is_available" column. Run the Option A/B query in Sandbox Testing Hub to add it!' };
          }
          throw error;
        }
        return { listing: data as Listing, error: null };
      } catch (err: any) {
        return { listing: null, error: err.message || 'Failed to update availability in Supabase' };
      }
    } else {
      const listings = getLocalData<Listing[]>('zonex_listings', INITIAL_LISTINGS);
      const index = listings.findIndex((l) => l.id === id);
      if (index === -1) {
        return { listing: null, error: 'Listing not found' };
      }

      listings[index].is_available = isAvailable;
      setLocalData('zonex_listings', listings);
      return { listing: listings[index], error: null };
    }
  },

  updateListingStatus: async (
    id: string,
    status: 'approved' | 'rejected'
  ): Promise<{ listing: Listing | null; error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('listings')
          .update({ status })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return { listing: data as Listing, error: null };
      } catch (err: any) {
        return { listing: null, error: err.message || 'Failed to update listing in Supabase' };
      }
    } else {
      const listings = getLocalData<Listing[]>('zonex_listings', INITIAL_LISTINGS);
      const index = listings.findIndex((l) => l.id === id);
      if (index === -1) {
        return { listing: null, error: 'Listing not found' };
      }

      listings[index].status = status;
      setLocalData('zonex_listings', listings);
      return { listing: listings[index], error: null };
    }
  },

  // --- CONTACT MESSAGES ---
  saveContactMessage: async (
    name: string,
    email: string,
    message: string
  ): Promise<{ success: boolean; error: string | null }> => {
    const newMessage: ContactMessage = {
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      message,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('contact_messages').insert([newMessage]);
        if (error) throw error;
        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to submit message to Supabase' };
      }
    } else {
      const messages = getLocalData<ContactMessage[]>('zonex_messages', []);
      messages.push(newMessage);
      setLocalData('zonex_messages', messages);
      return { success: true, error: null };
    }
  },

  getContactMessages: async (): Promise<{ messages: ContactMessage[]; error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return { messages: data as ContactMessage[], error: null };
      } catch (err: any) {
        return { messages: [], error: err.message || 'Failed to fetch messages' };
      }
    } else {
      const messages = getLocalData<ContactMessage[]>('zonex_messages', []);
      return { messages, error: null };
    }
  },

  getUsers: async (): Promise<{ users: User[]; error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return { users: data as User[], error: null };
      } catch (err: any) {
        return { users: [], error: err.message || 'Failed to fetch users from Supabase' };
      }
    } else {
      const users = getLocalData<User[]>('zonex_users', DEFAULT_USERS);
      return { users, error: null };
    }
  },
};
