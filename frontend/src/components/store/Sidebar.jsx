import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Filter } from "lucide-react";

export const Sidebar = ({
  categories = [],
  selected = [],
  onToggle,
  onClear,
  counts = {},
  total = 0,
}) => {
  return (
    <aside
      className="md:col-span-1 space-y-6 md:sticky md:top-24 md:h-fit"
      data-testid="sidebar-filters"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-700" />
          <h3 className="font-display font-semibold text-gray-900 text-base">
            Filtros
          </h3>
        </div>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 text-xs text-brand-blue hover:text-brand-blueDark"
            data-testid="filter-clear-button"
          >
            Limpiar
          </Button>
        )}
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-3">
          Categorías
        </p>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">
            {total === 0
              ? "Subí productos.json para ver categorías"
              : "Sin categorías disponibles"}
          </p>
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => {
              const checked = selected.includes(cat);
              return (
                <li key={cat}>
                  <label
                    className={`flex items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
                      checked
                        ? "bg-blue-50 text-brand-blueDark"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggle(cat)}
                      className="data-[state=checked]:bg-brand-blue data-[state=checked]:border-brand-blue"
                      data-testid={`filter-category-checkbox-${cat}`}
                    />
                    <span className="text-sm font-medium flex-1">{cat}</span>
                    <span className="text-xs text-gray-500 font-semibold">
                      {counts[cat] || 0}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
        <p className="text-xs font-semibold text-brand-blueDark uppercase tracking-wider">
          Total productos
        </p>
        <p className="font-display text-3xl font-bold text-gray-900 mt-1">
          {total}
        </p>
        <p className="text-xs text-gray-500 mt-1">En el catálogo Nexo</p>
      </div>
    </aside>
  );
};
