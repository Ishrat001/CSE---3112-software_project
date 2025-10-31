interface MenuItemCardProps {
  name: string;
  price: number;
  available: boolean;
  onSelect: () => void;
  selected: boolean;
}

export default function MenuItemCard({
  name,
  price,
  available,
  onSelect,
  selected,
}: MenuItemCardProps) {
  return (
    <div
      className={`p-4 border rounded-lg shadow-sm flex justify-between items-center ${
        !available ? "opacity-50" : ""
      } ${selected ? "border-blue-600 bg-blue-50" : ""}`}
    >
      <div>
        <h3 className="font-semibold">{name}</h3>
        <p className="text-gray-600">৳{price}</p>
      </div>
      <button
        onClick={onSelect}
        disabled={!available}
        className={`px-4 py-2 rounded-lg ${
          selected ? "bg-red-500 text-white" : "bg-blue-600 text-white"
        }`}
      >
        {selected ? "Remove" : "Select"}
      </button>
    </div>
  );
}
