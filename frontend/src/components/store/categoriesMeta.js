import { Briefcase, BookOpen, ToyBrick, Gift, Smartphone } from "lucide-react";

// Nexo Store palette: blue #1E3A5F, teal #2EC4B6, coral #FF6B6B, yellow #FFB703
export const CATEGORIES_META = [
  {
    name: "Marroquinería",
    Icon: Briefcase,
    color: "bg-pastel-mint text-brand-tealDark",
    accent: "border-brand-teal/30",
    bg: "bg-brand-teal", // teal #2EC4B6
    iconRing: "ring-white/30",
    tagline: "Estilo, diseño y funcionalidad para cada día",
    subs: [
      { name: "Mochilas", emoji: "🎒", color: "bg-emerald-100 text-emerald-900 border-emerald-300" },
      { name: "Carteras y Bolsos", emoji: "👜", color: "bg-pink-100 text-pink-900 border-pink-300" },
      { name: "Riñoneras y Neceser", emoji: "👛", color: "bg-purple-100 text-purple-900 border-purple-300" },
      { name: "Valijas y Viaje", emoji: "🧳", color: "bg-amber-100 text-amber-900 border-amber-300" },
      { name: "Accesorios", emoji: "🔑", color: "bg-orange-100 text-orange-900 border-orange-300" },
    ],
  },
  {
    name: "Librería",
    Icon: BookOpen,
    color: "bg-pastel-sky text-brand-blue",
    accent: "border-brand-blue/30",
    bg: "bg-brand-blue", // blue #1E3A5F
    iconRing: "ring-white/30",
    tagline: "Todo lo que necesitás para leer, estudiar y crear",
    subs: [
      { name: "Estudio", emoji: "🟪", color: "bg-purple-100 text-purple-900 border-purple-300" },
      { name: "Oficina", emoji: "🟦", color: "bg-blue-100 text-blue-900 border-blue-300" },
      { name: "Creatividad", emoji: "🟧", color: "bg-orange-100 text-orange-900 border-orange-300" },
      { name: "Organización", emoji: "🟩", color: "bg-green-100 text-green-900 border-green-300" },
      { name: "Kits", emoji: "🟨", color: "bg-yellow-100 text-yellow-900 border-yellow-300" },
    ],
  },
  {
    name: "Juguetería",
    Icon: ToyBrick,
    color: "bg-pastel-coral text-brand-coralDark",
    accent: "border-brand-coral/30",
    bg: "bg-brand-coral", // coral #FF6B6B
    iconRing: "ring-white/30",
    tagline: "Diversión, creatividad y aprendizaje para niños y niñas",
    subs: [
      { name: "Juegos de Mesa", emoji: "🔴", color: "bg-red-100 text-red-900 border-red-300" },
      { name: "Muñecos y Figuras", emoji: "🔵", color: "bg-blue-100 text-blue-900 border-blue-300" },
      { name: "Didácticos", emoji: "🟢", color: "bg-green-100 text-green-900 border-green-300" },
      { name: "Aire Libre y Rodados", emoji: "🟡", color: "bg-yellow-100 text-yellow-900 border-yellow-300" },
      { name: "Primera Infancia", emoji: "🟣", color: "bg-purple-100 text-purple-900 border-purple-300" },
    ],
  },
  {
    name: "Regalería",
    Icon: Gift,
    color: "bg-pastel-butter text-yellow-900",
    accent: "border-brand-yellow/40",
    bg: "bg-brand-yellow", // yellow #FFB703
    iconRing: "ring-white/40",
    tagline: "Detalles que sorprenden y crean momentos especiales",
    subs: [
      { name: "Hogar y Bazar", emoji: "☕", color: "bg-amber-100 text-amber-900 border-amber-300" },
      { name: "Decoración", emoji: "🏠", color: "bg-rose-100 text-rose-900 border-rose-300" },
      { name: "Mates y Termos", emoji: "🧉", color: "bg-green-100 text-green-900 border-green-300" },
      { name: "Regalos", emoji: "🎁", color: "bg-pink-100 text-pink-900 border-pink-300" },
    ],
  },
  {
    name: "Tecno",
    Icon: Smartphone,
    color: "bg-pastel-sky text-brand-blueDark",
    accent: "border-brand-blueDark/30",
    bg: "bg-brand-blueDark", // dark blue
    iconRing: "ring-white/30",
    tagline: "Innovación que simplifica tu vida",
    subs: [
      { name: "Audio", emoji: "🎧", color: "bg-blue-100 text-blue-900 border-blue-300" },
      { name: "Computación", emoji: "🖱️", color: "bg-slate-100 text-slate-900 border-slate-300" },
      { name: "Gaming", emoji: "🎮", color: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300" },
      { name: "Energía", emoji: "🔋", color: "bg-yellow-100 text-yellow-900 border-yellow-300" },
      { name: "Accesorios Celular", emoji: "📱", color: "bg-cyan-100 text-cyan-900 border-cyan-300" },
    ],
  },
];

export const findCategoryMeta = (name) => CATEGORIES_META.find((c) => c.name === name);
