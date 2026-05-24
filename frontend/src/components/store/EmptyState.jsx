import { FolderOpen } from "lucide-react";

export const EmptyState = ({ title, description, code }) => {
  return (
    <div
      className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center"
      data-testid="empty-state"
    >
      <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-50 grid place-items-center mb-4">
        <FolderOpen className="w-6 h-6 text-brand-blue" />
      </div>
      <h3 className="font-display text-xl font-bold text-gray-900">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {code && (
        <pre className="mt-5 mx-auto max-w-xl overflow-x-auto text-left bg-gray-900 text-gray-100 text-xs p-4 rounded-xl">
          {code}
        </pre>
      )}
    </div>
  );
};
