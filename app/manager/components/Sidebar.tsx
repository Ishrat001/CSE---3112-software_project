"use client";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  role: "student" | "manager";
  onLogout: () => void;
}

export default function Sidebar({ selected, onSelect, role, onLogout }: Props) {
  const menu = role === "manager"
    ? [
        { id: "updateMenu", label: "📝 Update Menu" },
        { id: "viewToken", label: "📋 View Token" },
        { id: "viewPayment", label: "💳 View Payment" },
        { id: "giveWarning", label: "⚠️ Give Warning" },
        { id: "studentInfo", label: "👨‍🎓 Student Info" },
      ]
    : [];

  return (
    <div className="flex flex-col justify-between w-64 bg-gradient-to-b from-blue-600 to-indigo-700 text-white min-h-screen p-6">
      <div>
        <h2 className="text-xl font-bold mb-8">{role === "manager" ? "Manager Dashboard" : ""}</h2>
        <ul className="space-y-4">
          {menu.map(item => (
            <li
              key={item.id}
              className={`cursor-pointer p-2 rounded-lg transition ${
                selected === item.id ? "bg-white text-blue-700 font-semibold" : "hover:bg-blue-500"
              }`}
              onClick={() => onSelect(item.id)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
      >
        🔓 Logout
      </button>
    </div>
  );
}
