export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-border rounded-xl">
      <h3 className="text-white font-medium mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-md mb-4">{description}</p>}
      {action}
    </div>
  );
}
