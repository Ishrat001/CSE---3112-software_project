"use client";

interface SidebarProps {
  selected: string;
  onSelect: (id: string) => void;
  onLogout: () => void; // add logout prop
}

export default function Sidebar({ selected, onSelect, onLogout }: SidebarProps) {
  const menu = [
    { id: "getToken", label: "🍽 Get Token" },
    { id: "viewBill", label: "📄 View Bill" },
    { id: "payment", label: "💳 Payment" },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-blue-600 to-indigo-700 text-white min-h-screen p-6 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-8">Student Dashboard</h2>
        <ul className="space-y-4">
          {menu.map((item) => (
            <li
              key={item.id}
              className={`cursor-pointer p-2 rounded-lg transition ${
                selected === item.id
                  ? "bg-white text-blue-700 font-semibold"
                  : "hover:bg-blue-500"
              }`}
              onClick={() => onSelect(item.id)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Logout Button */}
      <div className="mt-10">
        <button
          onClick={onLogout}
          className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
