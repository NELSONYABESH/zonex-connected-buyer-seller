/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Landmark, Shield, Lock, FileCheck } from 'lucide-react';

interface FooterProps {
  setActivePage: (page: string) => void;
}

export default function Footer({ setActivePage }: FooterProps) {
  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t-4 border-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActivePage('home')}>
              <span className="text-2xl font-black text-display italic uppercase">
                ZONEX<span className="text-brand-orange">.</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed font-sans">
              Zonex is a secure, direct seller-to-buyer platform featuring zero-brokerage deals backed by transparent seller Aadhar-verification.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-brand-orange text-display mb-4">Platform Pages</h3>
            <ul className="space-y-2.5 text-sm font-mono text-gray-400">
              <li>
                <button onClick={() => setActivePage('home')} className="hover:text-brand-orange transition-colors">
                  &gt; Home Catalog
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('about')} className="hover:text-brand-orange transition-colors">
                  &gt; About verification
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('services')} className="hover:text-brand-orange transition-colors">
                  &gt; Core Services
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('contact')} className="hover:text-brand-orange transition-colors">
                  &gt; Contact Support
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('admin')} className="hover:text-brand-orange transition-colors">
                  &gt; Admin Verification Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Core Trust Seals */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-brand-orange text-display mb-4">Trust & Verification</h3>
            <ul className="space-y-3.5">
              <li className="flex items-center space-x-2.5 text-sm text-gray-400 font-mono">
                <Shield className="h-4 w-4 text-brand-orange flex-shrink-0" />
                <span>Aadhar Authenticated</span>
              </li>
              <li className="flex items-center space-x-2.5 text-sm text-gray-400 font-mono">
                <Lock className="h-4 w-4 text-brand-orange flex-shrink-0" />
                <span>Admin Screened Contacts</span>
              </li>
              <li className="flex items-center space-x-2.5 text-sm text-gray-400 font-mono">
                <FileCheck className="h-4 w-4 text-brand-orange flex-shrink-0" />
                <span>100% Zero Brokerage</span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-brand-orange text-display mb-4">Direct Office</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-sans">
              Zonex Operations Ltd.<br />
              Secure Hub, 4th Floor<br />
              Vasant Kunj, New Delhi, India<br />
              <span className="block mt-2 font-mono font-bold text-white">support@zonex.com</span>
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-850 pt-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-xs text-gray-500 font-mono">
            &copy; {new Date().getFullYear()} Zonex Secure Inc. All rights reserved. Zero Brokerage Guarantee.
          </p>
          <div className="flex space-x-4 mt-4 sm:mt-0 text-xs text-gray-500 font-mono">
            <span className="hover:text-gray-400 cursor-pointer">Security Protocol</span>
            <span>&bull;</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms & Conditions</span>
            <span>&bull;</span>
            <span className="hover:text-gray-400 cursor-pointer">Privacy Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
