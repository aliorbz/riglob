'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/lib/wallet';
import { supabase } from '@/lib/supabase';
import { searchLocation, LocationSearchResult } from '@/lib/location';
import { RIGLOB_CONFIG, DiscordRole, ROLE_ORDER } from '@/config/riglob';
import { useToast } from './Toast';
import { X, Upload, MapPin, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddPinModal: React.FC<AddPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { address, isConnected, sendFeeTransaction, isCorrectNetwork } = useWallet();
  const { toast } = useToast();

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState<DiscordRole | ''>('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // UI/Flow states
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSearchResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced location search
  useEffect(() => {
    if (locationQuery.trim().length < 2 || (selectedLocation && selectedLocation.name === locationQuery)) {
      setLocationSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingLocation(true);
      const results = await searchLocation(locationQuery);
      setLocationSuggestions(results);
      setIsSearchingLocation(false);
      setShowLocationDropdown(results.length > 0);
    }, 600000); // 600ms debounce

    // For immediate local user typing feel, we fetch if they type fast or stop
    const fastDelay = setTimeout(async () => {
      setIsSearchingLocation(true);
      const results = await searchLocation(locationQuery);
      setLocationSuggestions(results);
      setIsSearchingLocation(false);
      setShowLocationDropdown(results.length > 0);
    }, 400);

    return () => {
      clearTimeout(delayDebounceFn);
      clearTimeout(fastDelay);
    };
  }, [locationQuery, selectedLocation]);

  // Click outside listener for location dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast('error', 'Profile picture size must be less than 2MB.');
      return;
    }

    // Check type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast('error', 'Please upload a valid image file (PNG, JPG, or WEBP).');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectLocation = (loc: LocationSearchResult) => {
    setSelectedLocation(loc);
    setLocationQuery(loc.name);
    setShowLocationDropdown(false);
  };

  // Compress image client side to 128x128 JPEG format for fast uploads & lightweight database storage
  const compressImageFile = (file: File): Promise<{ blob: Blob; base64: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 128;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height = Math.round((height * max_size) / width);
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width = Math.round((width * max_size) / height);
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ blob: file, base64: event.target?.result as string });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const reader2 = new FileReader();
              reader2.readAsDataURL(blob);
              reader2.onloadend = () => {
                resolve({ blob, base64: reader2.result as string });
              };
            } else {
              resolve({ blob: file, base64: event.target?.result as string });
            }
          }, 'image/jpeg', 0.85);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[RiGlob] Submission started...');

    // 1. Validations
    if (!name || name.trim().length === 0) {
      toast('error', 'Name is required.');
      return;
    }
    if (name.length > 30) {
      toast('error', 'Name must be under 30 characters.');
      return;
    }
    if (!role) {
      toast('error', 'Please select a Discord role.');
      return;
    }
    if (!selectedLocation) {
      toast('error', 'Location is required. Please select one from the suggestions.');
      return;
    }
    if (!avatarFile) {
      toast('error', 'Profile picture is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[RiGlob] Connected address:', address);

      // Web3 Validations
      if (!isConnected || !address) {
        console.error('[RiGlob] Wallet not connected.');
        toast('error', 'Connect your wallet first.');
        setIsSubmitting(false);
        return;
      }

      if (!isCorrectNetwork) {
        console.error('[RiGlob] Incorrect network chainId.');
        toast('error', 'Switch to Ritual testnet.');
        setIsSubmitting(false);
        return;
      }

      // Check wallet duplicate in Supabase
      console.log('[RiGlob] Checking duplicate submissions in database...');
      setStatusMessage('Checking duplicate submissions...');
      const { data: existingPins, error: checkErr } = await supabase
        .from('pins')
        .select('id')
        .eq('wallet_address', address.toLowerCase());

      if (checkErr) {
        console.warn('[RiGlob] Database connection check issue, bypassing:', checkErr.message);
      } else if (existingPins && existingPins.length > 0) {
        console.error('[RiGlob] Duplicate registration detected for wallet:', address);
        toast('error', 'This wallet has already pinned itself.');
        setIsSubmitting(false);
        return;
      }

      // 2. Web3 Transaction Flow
      console.log('[RiGlob] Sending 0.001 RITUAL transaction fee...');
      setStatusMessage(`Sending 0.001 RITUAL transaction...`);
      const txHash = await sendFeeTransaction();
      console.log('[RiGlob] Transaction hash received:', txHash);

      setStatusMessage('Transaction pending, waiting for confirmation...');
      toast('info', 'Transaction pending... Please wait.');

      // Wait for tx confirmation
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log('[RiGlob] Transaction confirmation block complete.');
      toast('success', 'Transaction confirmed.');

      // 3. Avatar Compression & Upload Flow
      console.log('[RiGlob] Compressing avatar image...');
      setStatusMessage('Compressing avatar...');
      const compressed = await compressImageFile(avatarFile);
      console.log('[RiGlob] Image compression complete.');

      setStatusMessage('Uploading profile picture...');
      let profileImageUrl = '';

      try {
        const fileExt = avatarFile.name.split('.').pop() || 'jpg';
        const fileName = `${address.toLowerCase()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        console.log('[RiGlob] Uploading compressed avatar blob to storage path:', filePath);
        const { error: uploadErr } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, compressed.blob);

        if (uploadErr) {
          throw uploadErr;
        }

        const { data: urlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath);

        profileImageUrl = urlData.publicUrl;
        console.log('[RiGlob] Supabase storage upload successful. URL:', profileImageUrl);
      } catch (err) {
        console.warn('[RiGlob] Supabase storage failed, falling back to base64 encoding...', err);
        profileImageUrl = compressed.base64;
      }

      // 4. Save to Database
      console.log('[RiGlob] Saving pin details to pins table...');
      setStatusMessage('Saving details to database...');
      const { error: insertErr } = await supabase.from('pins').insert({
        name: name.trim(),
        role,
        location_name: selectedLocation.name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        profile_image_url: profileImageUrl,
        wallet_address: address.toLowerCase(),
        tx_hash: txHash,
      });

      if (insertErr) {
        console.error('[RiGlob] Database insertion query failed:', insertErr);
        throw insertErr;
      }

      console.log('[RiGlob] Pin registered successfully in database.');
      // 5. Done!
      localStorage.setItem('riglob_has_submitted', 'true');
      toast('success', 'Pin added to RiGlob!');
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      onSuccess();
      onClose();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Submission failed:', err);
      let errorMsg = 'Submission failed. Please check network settings and balance.';
      if (err) {
        if (err.message) {
          errorMsg = err.message;
        } else if (err.details) {
          errorMsg = err.details;
        } else if (typeof err === 'string') {
          errorMsg = err;
        } else {
          try {
            errorMsg = JSON.stringify(err);
          } catch {
            errorMsg = String(err);
          }
        }
      }
      toast('error', errorMsg);
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  const isFormValid = name && role && selectedLocation && avatarFile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden border-[#00ff66]/30 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 select-none">
          <h2 className="text-white font-black tracking-wide flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00ff66]" />
            PIN YOURSELF ON RIGLOB
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5 select-none">
              Name / Alias <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={30}
              placeholder="e.g. RitualistPrime"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-zinc-950/80 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff66]/60 transition-colors"
            />
            <div className="text-right text-[10px] text-gray-500 font-mono mt-1 select-none">
              {name.length}/30 characters
            </div>
          </div>

          {/* Role & Avatar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Discord Role */}
            <div>
              <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5 select-none">
                Discord Role <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value as DiscordRole)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-zinc-950/80 text-white focus:outline-none focus:border-[#00ff66]/60 transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled className="text-gray-600">Select Role</option>
                {ROLE_ORDER.map((r) => (
                  <option key={r} value={r} className="bg-zinc-950 text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Profile Picture Upload */}
            <div>
              <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5 select-none">
                Profile Avatar <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-xl border border-dashed border-white/20 bg-zinc-950 hover:bg-white/[0.02] hover:border-[#00ff66]/40 transition-all cursor-pointer text-gray-500 hover:text-white"
                >
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </button>
                <div className="flex flex-col justify-center select-none">
                  <span className="text-xs text-gray-300 font-semibold truncate max-w-[150px]">
                    {avatarFile ? avatarFile.name : 'Upload image'}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                    PNG, JPG, WEBP (Max 2MB)
                  </span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Location Autocomplete */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5 select-none">
              Location <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Start typing city or country..."
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  if (selectedLocation && e.target.value !== selectedLocation.name) {
                    setSelectedLocation(null);
                  }
                }}
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-zinc-950/80 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff66]/60 transition-colors"
              />
              <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-500" />
              {isSearchingLocation && (
                <Loader2 className="absolute right-3.5 top-3.5 w-4 h-4 text-[#00ff66] animate-spin" />
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showLocationDropdown && locationSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 mt-2 rounded-xl border border-white/10 bg-zinc-950/95 backdrop-blur-md overflow-hidden max-h-48 overflow-y-auto z-50 shadow-2xl font-mono text-xs">
                {locationSuggestions.map((loc, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelectLocation(loc)}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 text-gray-300 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                    <span>{loc.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Submission Info Info-card */}
          <div className="p-4 rounded-xl border border-[#00ff66]/20 bg-[#00ff66]/5 space-y-2 select-none">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00ff66]" />
                Submission Fee:
              </span>
              <span className="text-white font-bold">
                {RIGLOB_CONFIG.submitFeeEth} {RIGLOB_CONFIG.ritualChain.nativeCurrency.symbol}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
              An on-chain transaction is required to record your Discord role and location coordinates on the Ritual Testnet. Only completed transactions are saved.
            </p>
          </div>

          {/* Status Message */}
          {isSubmitting && statusMessage && (
            <div className="flex items-center justify-center gap-2 p-3 bg-[#00ff66]/5 rounded-xl border border-[#00ff66]/15 select-none animate-pulse">
              <Loader2 className="w-4 h-4 text-[#00ff66] animate-spin" />
              <span className="text-xs font-mono text-gray-300 font-semibold">{statusMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-3 rounded-xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
              isFormValid && !isSubmitting
                ? 'bg-[#00ff66] text-black shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:shadow-[0_0_25px_rgba(0,255,102,0.5)] transform hover:scale-[1.01]'
                : 'bg-zinc-800 text-gray-500 border border-zinc-700 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Submission...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Confirm & Pay Fee
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
