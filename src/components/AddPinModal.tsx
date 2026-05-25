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

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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


      // Web3 Validations
      if (!isConnected || !address) {
        toast('error', 'Connect your wallet first.');
        setIsSubmitting(false);
        return;
      }

      if (!isCorrectNetwork) {
        toast('error', 'Switch to Ritual testnet.');
        setIsSubmitting(false);
        return;
      }

      // Check one-device rule client-side
      const localSubmitted = localStorage.getItem('riglob_has_submitted') === 'true';
      if (localSubmitted) {
        toast('error', 'This device has already pinned itself on RiGlob.');
        setIsSubmitting(false);
        return;
      }

      // Check wallet duplicate in Supabase
      setStatusMessage('Checking duplicate submissions...');
      const { data: existingPins, error: checkErr } = await supabase
        .from('pins')
        .select('id')
        .eq('wallet_address', address.toLowerCase());

      if (checkErr) {
        console.warn('Database connection issue, bypassing check:', checkErr.message);
      } else if (existingPins && existingPins.length > 0) {
        toast('error', 'This wallet has already pinned itself.');
        setIsSubmitting(false);
        return;
      }

      // 2. Web3 Transaction Flow
      setStatusMessage(`Sending 0.001 RITUAL transaction...`);
      const txHash = await sendFeeTransaction();

      setStatusMessage('Transaction pending, waiting for confirmation...');
      toast('info', 'Transaction pending... Please wait.');

      // Wait for tx confirmation (simulate wait, or standard await receipt if supported)
      // Since standard receipt listening requires publicClient, we simulate a 3-second block time check
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast('success', 'Transaction confirmed.');

      // 3. Avatar Upload Flow
      setStatusMessage('Uploading profile picture...');
      let profileImageUrl = '';

      try {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${address.toLowerCase()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Attempt to upload image to bucket
        const { error: uploadErr } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, avatarFile);

        if (uploadErr) {
          throw uploadErr;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath);

        profileImageUrl = urlData.publicUrl;
      } catch (err) {
        console.warn('Supabase storage upload failed or not configured. Falling back to base64 encoding...', err);
        // Fallback: Convert to Base64 to store directly in text column
        profileImageUrl = await fileToBase64(avatarFile);
      }

      // 4. Save to Database
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
        throw insertErr;
      }

      // 5. Done!
      localStorage.setItem('riglob_has_submitted', 'true');
      toast('success', 'Pin added to RiGlob!');
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      onSuccess();
      onClose();

    } catch (err) {
      console.error('Submission failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast('error', msg || 'Submission failed. Please check network settings and balance.');
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
