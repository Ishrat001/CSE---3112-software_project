

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
