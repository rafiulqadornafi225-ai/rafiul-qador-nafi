import { useState } from 'react';
import { ShoppingCart, Star, Shield, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Jersey } from '../types';

interface JerseyCardProps {
  key?: string;
  jersey: Jersey;
  onBuyNow: (jersey: Jersey, selectedSize: string) => void;
  isAdmin?: boolean;
  onEdit?: (jersey: Jersey) => void;
  onDelete?: (id: string) => void;
}

export default function JerseyCard({ jersey, onBuyNow, isAdmin, onEdit, onDelete }: JerseyCardProps) {
  const [selectedSize, setSelectedSize] = useState('M');
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const countryAcronym = jersey.country.substring(0, 3).toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -6 }}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative flex flex-col justify-between overflow-hidden bg-[#111111]/90 border border-white/10 hover:border-emerald-550/35 rounded-2xl h-full shadow-2xl group transition-all duration-500"
    >
      {/* Visual background lights tailored dynamically */}
      <div className={`absolute top-0 left-12 w-44 h-44 bg-gradient-to-tr ${jersey.bgGradient || 'from-emerald-500/10 to-transparent'} rounded-full blur-3xl opacity-40 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 pointer-events-none`}></div>

      {/* Card Header & Badges */}
      <div className="p-6 pb-0 flex items-center justify-between z-10 w-full font-sans">
        <div>
          <span className={`text-[9px] font-mono uppercase tracking-widest font-black px-3 py-1.5 rounded ${jersey.badgeColor || 'bg-indigo-600 text-white'} shadow-md`}>
            {jersey.country}
          </span>
          <p className="text-[10px] text-zinc-400 font-mono mt-2.5 uppercase tracking-widest font-semibold flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block animate-ping"></span>
            2026 Pitch Authentic
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Admin editing/deleting operations */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 mr-2">
              <button
                type="button"
                onClick={() => onEdit && onEdit(jersey)}
                className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 rounded text-indigo-300 hover:text-white transition-all active:scale-95"
                title="Edit Club/Country Details & Image"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete && onDelete(jersey.id)}
                className="p-1.5 bg-rose-950/30 hover:bg-rose-600 border border-rose-500/30 rounded text-rose-400 hover:text-white transition-all active:scale-95"
                title="Remove Jersey from Catalog"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded px-2.5 py-1 backdrop-blur shadow-inner">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-bold font-mono text-white">{jersey.rating}</span>
          </div>
        </div>
      </div>

      {/* Product Image Section */}
      <div className="p-6 pt-2 flex items-center justify-center relative min-h-[300px]">
        {/* Big stylized back-text watermark */}
        <div className="absolute text-8xl md:text-[10rem] opacity-[0.025] font-black italic tracking-tighter select-none pointer-events-none text-white z-0 uppercase transition-all duration-700 group-hover:scale-110">
          {countryAcronym}
        </div>

        {/* Glow backdrop behind the jersey graphic */}
        <div className="absolute w-44 h-44 bg-gradient-to-tr from-black/50 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
        
        <img
          src={jersey.image}
          alt={jersey.name}
          referrerPolicy="no-referrer"
          className="relative max-h-72 object-contain select-none transform group-hover:scale-105 group-hover:-translate-y-1 duration-500 transition-all drop-shadow-[0_25px_25px_rgba(0,0,0,0.9)] z-10"
        />

        {/* Floating details overlay on hover */}
        <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between bg-zinc-950/90 backdrop-blur border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg px-3 py-2 text-[9px] text-zinc-350 font-mono z-20 shadow-xl">
          <span className="flex items-center gap-1 text-emerald-400">
            <Shield className="w-3" /> Double Knit Authentic
          </span>
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 animate-spin duration-5000 text-emerald-400" /> DHL Premium Express
          </span>
        </div>
      </div>

      {/* Description and Action section */}
      <div className="p-6 bg-gradient-to-b from-[#121212]/30 via-[#0a0a0a]/90 to-black/100 border-t border-white/10 backdrop-blur flex-grow flex flex-col justify-between font-sans">
        <div>
          <h4 className="text-base font-bold text-white tracking-tight uppercase group-hover:text-emerald-400 transition-all duration-300">
            {jersey.name}
          </h4>
          <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed h-10">
            {jersey.description}
          </p>

          {/* Size Selectors */}
          <div className="mt-5">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2 font-bold">
              Select Size
            </span>
            <div className="flex gap-2">
              {sizes.map((size) => (
                <button
                  id={`btn-${jersey.id}-size-${size}`}
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-8 h-8 font-mono text-[10px] font-bold rounded transition-all active:scale-95 border ${
                    selectedSize === size
                      ? 'bg-emerald-550 text-white border-emerald-500 shadow-xl font-black scale-105'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-white border-white/5 hover:border-white/25'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price & Primary Action */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono text-emerald-400/80 tracking-widest block uppercase font-bold">
              Exclusive Price
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-mono font-black text-white tracking-tight">Tk {jersey.priceBDT}</span>
              <span className="text-[10px] text-zinc-500 font-mono">/ ~${jersey.priceUSD}</span>
            </div>
          </div>

          <button
            id={`buy-btn-${jersey.id}`}
            onClick={() => onBuyNow(jersey, selectedSize)}
            className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 text-white text-[11px] font-black uppercase tracking-wider px-5.5 py-3.5 rounded-xl shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/20 hover:scale-[1.03] active:scale-95 transition-all duration-300 outline-none cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
            <span>Order Now</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
