"use client";

import React, { useState } from "react";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white p-6 md:p-8 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl text-charcoal">My Profile</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm font-body text-wine underline hover:text-wine/80 transition-colors"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      <form className="space-y-6 max-w-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-body text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              defaultValue="Priya Sharma"
              disabled={!isEditing}
              className="w-full border border-gray-300 px-4 py-2 font-body text-gray-700 bg-white disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-wine"
            />
          </div>
          <div>
            <label className="block text-sm font-body text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              defaultValue="9876543210"
              disabled={!isEditing}
              className="w-full border border-gray-300 px-4 py-2 font-body text-gray-700 bg-white disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-wine"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-body text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              defaultValue="priya@example.com"
              disabled={!isEditing}
              className="w-full border border-gray-300 px-4 py-2 font-body text-gray-700 bg-white disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-wine"
            />
          </div>
        </div>

        {isEditing && (
          <div className="pt-4">
            <button
              type="button"
              className="bg-wine text-white px-8 py-3 font-body text-sm hover:bg-wine/90 transition-colors"
              onClick={() => setIsEditing(false)}
            >
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
