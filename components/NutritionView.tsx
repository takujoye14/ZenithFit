import React, { useState, useRef } from 'react';
import { NutritionLog } from '../types';
import { analyzeFoodImageAI, generateFoodImageAI } from '../services/geminiService';
import { Camera, Plus, Loader2, Utensils, PieChart, X, Sparkles, Scan, Zap, Beef } from 'lucide-react';

interface NutritionViewProps {
  logs: NutritionLog[];
  onAddLog: (log: NutritionLog) => void;
}

const NutritionView: React.FC<NutritionViewProps> = ({ logs, onAddLog }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<Partial<NutritionLog> | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState({ mealName: '', calories: 0, protein: 0, fat: 0, carbs: 0 });
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysLogs = logs.filter(l => l.date.startsWith(todayStr));
  const stats = todaysLogs.reduce((acc, l) => ({ 
    cal: acc.cal + l.calories, pro: acc.pro + l.protein, carb: acc.carb + l.carbs, fat: acc.fat + l.fat 
  }), { cal: 0, pro: 0, carb: 0, fat: 0 });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      setIsAnalyzing(true);
      try {
        const result = await analyzeFoodImageAI(base64);
        setAnalyzedData(result);
      } catch (err) { 
        console.error(err);
        alert("Image analysis failed. Please try a clearer picture."); 
      }
      finally { setIsAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const saveLog = async (data: Partial<NutritionLog>, img?: string) => {
    let finalImg = img;
    if (!finalImg && data.mealName) {
      setIsGeneratingImg(true);
      try {
        finalImg = await generateFoodImageAI(data.mealName);
      } catch (e) {
        console.error("Image generation failed", e);
      } finally {
        setIsGeneratingImg(false);
      }
    }

    const log: NutritionLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mealName: data.mealName || 'Unnamed Meal',
      calories: data.calories || 0,
      protein: data.protein || 0,
      fat: data.fat || 0,
      carbs: data.carbs || 0,
      imageUrl: finalImg
    };
    onAddLog(log);
    reset();
  };

  const reset = () => {
    setAnalyzedData(null); 
    setPreviewImage(null); 
    setShowManualForm(false);
    setManualEntry({ mealName: '', calories: 0, protein: 0, fat: 0, carbs: 0 });
    setIsGeneratingImg(false);
  };

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <Utensils className="text-indigo-500" /> Daily Fuel
        </h2>
        <div className="flex gap-3">
          <button onClick={() => setShowManualForm(true)} className="bg-slate-900 border border-white/5 p-3 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl">
            <Plus className="w-6 h-6" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-500 text-white p-3 rounded-2xl shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 transition-all">
            <Scan className="w-6 h-6" />
          </button>
        </div>
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
      </div>

      <div className="glass-card rounded-[2.5rem] p-8 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-[0.05] rotate-12 group-hover:rotate-45 transition-transform duration-1000">
           <PieChart size={120} />
        </div>
        
        <div className="flex justify-between items-end mb-8 relative z-10">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mb-1">Calories Consumed</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">{stats.cal.toLocaleString()}</span>
              <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Kcal</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
             <Zap className="w-6 h-6 text-indigo-400 fill-indigo-400/20" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 relative z-10">
          <div className="bg-slate-950/50 border border-white/5 p-4 rounded-3xl text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Protein</p>
            <p className="text-xl font-black text-indigo-400">{stats.pro}g</p>
            <div className="w-8 h-1 bg-indigo-500/20 mx-auto mt-3 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-400 rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
          <div className="bg-slate-950/50 border border-white/5 p-4 rounded-3xl text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Carbs</p>
            <p className="text-xl font-black text-fuchsia-400">{stats.carb}g</p>
            <div className="w-8 h-1 bg-fuchsia-500/20 mx-auto mt-3 rounded-full overflow-hidden">
               <div className="h-full bg-fuchsia-400 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
          <div className="bg-slate-950/50 border border-white/5 p-4 rounded-3xl text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Fat</p>
            <p className="text-xl font-black text-amber-400">{stats.fat}g</p>
            <div className="w-8 h-1 bg-amber-500/20 mx-auto mt-3 rounded-full overflow-hidden">
               <div className="h-full bg-amber-400 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {(showManualForm || isGeneratingImg) && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl p-6 flex items-center justify-center animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-sm rounded-[2.5rem] p-8 relative">
            {isGeneratingImg ? (
              <div className="flex flex-col items-center py-12">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
                  <Loader2 className="animate-spin text-indigo-500 w-16 h-16" />
                </div>
                <h4 className="text-xl font-black text-white mb-2">Generating Art</h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center">Imagining your delicious meal...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-white">Manual Entry</h3>
                  <button onClick={reset} className="p-2 rounded-xl bg-slate-900 text-slate-500"><X /></button>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Meal Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Grilled Salmon" 
                      className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={manualEntry.mealName} 
                      onChange={e => setManualEntry({...manualEntry, mealName: e.target.value})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Calories</label>
                      <input type="number" className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-white font-mono font-bold" value={manualEntry.calories || ''} onChange={e => setManualEntry({...manualEntry, calories: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Protein (g)</label>
                      <input type="number" className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-white font-mono font-bold" value={manualEntry.protein || ''} onChange={e => setManualEntry({...manualEntry, protein: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Carbs (g)</label>
                      <input type="number" className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-white font-mono font-bold" value={manualEntry.carbs || ''} onChange={e => setManualEntry({...manualEntry, carbs: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Fat (g)</label>
                      <input type="number" className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-white font-mono font-bold" value={manualEntry.fat || ''} onChange={e => setManualEntry({...manualEntry, fat: parseInt(e.target.value) || 0})} />
                    </div>
                  </div>
                  <button 
                    onClick={() => saveLog(manualEntry)} 
                    disabled={!manualEntry.mealName} 
                    className="w-full py-5 bg-indigo-500 text-white font-black rounded-2xl mt-4 shadow-lg shadow-indigo-900/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
                  >
                    LOG & VISUALIZE
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl p-6 flex items-center justify-center animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="relative h-56">
               <img src={previewImage} className="w-full h-full object-cover" />
               {isAnalyzing && (
                 <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center">
                    <div className="relative">
                       <div className="absolute -inset-4 border-2 border-indigo-500 rounded-full animate-ping opacity-20"></div>
                       <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                    </div>
                    <p className="text-white font-black text-xs uppercase tracking-[0.3em] mt-6">Analyzing Fuel</p>
                 </div>
               )}
            </div>
            <div className="p-8">
              {!isAnalyzing && (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-white">{analyzedData?.mealName}</h3>
                      <p className="text-indigo-400 font-black text-lg">{analyzedData?.calories} KCAL</p>
                    </div>
                    <div className="p-3 bg-indigo-500/10 rounded-2xl">
                       <Beef className="w-6 h-6 text-indigo-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-10">
                    <div className="text-center bg-slate-950/50 p-3 rounded-2xl border border-white/5"><span className="block text-[9px] text-slate-500 font-black uppercase mb-1">PRO</span><span className="font-mono font-black text-white">{analyzedData?.protein}g</span></div>
                    <div className="text-center bg-slate-950/50 p-3 rounded-2xl border border-white/5"><span className="block text-[9px] text-slate-500 font-black uppercase mb-1">CARB</span><span className="font-mono font-black text-white">{analyzedData?.carbs}g</span></div>
                    <div className="text-center bg-slate-950/50 p-3 rounded-2xl border border-white/5"><span className="block text-[9px] text-slate-500 font-black uppercase mb-1">FAT</span><span className="font-mono font-black text-white">{analyzedData?.fat}g</span></div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={reset} className="flex-1 py-4 bg-slate-800 text-white font-black rounded-2xl transition-colors hover:bg-slate-700">CANCEL</button>
                    <button onClick={() => saveLog(analyzedData! , previewImage!)} className="flex-1 py-4 bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.02]">SAVE FUEL</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 pb-10">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 mb-4">Daily Diary</h3>
        {todaysLogs.length === 0 ? (
          <div className="glass-card py-20 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 opacity-50">
            <Utensils className="w-12 h-12 text-slate-700" />
            <p className="text-slate-400 font-bold">Your fuel log is empty today.</p>
          </div>
        ) : (
          todaysLogs.map(log => (
            <div key={log.id} className="glass-card p-4 rounded-3xl flex items-center gap-5 group border border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 overflow-hidden flex-shrink-0 border border-white/5 transition-transform duration-500 group-hover:scale-105">
                {log.imageUrl ? <img src={log.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Utensils className="w-6 h-6 text-slate-800" /></div>}
              </div>
              <div className="flex-1">
                <h4 className="text-base font-black text-white group-hover:text-indigo-400 transition-colors">{log.mealName}</h4>
                <div className="flex gap-4 mt-1">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{log.calories} kcal</span>
                  <div className="flex gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                    <span>P: {log.protein}g</span>
                    <span>C: {log.carbs}g</span>
                    <span>F: {log.fat}g</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NutritionView;