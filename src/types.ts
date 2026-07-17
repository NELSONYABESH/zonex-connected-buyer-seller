/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'seller' | 'buyer' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  contact_number?: string;
  created_at: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  contact_number: string;
  aadhar_number: string;
  aadhar_image_url?: string; // Simulated file or placeholder
  seller_id: string;
  seller_name: string;
  seller_email?: string;
  status: 'pending' | 'approved' | 'rejected';
  is_available?: boolean; // Default true, can be toggled by seller
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}
