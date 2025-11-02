'use client';
import { useState, useRef } from "react";
import { Upload, Video, Image as ImageIcon, X } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function PropertyForm() {
  const router = useRouter();

  // Etats du formulaire
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [propertyType, setPropertyType] = useState("Home");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [saleOrRent, setSaleOrRent] = useState("For Sale");
  const [surface, setSurface] = useState("");
  const [isPublishedModalOpen, setIsPublishedModalOpen] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Upload images
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles.slice(0, 4 - prev.length)]);
    }
  };

  // Upload vidéo
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setVideo(e.target.files[0]);
  };

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));

  // Save & Preview avec async/await
  const handleSaveAndPreview = async () => {
    if (!propertyType || !bedrooms || !bathrooms || !saleOrRent || !surface || !price || images.length === 0) {
      setIsPublishedModalOpen(true);
      return;
    }
    const savedLocation = localStorage.getItem("propertyLocation") || "Not specified";

    const propertyData = {
      description,
      price,
      location: savedLocation,
      bedrooms,
      bathrooms,
      propertyType,
      saleOrRent,
      surface
    };

    // Convertir images en DataURL
    const imageDataUrls = await Promise.all(
      images.map(file => new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      }))
    );

    // Convertir vidéo en DataURL
    let videoDataUrl: string | null = null;
    if (video) {
      videoDataUrl = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(video);
      });
    }

    // Stocker dans localStorage pour preview
    localStorage.setItem("propertyPreviewData", JSON.stringify({ ...propertyData, images: imageDataUrls, video: videoDataUrl }));

  };

  return (
    <div className="w-full max-w-4xl mx-auto p-10 space-y-4 relative">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-blue-600">Upload Your Property Media</h2>
        <p className="text-gray-500 text-sm max-w-90">
          Add images and videos of your property to make it more appealing to buyers or renters.
        </p>
      </div>

      {/* Upload Images */}
      <div className="space-y-7">
        <div className="space-y-5">
          <label className="block text-xs font-semibold text-black mb-2">Add Photos*</label>

          {/* Save & Preview */}
          {images.length >= 1 && (
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => router.push("/PropertyPreview")}
                className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white cursor-pointer"
              >
                Save & Preview
              </button>
            </div>
          )}

          {/* Upload bloc */}
          {images.length < 4 && (
            <div className="border border-gray-300 rounded-lg p-4 space-y-3 flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 transition">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 border rounded-lg px-4 py-2 transition border-gray-300 hover:bg-gray-100 cursor-pointer text-blue-600"
              >
                <Upload className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Upload</span>
              </button>
              <p>{`Minimum 1 image uploaded (${images.length}/4 images)`}</p>
              <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </div>
          )}

          {/* Aperçu des images */}
          <div className="flex gap-4 mt-4">
            {[0,1,2,3].map(index => (
              <div key={index} className="w-34 h-30 bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                {images[index] ? (
                  <>
                    <img src={URL.createObjectURL(images[index])} alt={`preview-${index}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-red-100">
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upload Vidéo */}
        <div>
          <label className="block text-xs font-semibold text-black mb-2">Add Video</label>
          {video ? (
            <div className="w-64 h-36 mt-2 relative">
              <video src={URL.createObjectURL(video)} controls className="w-full h-full rounded-lg shadow" />
              <button type="button" onClick={() => setVideo(null)} className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-red-100">
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ) : (
            <div onClick={() => videoInputRef.current?.click()} className="w-40 h-28 p-3 border border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition">
              <Video className="w-6 h-6 mb-2 text-black" />
              <p className="text-xs text-gray-500">Upload your property video</p>
              <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            </div>
          )}
        </div>

        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.push('/PropertyForm')}
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 cursor-pointer"
        >
          &lt; Back
        </button>
      </div>
    </div>
  );
}
