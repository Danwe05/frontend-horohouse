'use client';

import React, { useState } from 'react';
import {
  BedDouble, Users, Trash2, Plus, ChevronDown, ChevronUp,
  Wifi, Wind, Star, Home, Globe, Wrench, Zap, ImageIcon, X,
} from 'lucide-react';
import { RoomType, BedType, ROOM_TYPE_OPTIONS, BED_TYPE_OPTIONS, ROOM_TYPE_LABELS, BED_TYPE_LABELS } from '@/types/room';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PendingRoomImage {
  id: string;
  file: File;
  preview: string; // object URL
}

export interface PendingRoom {
  id: string; // local only — never sent to API
  name: string;
  roomNumber: string;
  roomType: RoomType;
  bedType: BedType;
  bedCount: number;
  maxGuests: number;
  price: string;       // nightly override — empty = use property price
  cleaningFee: string;
  amenities: {
    hasWifi: boolean;
    hasAirConditioning: boolean;
    hasPrivateBathroom: boolean;
    hasTv: boolean;
    hasBalcony: boolean;
    hasDesk: boolean;
    hasMinibar: boolean;
    hasSafe: boolean;
  };
  imageFiles: PendingRoomImage[];
}

interface HotelRoomBuilderProps {
  rooms: PendingRoom[];
  onChange: (rooms: PendingRoom[]) => void;
}

// ─── UI atoms ──────────────────────────────────────────────────────────────────

const ROOM_AMENITIES: { key: keyof PendingRoom['amenities']; label: string; icon: any }[] = [
  { key: 'hasWifi',           label: 'WiFi',             icon: Wifi   },
  { key: 'hasAirConditioning',label: 'A/C',              icon: Wind   },
  { key: 'hasPrivateBathroom',label: 'Private Bathroom', icon: Home   },
  { key: 'hasTv',             label: 'TV',               icon: Globe  },
  { key: 'hasBalcony',        label: 'Balcony',          icon: Zap    },
  { key: 'hasDesk',           label: 'Workspace',        icon: Wrench },
  { key: 'hasMinibar',        label: 'Minibar',          icon: Star   },
  { key: 'hasSafe',           label: 'Safe',             icon: Star   },
];

const BLANK_ROOM = (): PendingRoom => ({
  id: `${Date.now()}-${Math.random()}`,
  name: '',
  roomNumber: '',
  roomType: 'double',
  bedType: 'double',
  bedCount: 1,
  maxGuests: 2,
  price: '',
  cleaningFee: '',
  amenities: {
    hasWifi: true,
    hasAirConditioning: false,
    hasPrivateBathroom: true,
    hasTv: false,
    hasBalcony: false,
    hasDesk: false,
    hasMinibar: false,
    hasSafe: false,
  },
  imageFiles: [],
});

// ─── Inline form for a single room ──────────────────────────────────────────────

