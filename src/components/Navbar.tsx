/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, User, LogOut, Menu, X, Landmark } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenAuth: (role: 'seller' | 'buyer' | 'admin' | null) => void;
}

export default function Navbar({
  activePage,
  setActivePage,
  currentUser,
  onLogout,
  onOpenAuth,
}: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { label: 'Home', value: 'home' },
    { label: 'About', value: 'about' },
    { label: 'Services', value: 'services' },
    { label: 'Contact', value: 'contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-black bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div 
          onClick={() => setActivePage('home')} 
          className="flex cursor-pointer items-center space-x-2"
          id="nav-logo"
        >
          <div className="text-3xl sm:text-4xl font-black text-display italic tracking-tight uppercase">
            ZONEX<span className="text-brand-orange">.</span>
          </div>
          <div className="hidden sm:block border-l-2 border-black pl-2 py-0.5">
            <div className="text-[10px] font-mono font-black leading-none text-black">SECURE</div>
            <div className="text-[10px] font-mono font-black leading-none text-brand-orange">MARKET</div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                setActivePage(item.value);
                setIsOpen(false);
              }}
              id={`nav-link-${item.value}`}
              className={`relative py-1 text-sm font-black uppercase tracking-widest transition-colors ${
                activePage === item.value
                  ? 'text-brand-orange'
                  : 'text-black hover:text-brand-orange'
              }`}
            >
              {item.label}
              {activePage === item.value && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute bottom-[-4px] left-0 h-1 w-full bg-brand-orange border border-black"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
          {/* Admin link - visible to all but distinct */}
          <button
            onClick={() => setActivePage('admin')}
            id="nav-link-admin"
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider border-2 border-black box-shadow-brutal-sm transition-all ${
              activePage === 'admin'
                ? 'bg-black text-white'
                : 'bg-[#FFF0E6] text-black hover:bg-black hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin Portal</span>
          </button>
        </nav>

        {/* Auth / Account Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 border-2 border-black bg-[#FFF0E6] pl-2 pr-3 py-1 font-mono">
                <div className="flex h-6 w-6 items-center justify-center border border-black bg-brand-orange text-white text-xs font-black">
                  {currentUser.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-black text-black">
                    {currentUser.username}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                id="btn-logout"
                className="flex h-9 w-9 items-center justify-center border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onOpenAuth('buyer')}
                id="btn-login-buyer"
                className="border-2 border-black px-4 py-1.5 text-xs font-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
              >
                Buyer Login
              </button>
              <button
                onClick={() => onOpenAuth('seller')}
                id="btn-login-seller"
                className="bg-brand-orange text-white font-black uppercase tracking-wider border-2 border-black px-4 py-1.5 text-xs box-shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                Seller Hub
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-50 hover:text-black focus:outline-none"
            id="mobile-menu-toggle"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="border-b-4 border-black bg-white px-4 py-4 md:hidden space-y-3"
        >
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setActivePage(item.value);
                  setIsOpen(false);
                }}
                className={`block w-full border-2 border-black px-3 py-2 text-left text-sm font-black uppercase tracking-wider ${
                  activePage === item.value
                    ? 'bg-brand-orange text-white'
                    : 'bg-white text-black hover:bg-[#FFF0E6]'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                setActivePage('admin');
                setIsOpen(false);
              }}
              className={`flex w-full items-center space-x-2 border-2 border-black px-3 py-2 text-left text-sm font-black uppercase tracking-wider ${
                activePage === 'admin'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-[#FFF0E6]'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Portal</span>
            </button>
          </div>

          <div className="border-t-2 border-black pt-4">
            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 px-3 border-2 border-black bg-[#FFF0E6] py-2 font-mono">
                  <div className="flex h-8 w-8 items-center justify-center border border-black bg-brand-orange text-white text-sm font-black">
                    {currentUser.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-black text-black">{currentUser.username}</div>
                    <div className="text-[10px] uppercase font-black text-brand-orange">{currentUser.role}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-center space-x-2 border-2 border-black bg-white py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-black hover:text-white transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout Account</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-2">
                <button
                  onClick={() => {
                    onOpenAuth('buyer');
                    setIsOpen(false);
                  }}
                  className="border-2 border-black bg-white py-2 text-center text-xs font-black uppercase tracking-wider text-black hover:bg-black hover:text-white transition-all"
                >
                  Buyer Login
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('seller');
                    setIsOpen(false);
                  }}
                  className="border-2 border-black bg-brand-orange py-2 text-center text-xs font-black uppercase tracking-wider text-white hover:bg-black hover:text-white transition-all"
                >
                  Seller Hub
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
}
