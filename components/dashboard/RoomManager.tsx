"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api";
import { Room, ROOM_TYPE_OPTIONS, BED_TYPE_OPTIONS, ROOM_TYPE_LABELS, BED_TYPE_LABELS } from "@/types/room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BedDouble, Check, Users, Loader2, CalendarSync, Trash2, Link, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface RoomManagerProps {
    propertyId: string;
}

export default function RoomManager({ propertyId }: RoomManagerProps) {
    const { isAuthenticated } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Image Upload states
    const [dragActive, setDragActive] = useState(false);
    const [imageFiles, setImageFiles] = useState<{ file: File; id: string; preview: string }[]>([]);

    // Form state
    const [formData, setFormData] = useState<Partial<Room>>({
        name: "",
        roomType: "single",
        maxGuests: 2,
        bedCount: 1,
        bedType: "single",
        price: undefined,
        cleaningFee: undefined,
        amenities: { hasWifi: false, hasAirConditioning: false, hasPrivateBathroom: false },
        images: [],
    });

    // iCal sync modal state
    const [isIcalModalOpen, setIsIcalModalOpen] = useState(false);
    const [icalRoom, setIcalRoom] = useState<Room | null>(null);
    const [icalUrl, setIcalUrl] = useState("");
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, [propertyId]);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getRoomsByProperty(propertyId, true);
            setRooms(Array.isArray(res) ? res : (res.rooms || []));
        } catch (error) {
            toast.error("Failed to load rooms");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenNew = () => {
        setEditingRoom(null);
        setFormData({
            name: "",
            roomType: "single",
            maxGuests: 2,
            bedCount: 1,
            bedType: "single",
            price: undefined,
            cleaningFee: undefined,
            amenities: { hasWifi: false, hasAirConditioning: false, hasPrivateBathroom: false },
            images: [],
        });
        setImageFiles([]);
        setDragActive(false);
        setIsRoomModalOpen(true);
    };

    const handleOpenEdit = (room: Room) => {
        setEditingRoom(room);
        setFormData({
            name: room.name,
            roomType: room.roomType,
            roomNumber: room.roomNumber,
            maxGuests: room.maxGuests,
            bedCount: room.bedCount,
            bedType: room.bedType,
            price: room.price,
            cleaningFee: room.cleaningFee,
            amenities: room.amenities || {},
            images: room.images || [],
        });
        setImageFiles([]);
        setDragActive(false);
        setIsRoomModalOpen(true);
    };

    // ─── Image Upload Handlers ────────────────────────────────────────────────
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        processFiles(Array.from(files));
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) {
            processFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
        }
    };

    const processFiles = (files: File[]) => {
        const newImages: typeof imageFiles = [];
        let processedCount = 0;

        files.forEach((file) => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large. Maximum size is 5MB.`);
                processedCount++;
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                newImages.push({
                    id: `${Date.now()}-${Math.random()}`,
                    file,
                    preview: event.target?.result as string,
                });
                processedCount++;
                if (processedCount === files.length) {
                    setImageFiles(prev => [...prev, ...newImages]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeNewImage = (id: string) => {
        setImageFiles(prev => prev.filter(img => img.id !== id));
    };

    const removeExistingImage = async (publicId: string) => {
        if (!editingRoom) return;
        if (!confirm("Are you sure you want to delete this image? It will be removed immediately.")) return;

        try {
            await apiClient.deleteRoomImage(editingRoom._id, publicId);
            setFormData(prev => ({
                ...prev,
                images: (prev.images || []).filter(img => img.publicId !== publicId)
            }));
            fetchRooms(); // refresh in background
            toast.success("Image removed");
        } catch (error) {
            toast.error("Failed to remove image");
        }
    };

    const handleSaveRoom = async () => {
        setSubmitting(true);
        try {
            let savedRoom: Room;

            // 1. Save Room Data
            if (editingRoom) {
                savedRoom = await apiClient.updateRoom(editingRoom._id, formData);
            } else {
                savedRoom = await apiClient.createRoom({ ...formData, propertyId } as any);
            }

            // 2. Upload New Images (if any)
            if (imageFiles.length > 0) {
                const uploadData = new FormData();
                imageFiles.forEach(img => uploadData.append("images", img.file));
                await apiClient.uploadRoomImages(savedRoom._id, uploadData);
            }

            toast.success(editingRoom ? "Room updated successfully" : "Room created successfully");
            setIsRoomModalOpen(false);
            fetchRooms();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save room");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm("Are you sure you want to delete this room? It will be archived.")) return;
        try {
            await apiClient.deleteRoom(roomId);
            toast.success("Room deleted");
            fetchRooms();
        } catch (err) {
            toast.error("Failed to delete room");
        }
    };

    // iCal Logic
    const handleOpenIcal = (room: Room) => {
        setIcalRoom(room);
        setIcalUrl(room.icalUrl || "");
        setIsIcalModalOpen(true);
    };

    const handleSaveIcal = async () => {
        if (!icalRoom) return;
        setSyncing(true);
        try {
            await apiClient.setRoomIcalUrl(icalRoom._id, icalUrl);
            toast.success("iCal URL saved. Syncing now...");
            await apiClient.syncRoomIcal(icalRoom._id);
            toast.success("iCal sync completed.");
            setIsIcalModalOpen(false);
            fetchRooms();
        } catch (err) {
            toast.error("Failed to save or sync iCal url.");
        } finally {
            setSyncing(false);
        }
    };

    const handleManualSync = async (roomId: string) => {
        try {
            toast.info("Syncing calendar...");
            await apiClient.syncRoomIcal(roomId);
            toast.success("Sync complete!");
            fetchRooms();
        } catch (err) {
            toast.error("Sync failed");
        }
    };

    if (loading) {
        return <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>;
    }

    const activeRooms = rooms.filter(r => r.isActive);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">Property Rooms</h3>
                    <p className="text-sm text-slate-500">Manage individual rooms, pricing, and availability calendars.</p>
                </div>
                <Button onClick={handleOpenNew}>Add Room</Button>
            </div>

            {activeRooms.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <BedDouble className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <h4 className="font-semibold text-slate-700">No rooms yet</h4>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                        Add the individual rooms available at this property to let guests book them specifically.
                    </p>
                    <Button variant="outline" onClick={handleOpenNew}>Add First Room</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {activeRooms.map(room => (
                        <div key={room._id} className="bg-white border rounded-2xl p-5 -sm space-y-4 relative group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg mb-1">{room.name} {room.roomNumber && <span className="text-slate-400 font-medium">#{room.roomNumber}</span>}</h4>
                                    <div className="flex gap-2 items-center flex-wrap">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                            {ROOM_TYPE_LABELS[room.roomType]}
                                        </Badge>
                                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                            <Users className="h-3 w-3" /> Max {room.maxGuests}
                                        </span>
                                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                            <BedDouble className="h-3 w-3" /> {room.bedCount}x {BED_TYPE_LABELS[room.bedType]}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {room.price ? (
                                        <div className="font-bold text-lg text-emerald-600">{room.price.toLocaleString()} <span className="text-sm font-normal text-slate-500">/night</span></div>
                                    ) : (
                                        <Badge variant="outline" className="text-slate-500">Uses property price</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(room)}>Edit</Button>
                                <Button size="sm" variant="outline" onClick={() => handleOpenIcal(room)} className={room.icalUrl ? "border-blue-200 text-blue-700 bg-blue-50" : ""}>
                                    <Link className="h-3.5 w-3.5 mr-1.5" />
                                    {room.icalUrl ? 'Calendar Linked' : 'Link iCal'}
                                </Button>
                                {room.icalUrl && (
                                    <Button size="sm" variant="ghost" className="text-slate-500" onClick={() => handleManualSync(room._id)}>
                                        <CalendarSync className="h-4 w-4 mr-1" /> Sync
                                    </Button>
                                )}
                                <div className="flex-1" />
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteRoom(room._id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Room Form Modal ── */}
            <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingRoom ? "Edit Room" : "Add Room"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">

                        <div className="col-span-2 space-y-2">
                            <Label>Room Name <span className="text-red-500">*</span></Label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Deluxe Ocean View" />
                        </div>

                        <div className="space-y-2">
                            <Label>Room Number / ID</Label>
                            <Input value={formData.roomNumber || ''} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} placeholder="e.g. 101" />
                        </div>

                        <div className="space-y-2">
                            <Label>Room Type</Label>
                            <Select value={formData.roomType} onValueChange={(val: any) => setFormData({ ...formData, roomType: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {ROOM_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Max Guests</Label>
                            <Input type="number" min="1" value={formData.maxGuests} onChange={e => setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 1 })} />
                        </div>

                        <div className="space-y-2">
                            <Label>Nightly Price Override</Label>
                            <Input type="number" placeholder="Leave blank to use property price" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value ? parseInt(e.target.value) : undefined })} />
                        </div>

                        <div className="space-y-2">
                            <Label>Bed Type</Label>
                            <Select value={formData.bedType} onValueChange={(val: any) => setFormData({ ...formData, bedType: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {BED_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Bed Count</Label>
                            <Input type="number" min="1" value={formData.bedCount} onChange={e => setFormData({ ...formData, bedCount: parseInt(e.target.value) || 1 })} />
                        </div>

                        <div className="col-span-2 mt-4 space-y-3">
                            <Label>Amenities</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {[
                                    { key: 'hasWifi', label: 'WiFi' },
                                    { key: 'hasAirConditioning', label: 'A/C' },
                                    { key: 'hasPrivateBathroom', label: 'Private Authroom' },
                                    { key: 'hasTv', label: 'TV' },
                                    { key: 'hasBalcony', label: 'Balcony' },
                                    { key: 'hasDesk', label: 'Workspace' },
                                ].map(amenity => (
                                    <label key={amenity.key} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!formData.amenities?.[amenity.key as keyof typeof formData.amenities]}
                                            onChange={e => setFormData({
                                                ...formData,
                                                amenities: { ...formData.amenities, [amenity.key]: e.target.checked }
                                            })}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        {amenity.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* ── Image Upload ── */}
                        <div className="col-span-2 mt-4 space-y-3">
                            <Label className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-blue-600" />
                                Room Images
                            </Label>

                            <div
                                className={`flex flex-col items-center justify-center border-1 border-dashed rounded-xl p-8 transition-colors ${dragActive
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-300 hover:border-blue-400 focus-within:border-blue-500'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <div className="p-3 bg-blue-50 rounded-full mb-3">
                                    <ImageIcon className="h-6 w-6 text-blue-600" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-700">Upload Room Images</h4>
                                <p className="text-xs text-slate-500 mb-4 mt-1">Drag and drop or click to browse (Max 5MB per image)</p>

                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    id="room-image-upload"
                                    onChange={handleImageUpload}
                                />
                                <label htmlFor="room-image-upload">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById('room-image-upload')?.click();
                                        }}
                                    >
                                        Select Images
                                    </Button>
                                </label>
                            </div>

                            {/* Image Previews */}
                            {(formData.images!.length > 0 || imageFiles.length > 0) && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">

                                    {/* Existing Images (from Cloudinary) */}
                                    {formData.images?.map((img) => (
                                        <div key={img.publicId} className="relative group aspect-video rounded-lg overflow-hidden border border-slate-200">
                                            <img src={img.url} alt="Room" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(img.publicId)}
                                                className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 -sm"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Newly Uploaded Images (Pending Save) */}
                                    {imageFiles.map((img) => (
                                        <div key={img.id} className="relative group aspect-video rounded-lg overflow-hidden border-1 border-blue-200 bg-blue-50/50">
                                            <img src={img.preview} alt="New Upload" className="w-full h-full object-cover opacity-80" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-100">
                                                <Badge className="bg-white/90 text-blue-700 hover:bg-white text-[10px] px-1.5 py-0 items-center border -sm">NEW</Badge>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(img.id)}
                                                className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 -sm z-10"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsRoomModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveRoom} disabled={!formData.name || submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {editingRoom ? "Save Changes" : "Create Room"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── iCal Sync Modal ── */}
            <Dialog open={isIcalModalOpen} onOpenChange={setIsIcalModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sync Room Calendar (iCal)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-slate-500">
                            Paste an iCal (.ics) link from Airbnb, Booking.com, or any other calendar to automatically import reservations and block dates for <b>{icalRoom?.name}</b>.
                        </p>
                        <div className="space-y-2">
                            <Label>iCal URL</Label>
                            <Input
                                placeholder="https://www.airbnb.com/calendar/ical/..."
                                value={icalUrl}
                                onChange={e => setIcalUrl(e.target.value)}
                            />
                        </div>
                        {icalRoom?.icalLastSyncedAt && (
                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg">
                                <Check className="h-3.5 w-3.5" />
                                Last synced: {new Date(icalRoom.icalLastSyncedAt).toLocaleString()}
                                ({icalRoom.icalSyncedRangesCount || 0} dates blocked)
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsIcalModalOpen(false)}>Close</Button>
                        <Button onClick={handleSaveIcal} disabled={syncing}>
                            {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save & Sync
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
