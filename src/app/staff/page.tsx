"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/constants";

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
  specialty?: string;
  isAvailable?: boolean;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/staff");
        if (res.ok) {
          const json = await res.json();
          setStaff(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch staff:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const grouped = {
    DOCTORS: staff.filter((s) => s.role === "DOCTOR"),
    OTHERS: staff.filter((s) => s.role !== "DOCTOR"),
  };

  // Helper to generate a fake available date for visual similarity
  const getFakeDate = (idx: number) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return `${days[idx % 7]}, ${20 + (idx % 10)} Jan 2025`;
  };

  const getFakePrice = (idx: number) => {
    const prices = [400, 450, 300, 250, 350, 700, 200, 400];
    return prices[idx % prices.length];
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medecins Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view our medical specialists</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[130px] bg-white border border-gray-100 shadow-sm rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {/* DOCTORS GRID */}
            {grouped.DOCTORS.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">Medical Specialists</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grouped.DOCTORS.map((member, idx) => (
                    <div
                      key={member.id}
                      className="w-full flex h-[130px] rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Left: Avatar side matched to screenshot style (colored background behind rounded-edge pic or full image) */}
                      <div className="shrink-0 w-[110px] bg-sky-50 flex items-center justify-center relative">
                        <img 
                          src={`https://i.pravatar.cc/150?u=${member.id}`} 
                          alt="Doctor" 
                          className="w-full h-full object-cover object-top"
                        />
                      </div>

                      {/* Right: Info matched to screenshot */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-900 text-[14px]">
                              Dr. {member.firstName} {member.lastName}
                            </h3>
                            <button className="text-gray-400 hover:text-gray-600 px-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                          </div>
                          <div className="text-[12px] text-gray-400 mt-0.5">
                            {member.specialty || "General Practitioner"}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="text-[11px] text-gray-500 overflow-hidden whitespace-nowrap">
                            Available : <span className="font-medium text-gray-600">{getFakeDate(idx)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-[11px] text-gray-500">
                            <div className="flex items-center gap-1.5">
                              Starts From : <span className="font-bold text-blue-800 text-[13px]">${getFakePrice(idx)}</span>
                            </div>
                            <div className="text-gray-400 border border-gray-200 rounded p-0.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OTHER STAFF (Optional, but good to keep) */}
            {grouped.OTHERS.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2 mt-8">Other Staff</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grouped.OTHERS.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                      <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                         <img src={`https://i.pravatar.cc/150?u=${member.id}`} alt="Staff" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{ROLE_LABELS[member.role as Role] || member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
