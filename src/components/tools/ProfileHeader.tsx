import React, { useRef } from 'react';
import { User, Camera, Loader2 } from 'lucide-react';

interface ProfileHeaderProps {
  name: string;
  email?: string;
  profileImage?: string;
  loading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileHeader({
  name,
  email,
  profileImage,
  loading,
  onImageUpload,
}: ProfileHeaderProps) {
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        {profileImage ? (
          <img
            src={profileImage}
            className="w-32 h-32 rounded-[2.5rem] object-cover ring-4 ring-dragon-cyan/20 neon-glow"
            alt="Profile"
          />
        ) : (
          <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 flex items-center justify-center ring-4 ring-dragon-cyan/20">
            <User size={48} className="text-gray-600" />
          </div>
        )}
        <input
          type="file"
          ref={profileImageInputRef}
          accept="image/*"
          onChange={onImageUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => profileImageInputRef.current?.click()}
          className="absolute bottom-0 right-0 p-3 bg-dragon-cyan text-dragon-black rounded-2xl shadow-lg border-4 border-dragon-black hover:scale-110 transition-transform flex items-center justify-center cursor-pointer"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Camera size={20} />
          )}
        </button>
      </div>
      <h2 className="mt-4 text-2xl font-display font-bold text-white">
        {name || "User"}
      </h2>
      <p className="text-gray-500 font-light text-sm">{email}</p>
    </div>
  );
}
