const fs = require('fs');

const path = '/app/applet/src/components/SettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add onLaunchScreenSaver to interface
content = content.replace(
  '  mascotConfig?: MascotConfig;\n  onUpdateMascotConfig?: (cfg: Partial<MascotConfig>) => void;',
  '  mascotConfig?: MascotConfig;\n  onUpdateMascotConfig?: (cfg: Partial<MascotConfig>) => void;\n  onLaunchScreenSaver?: () => void;'
);

// 2. Add onLaunchScreenSaver to component destructuring
content = content.replace(
  '  mascotConfig,\n  onUpdateMascotConfig,',
  '  mascotConfig,\n  onUpdateMascotConfig,\n  onLaunchScreenSaver,'
);

// 3. Add isReorderEditMode state
content = content.replace(
  '  // Accordion state: only one menu open at a time (null = all collapsed in sleek frame)\n  const [openSectionId, setOpenSectionId] = useState<string | null>(null);',
  '  // Accordion state: only one menu open at a time (null = all collapsed in sleek frame)\n  const [openSectionId, setOpenSectionId] = useState<string | null>(null);\n\n  // Edit mode for reordering: when false, drag handles & arrows are hidden to keep titles uncrowded\n  const [isReorderEditMode, setIsReorderEditMode] = useState<boolean>(false);'
);

// 4. Update renderHeaderPrefix to check !isReorderEditMode
const oldPrefix = `  const renderHeaderPrefix = (index: number) => (
    <div
      className="flex items-center gap-0.5 text-white/40 hover:text-white/80 shrink-0 select-none mr-1"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        className="cursor-grab active:cursor-grabbing p-1 hover:text-amber-400 transition-colors"
        title="Sıralamayı değiştirmek için sürükleyin"
      >
        <GripVertical className="w-4 h-4" />
      </div>`;

const newPrefix = `  const renderHeaderPrefix = (index: number) => {
    if (!isReorderEditMode) return null;
    return (
      <div
        className="flex items-center gap-0.5 text-white/60 hover:text-white shrink-0 select-none mr-1.5 animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          className="cursor-grab active:cursor-grabbing p-1 text-amber-400/90 hover:text-amber-300 transition-colors"
          title="Sıralamayı değiştirmek için sürükleyin"
        >
          <GripVertical className="w-4 h-4" />
        </div>`;

content = content.replace(oldPrefix, newPrefix);
// Close return properly if needed
content = content.replace('    </div>\n  );\n\n  const getCardClasses', '    </div>\n    );\n  };\n\n  const getCardClasses');

// 5. Remove draggable and onDragStart from the 10 card outer divs, leaving onDragOver, onDrop, onDragEnd
// Regex replace: remove "        draggable\n        onDragStart={(e) => handleDragStart(e, index)}\n"
content = content.replace(/(\s+)draggable\n\s+onDragStart=\{\(e\) => handleDragStart\(e, index\)\}\n/g, '$1');

// 6. Pass isConnected to EspDiagnosticsSection
content = content.replace(
  '<EspDiagnosticsSection\n        themeMode={themeMode}\n        isOpen={openSectionId === \'esp_hardware\'}\n        onToggleOpen={() => toggleSection(\'esp_hardware\')}\n        headerPrefix={renderHeaderPrefix(index)}\n      />',
  '<EspDiagnosticsSection\n        themeMode={themeMode}\n        isConnected={isConnected}\n        isOpen={openSectionId === \'esp_hardware\'}\n        onToggleOpen={() => toggleSection(\'esp_hardware\')}\n        headerPrefix={renderHeaderPrefix(index)}\n      />'
);

// 7. Pass onLaunchScreenSaver to MascotSettingsSection
content = content.replace(
  '<MascotSettingsSection\n        themeMode={themeMode}\n        config={mascotConfig}\n        onUpdateConfig={onUpdateMascotConfig}\n        currentTemp={currentTemp}\n        targetTemp={targetTemp}\n        isKombiActive={isKombiActive}\n        isOpen={openSectionId === \'mascot\'}\n        onToggleOpen={() => toggleSection(\'mascot\')}\n        headerPrefix={renderHeaderPrefix(index)}\n      />',
  '<MascotSettingsSection\n        themeMode={themeMode}\n        config={mascotConfig}\n        onUpdateConfig={onUpdateMascotConfig}\n        onLaunchScreenSaver={onLaunchScreenSaver}\n        currentTemp={currentTemp}\n        targetTemp={targetTemp}\n        isKombiActive={isKombiActive}\n        isOpen={openSectionId === \'mascot\'}\n        onToggleOpen={() => toggleSection(\'mascot\')}\n        headerPrefix={renderHeaderPrefix(index)}\n      />'
);

// 8. Add Düzenle button to Sürükle Bırak Bilgi Şeridi
const oldBanner = `          {/* Sürükle Bırak Bilgi Şeridi */}
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-white/50 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5 text-amber-400/80" />
              <span>Menüleri sürükleyip bırakarak veya oklarla sıralayabilirsiniz</span>
            </div>
            <button
              type="button"
              onClick={handleResetMenuOrder}
              className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer sm:hidden"
              title="Menü sıralamasını varsayılana sıfırla"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Sıfırla</span>
            </button>
          </div>`;

const newBanner = `          {/* Sürükle Bırak Bilgi Şeridi & Düzenle Butonu */}
          <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-white/60 border-b border-white/[0.06] mb-1">
            <div className="flex items-center gap-1.5 truncate">
              <GripVertical className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Menüleri sürükle veya oklarla sırala</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleResetMenuOrder}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                title="Menü sıralamasını varsayılana sıfırla"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Sıfırla</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setIsReorderEditMode(!isReorderEditMode);
                }}
                className={\`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all \${
                  isReorderEditMode
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                }\`}
                title="Menü sıralama tutamaçlarını ve oklarını göster / gizle"
              >
                {isReorderEditMode ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Tamamla</span>
                  </>
                ) : (
                  <>
                    <span>✏️ Düzenle</span>
                  </>
                )}
              </button>
            </div>
          </div>`;

content = content.replace(oldBanner, newBanner);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated SettingsModal.tsx');
