export default function ConceptsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: 'hsl(220, 25%, 7%)' }}>
      {children}
    </div>
  );
}
