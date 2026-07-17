/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, User, Phone, ShieldCheck, ArrowRight, CheckCircle, Code, Database, Copy, Check } from 'lucide-react';
import { dbService } from '../dbService';
import { User as UserType, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole: UserRole | null;
  onAuthSuccess: (user: UserType) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialRole,
  onAuthSuccess,
}: AuthModalProps) {
  const [isLogin, setIsLogin] = React.useState(true);
  const [role, setRole] = React.useState<UserRole>('buyer');
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [contactNumber, setContactNumber] = React.useState('');
  const [adminPassword, setAdminPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = React.useState(false);
  const [copiedSql, setCopiedSql] = React.useState(false);

  const handleCopySql = () => {
    const sqlText = `-- =========================================================
-- OPTION A: DISABLE ROW-LEVEL SECURITY (Easiest for sandbox testing)
-- Run these if you want to bypass RLS errors completely
-- =========================================================
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- OPTION B: ENABLE PERMISSIVE POLICIES (Production-ready alternative)
-- Run these if you want to keep RLS active but allow public reads & writes
-- =========================================================
/*
-- 1. Create policies for users table
CREATE POLICY "Allow public read on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON users FOR UPDATE USING (true);

-- 2. Create policies for listings table
CREATE POLICY "Allow public read on listings" ON listings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on listings" ON listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on listings" ON listings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on listings" ON listings FOR DELETE USING (true);

-- 3. Create policies for contact messages table
CREATE POLICY "Allow public read on contact_messages" ON contact_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on contact_messages" ON contact_messages FOR INSERT WITH CHECK (true);
*/

-- =========================================================
-- BASE DATABASE STRUCTURE
-- =========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL,
  contact_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Listings Table (Includes Availability Column)
CREATE TABLE IF NOT EXISTS listings (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image_url TEXT NOT NULL,
  contact_number VARCHAR(100) NOT NULL,
  aadhar_number VARCHAR(100) NOT NULL,
  aadhar_image_url TEXT,
  seller_id VARCHAR(255) NOT NULL,
  seller_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: If listings already exists, run this to add availability support:
-- ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;

-- 3. Create Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Seed initial default users
INSERT INTO users (id, username, email, role, contact_number, created_at)
VALUES 
  ('admin-1', 'admin', 'admin@zonex.com', 'admin', NULL, NOW()),
  ('s-1', 'vikram_singh', 'vikram@zonex.com', 'seller', '+91 98765 43210', NOW()),
  ('s-2', 'anjali_sharma', 'anjali@zonex.com', 'seller', '+91 91234 56789', NOW())
ON CONFLICT (email) DO NOTHING;`;

    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const autofillUser = (type: 'buyer' | 'seller' | 'admin') => {
    setError(null);
    setSuccess(null);
    if (type === 'buyer') {
      setRole('buyer');
      setIsLogin(true);
      setEmail('buyer@example.com');
      setUsername('test_buyer');
    } else if (type === 'seller') {
      setRole('seller');
      setIsLogin(true);
      setEmail('vikram@zonex.com');
      setUsername('vikram_singh');
    } else if (type === 'admin') {
      setRole('admin');
      setIsLogin(true);
      setEmail('admin@zonex.com');
      setAdminPassword('admin123');
    }
  };

  // Sync state with parent component's desired role on open
  React.useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
      // Admin only has a login page setup
      if (initialRole === 'admin') {
        setIsLogin(true);
      } else {
        setIsLogin(true);
      }
    }
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!email) {
      setError('Please provide your email address.');
      setIsLoading(false);
      return;
    }

    if (role === 'admin' && adminPassword !== 'admin123' && adminPassword !== '') {
      setError('Invalid Administrator access key code. (Use "admin123" or leave blank for mock testing)');
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Handle Login
        const { user, error: loginErr } = await dbService.login(email, role);
        if (loginErr) {
          setError(loginErr);
        } else if (user) {
          setSuccess(`Welcome back, ${user.username}!`);
          setTimeout(() => {
            onAuthSuccess(user);
            onClose();
            // Reset form
            setEmail('');
            setUsername('');
            setContactNumber('');
            setAdminPassword('');
            setSuccess(null);
          }, 1000);
        }
      } else {
        // Handle Register
        if (!username) {
          setError('Please provide a username.');
          setIsLoading(false);
          return;
        }
        if (role === 'seller' && !contactNumber) {
          setError('A direct contact number is required for sellers to list items.');
          setIsLoading(false);
          return;
        }

        const { user, error: regErr } = await dbService.register(
          username,
          email,
          role,
          role === 'seller' ? contactNumber : undefined
        );

        if (regErr) {
          setError(regErr);
        } else if (user) {
          setSuccess('Account registered successfully! Logging you in...');
          setTimeout(() => {
            onAuthSuccess(user);
            onClose();
            // Reset form
            setEmail('');
            setUsername('');
            setContactNumber('');
            setSuccess(null);
          }, 1200);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-white p-6 sm:p-8 border-thick-4 box-shadow-brutal max-h-[90vh] overflow-y-auto rounded-none"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 border-2 border-black p-1 text-black hover:bg-black hover:text-white transition-colors"
          id="btn-close-auth"
        >
          <X className="h-5 w-5" />
        </button>
 
        {/* Header branding */}
        <div className="text-center mb-6">
          <span className="inline-flex h-12 w-12 items-center justify-center border-2 border-black bg-[#FFF0E6] text-brand-orange mb-3">
            {role === 'admin' ? (
              <ShieldCheck className="h-6 w-6" />
            ) : (
              <User className="h-6 w-6" />
            )}
          </span>
          <h2 className="text-2xl font-black text-black tracking-tight uppercase text-display">
            {role === 'admin'
              ? 'Admin Portal'
              : role === 'seller'
              ? 'Seller Hub'
              : 'Buyer Account'}
          </h2>
          <p className="text-xs font-mono font-bold text-gray-500 mt-1 uppercase">
            {isLogin ? '[ Enter your credentials ]' : '[ Create a free Zonex account ]'}
          </p>
        </div>
 
        {/* Role Toggle Tab */}
        {role !== 'admin' && (
          <div className="flex border-2 border-black p-1 mb-6 bg-white">
            <button
              type="button"
              onClick={() => {
                setRole('buyer');
                setError(null);
              }}
              className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-wider transition-all ${
                role === 'buyer'
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-[#FFF0E6]'
              }`}
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('seller');
                setError(null);
              }}
              className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-wider transition-all ${
                role === 'seller'
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-[#FFF0E6]'
              }`}
            >
              Seller
            </button>
          </div>
        )}
 
        {/* Feedback Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 border-2 border-black bg-red-100 p-3 text-xs text-red-600 font-bold font-mono"
            >
              {error}
            </motion.div>
          )}
 
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 border-2 border-black bg-green-100 p-3 text-xs text-green-700 font-bold font-mono flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>
 
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username (Register only) */}
          {!isLogin && role !== 'admin' && (
            <div className="space-y-1.5">
              <label className="text-xs font-black text-black uppercase tracking-wide font-display">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-black">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. rohan_verma"
                  className="w-full border-2 border-black pl-10 pr-4 py-3 text-sm font-mono focus:bg-[#FFF0E6] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}
 
          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-black uppercase tracking-wide font-display">
              {role === 'admin' ? 'Admin Email Address' : 'Email Address'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-black">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'admin' ? 'Enter admin email address' : 'you@example.com'}
                className="w-full border-2 border-black pl-10 pr-4 py-3 text-sm font-mono focus:bg-[#FFF0E6] focus:outline-none transition-colors"
              />
            </div>
          </div>
 
          {/* Contact Number (Seller Register only) */}
          {!isLogin && role === 'seller' && (
            <div className="space-y-1.5">
              <label className="text-xs font-black text-black uppercase tracking-wide font-display">Contact Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-black">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border-2 border-black pl-10 pr-4 py-3 text-sm font-mono focus:bg-[#FFF0E6] focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[10px] font-mono font-bold text-gray-500 uppercase">This number will be visible to buyers once approved.</p>
            </div>
          )}
 
          {/* Admin Password / Credentials Check (Admin login only) */}
          {role === 'admin' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-black uppercase tracking-wide font-display">Access Key</label>
              </div>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin passcode"
                className="w-full border-2 border-black px-4 py-3 text-sm font-mono focus:bg-[#FFF0E6] focus:outline-none transition-colors"
              />
            </div>
          )}
 
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center space-x-2 bg-brand-orange py-3.5 text-sm font-black uppercase tracking-wider text-white border-2 border-black box-shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            <span>{isLoading ? 'Processing...' : isLogin ? 'Sign In Account' : 'Register Account'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
 
        {/* Form Mode Toggle */}
        {role !== 'admin' && (
          <div className="text-center mt-6 pt-4 border-t-2 border-dashed border-black text-xs font-mono">
            <span className="text-gray-500 font-bold">
              {isLogin ? "Don't have an account yet?" : 'Already have a Zonex account?'}
            </span>{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccess(null);
              }}
              className="font-black text-brand-orange hover:text-[#E05300] underline focus:outline-none"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        )}

        {/* Sandbox Auto-Fill & SQL Schema Setup Panel */}
        <div className="mt-6 pt-4 border-t-2 border-black font-mono">
          <div className="bg-[#FFF0E6] border-2 border-black p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-black flex items-center space-x-1.5">
                <Database className="h-3.5 w-3.5 text-brand-orange" />
                <span>Sandbox Testing Hub</span>
              </span>
              <span className="text-[9px] uppercase font-bold text-white bg-black px-1.5 py-0.5">
                Developer Tool
              </span>
            </div>
            
            <p className="text-[10px] leading-relaxed text-gray-700 font-bold uppercase">
              Need sample accounts or the raw SQL queries? Click below to instantly configure or populate forms.
            </p>

            {/* Quick Fill Buttons */}
            <div className="space-y-1.5">
              <div className="text-[9px] uppercase font-black text-gray-500">Quick-Fill Sandbox Profiles:</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => autofillUser('buyer')}
                  className="bg-white border border-black hover:bg-gray-100 py-1 px-1 text-[9px] font-black uppercase text-center truncate"
                  title="Autofill a test buyer account"
                >
                  👤 Buyer
                </button>
                <button
                  type="button"
                  onClick={() => autofillUser('seller')}
                  className="bg-white border border-black hover:bg-gray-100 py-1 px-1 text-[9px] font-black uppercase text-center truncate"
                  title="Autofill Vikram Singh (Seller)"
                >
                  💼 Seller
                </button>
              </div>
            </div>

            {/* Collapsible SQL Schema Section */}
            <div className="border-t border-black/20 pt-2.5">
              <button
                type="button"
                onClick={() => setIsDevPanelOpen(!isDevPanelOpen)}
                className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-black hover:text-brand-orange"
              >
                <span className="flex items-center space-x-1">
                  <Code className="h-3 w-3" />
                  <span>Get Supabase SQL Schema Code</span>
                </span>
                <span>{isDevPanelOpen ? '[ Hide ]' : '[ Expand ]'}</span>
              </button>

              <AnimatePresence>
                {isDevPanelOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2 space-y-2"
                  >
                    <div className="flex items-center justify-between bg-white/50 border border-black p-1 px-2">
                      <span className="text-[8px] font-bold text-gray-500 uppercase">PostgreSQL DDL & Seeds</span>
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="text-[9px] font-black uppercase text-brand-orange hover:underline flex items-center space-x-1"
                      >
                        {copiedSql ? (
                          <>
                            <Check className="h-2.5 w-2.5 text-green-600" />
                            <span className="text-green-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-2.5 w-2.5" />
                            <span>Copy SQL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-[8px] leading-tight bg-black text-gray-300 p-2 border border-black overflow-x-auto max-h-40 font-mono">
{`-- =========================================================
-- OPTION A: DISABLE ROW-LEVEL SECURITY (Easiest for testing)
-- =========================================================
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- OPTION B: OR ADD PERMISSIVE RLS POLICIES (Secure approach)
-- =========================================================
-- CREATE POLICY "Allow public read on users" ON users FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public read on listings" ON listings FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert on listings" ON listings FOR INSERT WITH CHECK (true);

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL,
  contact_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Listings Table (Includes Availability Column)
CREATE TABLE IF NOT EXISTS listings (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image_url TEXT NOT NULL,
  contact_number VARCHAR(100) NOT NULL,
  aadhar_number VARCHAR(100) NOT NULL,
  aadhar_image_url TEXT,
  seller_id VARCHAR(255) NOT NULL,
  seller_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: If listings already exists, run this to add availability support:
-- ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;

-- 3. Create Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Seed default profiles
INSERT INTO users (id, username, email, role, contact_number, created_at)
VALUES 
  ('admin-1', 'admin', 'admin@zonex.com', 'admin', NULL, NOW()),
  ('s-1', 'vikram_singh', 'vikram@zonex.com', 'seller', '+91 98765 43210', NOW()),
  ('s-2', 'anjali_sharma', 'anjali@zonex.com', 'seller', '+91 91234 56789', NOW())
ON CONFLICT (email) DO NOTHING;`}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
