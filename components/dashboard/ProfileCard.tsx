import Image from "next/image";
import { Mail, Phone, MapPin, Share2, Pencil } from "lucide-react";

type ProfileProps = {
  name: string;
  phone: string;
  email: string;
  location: string;
  imageUrl: string;
};

export default function ProfileCard({
  name,
  phone,
  email,
  location,
  imageUrl,
}: ProfileProps) {
  return (
    <div className="px-4 pt-8">
      {/* Title */}
      <h2 className="text-2xl font-semibold text-blue-500 mb-4">Profile</h2>

      {/* Card */}
      <div className="bg-white rounded-xl card flex items-center gap-5">
        {/* Profile Image */}
        <Image
          src={imageUrl}
          alt={`${name} profile picture`}
          width={90}
          height={90}
          className="rounded-lg object-cover"
        />

        {/* Info Section */}
        <div className="flex-1 space-y-6 pr-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-700">{name}</h3>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Share2 size={18} className="text-gray-600" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Pencil size={18} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-2 text-sm text-black font-bold space-y-4">
            {/* Téléphone & Email sur la même ligne */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-black" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-black" />
                <a href={`mailto:${email}`} className="text-blue-500">
                  {email}
                </a>
              </div>
            </div>

            {/* Localisation */}
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-black" />
              <span>{location}</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