const RoomInlineForm: React.FC<{
  room: PendingRoom;
  onUpdate: (r: PendingRoom) => void;
  onRemove: () => void;
  index: number;
}> = ({ room, onUpdate, onRemove, index }) => {
  const [expanded, setExpanded] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const set = (field: Partial<PendingRoom>) => onUpdate({ ...room, ...field });
  const setAmenity = (key: keyof PendingRoom['amenities'], val: boolean) =>
    onUpdate({ ...room, amenities: { ...room.amenities, [key]: val } });

  // ─── Image handlers ───────────────────────────────────────────────────────
  const addImages = (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!fileArr.length) return;
    const newImages: PendingRoomImage[] = fileArr.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    onUpdate({ ...room, imageFiles: [...room.imageFiles, ...newImages] });
  };

  const removeImage = (id: string) => {
    const removed = room.imageFiles.find(img => img.id === id);
    if (removed?.preview?.startsWith('blob:')) URL.revokeObjectURL(removed.preview);
    onUpdate({ ...room, imageFiles: room.imageFiles.filter(img => img.id !== id) });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    addImages(Array.from(e.dataTransfer.files));
  };

  // ─── Styling ──────────────────────────────────────────────────────────────
  const inputCls =
    'w-full p-3 text-sm border border-[#DDDDDD] rounded-xl text-[#222222] bg-white outline-none focus:border-[#222222] focus:ring-1 focus:ring-[#222222] placeholder-[#B0B0B0] transition-colors';
  const selectCls =
    'w-full p-3 text-sm border border-[#DDDDDD] rounded-xl text-[#222222] bg-white outline-none focus:border-[#222222] transition-colors';
  const uploadInputId = `room-img-${room.id}`;

  return (
    <div className="border border-[#DDDDDD] rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#F7F7F7]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#222222] text-white flex items-center justify-center text-sm font-bold shrink-0">
            {index + 1}
          </div>
          <div>
            <span className="font-semibold text-[#222222] text-sm">
              {room.name || 'New Room'}
            </span>
            {!expanded && room.name && (
              <span className="ml-2 text-xs text-[#717171]">
                {ROOM_TYPE_LABELS[room.roomType]} · {room.bedCount}× {BED_TYPE_LABELS[room.bedType]}
                {room.maxGuests ? ` · ${room.maxGuests} guests` : ''}
                {room.price ? ` · XAF ${Number(room.price).toLocaleString()}/night` : ''}
                {room.imageFiles.length > 0 ? ` · ${room.imageFiles.length} photo${room.imageFiles.length !== 1 ? 's' : ''}` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg hover:bg-[#EBEBEB] text-[#717171] transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-50 text-[#717171] hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable body */}
      {expanded && (
        <div className="p-5 space-y-5">
          {/* Row 1: name + number */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-1 block">
                Room name *
              </label>
              <input
                className={inputCls}
                value={room.name}
                onChange={e => set({ name: e.target.value })}
                placeholder="e.g. Deluxe Ocean View"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-1 block">
                Room No.
              </label>
              <input
                className={inputCls}
                value={room.roomNumber}
                onChange={e => set({ roomNumber: e.target.value })}
                placeholder="e.g. 101"
              />
            </div>
          </div>

          {/* Row 2: type + bed type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-1 block">
                Room type
              </label>
              <select
                className={selectCls}
                value={room.roomType}
                onChange={e => set({ roomType: e.target.value as RoomType })}
              >
                {ROOM_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-1 block">
                Bed type
              </label>
              <select
                className={selectCls}
                value={room.bedType}
                onChange={e => set({ bedType: e.target.value as BedType })}
              >
                {BED_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: counters */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Beds', field: 'bedCount' as const, min: 1 },
              { label: 'Max guests', field: 'maxGuests' as const, min: 1 },
            ].map(({ label, field, min }) => (
              <div key={field}>
                <label className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-1 block">
                  {label}
                </label>
                <div className="flex items-center border border-[#DDDDDD] rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => set({ [field]: Math.max(min, room[field] - 1) })}
                    className="px-3 py-3 text-[#717171] hover:bg-[#F7F7F7] transition-colors font-bold"
                  >−</button>
                  <span className="flex-1 text-center text-sm font-semibold text-[#222222]">
                    {room[field]}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ [field]: room[field] + 1 })}
                    className="px-3 py-3 text-[#717171] hover:bg-[#F7F7F7] transition-colors font-bold"
                  >+</button>
                </div>
              </div>
            ))}
          </div>

          {/* Row 4: pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-1 block">
                Nightly price (XAF)
              </label>
              <input
                className={inputCls}
                type="number"
                min="0"
                value={room.price}
                onChange={e => set({ price: e.target.value })}
                placeholder="Leave blank = property price"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-1 block">
                Cleaning fee (XAF)
              </label>
              <input
                className={inputCls}
                type="number"
                min="0"
                value={room.cleaningFee}
                onChange={e => set({ cleaningFee: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Row 5: amenities */}
          <div>
            <label className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-2 block">
              Room amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROOM_AMENITIES.map(({ key, label, icon: Icon }) => {
                const checked = room.amenities[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAmenity(key, !checked)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left
                      ${checked
                        ? 'border-[#222222] bg-[#F7F7F7] text-[#222222]'
                        : 'border-[#DDDDDD] bg-white text-[#717171] hover:border-[#222222] hover:text-[#222222]'}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 6: images */}
          <div>
            <label className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-2 block">
              Room photos
            </label>

            {/* Drop zone */}
            <div
              className={`relative flex flex-col items-center justify-center border border-dashed rounded-xl py-6 px-4 text-center transition-all cursor-pointer
                ${dragActive
                  ? 'border-[#222222] bg-[#F7F7F7]'
                  : 'border-[#DDDDDD] hover:border-[#222222]'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById(uploadInputId)?.click()}
            >
              <ImageIcon className="w-7 h-7 text-[#B0B0B0] mb-2" />
              <p className="text-xs font-semibold text-[#222222]">Drag photos here or <span className="underline">browse</span></p>
              <p className="text-xs text-[#B0B0B0] mt-0.5">JPG, PNG, WEBP</p>
              <input
                id={uploadInputId}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={e => { if (e.target.files) addImages(e.target.files); e.target.value = ''; }}
              />
            </div>

            {/* Thumbnails */}
            {room.imageFiles.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {room.imageFiles.map((img, i) => (
                  <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden group border border-[#EBEBEB]">
                    <img src={img.preview} alt={`Room photo ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute bottom-1 left-1 text-[9px] font-bold bg-[#222222] text-white px-1.5 py-0.5 rounded-full">
                        Cover
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeImage(img.id); }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-[#222222]" />
                    </button>
                  </div>
                ))}
                {/* Add more tile */}
                <button
                  type="button"
                  onClick={() => document.getElementById(uploadInputId)?.click()}
                  className="aspect-video rounded-lg border border-dashed border-[#DDDDDD] flex flex-col items-center justify-center gap-1 hover:border-[#222222] transition-colors"
                >
                  <Plus className="w-4 h-4 text-[#B0B0B0]" />
                  <span className="text-[10px] text-[#B0B0B0] font-medium">Add</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────────

export const HotelRoomBuilder: React.FC<HotelRoomBuilderProps> = ({ rooms, onChange }) => {
  const addRoom = () => onChange([...rooms, BLANK_ROOM()]);

  const updateRoom = (id: string, updated: PendingRoom) =>
    onChange(rooms.map(r => (r.id === id ? updated : r)));

  const removeRoom = (id: string) => {
    // Revoke object URLs to free memory
    const room = rooms.find(r => r.id === id);
    room?.imageFiles.forEach(img => {
      if (img.preview?.startsWith('blob:')) URL.revokeObjectURL(img.preview);
    });
    onChange(rooms.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-4">
      {rooms.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[#DDDDDD] rounded-2xl">
          <BedDouble className="w-10 h-10 text-[#B0B0B0] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#222222] mb-1">No rooms defined yet</p>
          <p className="text-xs text-[#717171] mb-4 max-w-xs mx-auto">
            Add each bookable room with its type, beds, capacity, pricing, and photos.
          </p>
          <button
            type="button"
            onClick={addRoom}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#222222] text-sm font-semibold text-[#222222] hover:bg-[#F7F7F7] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add first room
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {rooms.map((room, index) => (
              <RoomInlineForm
                key={room.id}
                room={room}
                index={index}
                onUpdate={updated => updateRoom(room.id, updated)}
                onRemove={() => removeRoom(room.id)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addRoom}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-dashed border-[#DDDDDD] text-sm font-semibold text-[#717171] hover:border-[#222222] hover:text-[#222222] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add another room
          </button>

          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>{rooms.length} room{rooms.length !== 1 ? 's' : ''}</strong>{' '}
              with{' '}
              <strong>
                {rooms.reduce((s, r) => s + r.imageFiles.length, 0)} photo
                {rooms.reduce((s, r) => s + r.imageFiles.length, 0) !== 1 ? 's' : ''}
              </strong>{' '}
              will be created after publishing.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default HotelRoomBuilder;
