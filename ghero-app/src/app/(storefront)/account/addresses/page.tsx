import React from "react";
import { Plus } from "lucide-react";

export default function AddressesPage() {
  const addresses = [
    {
      id: 1,
      name: "Priya Sharma",
      isDefault: true,
      address: "123, Rosewood Apartments, Linking Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      phone: "9876543210",
    },
    {
      id: 2,
      name: "Priya Sharma",
      isDefault: false,
      address: "45, Tech Park, Office 302",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      phone: "9876543210",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl text-charcoal">Saved Addresses</h2>
        <button className="flex items-center gap-2 bg-wine text-white px-4 py-2 font-body text-sm hover:bg-wine/90 transition-colors">
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="bg-white p-6 border border-gray-100 shadow-sm relative"
          >
            {address.isDefault && (
              <span className="absolute top-4 right-4 bg-gray-100 text-gray-600 px-2 py-1 text-xs font-body rounded-sm">
                Default
              </span>
            )}
            <h3 className="font-heading text-lg text-charcoal mb-2">
              {address.name}
            </h3>
            <div className="font-body text-sm text-gray-600 space-y-1 mb-6">
              <p>{address.address}</p>
              <p>
                {address.city}, {address.state} {address.pincode}
              </p>
              <p className="pt-2">Phone: {address.phone}</p>
            </div>
            <div className="flex gap-4 border-t border-gray-100 pt-4">
              <button className="text-sm font-body text-wine hover:underline">
                Edit
              </button>
              <button className="text-sm font-body text-red-500 hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
