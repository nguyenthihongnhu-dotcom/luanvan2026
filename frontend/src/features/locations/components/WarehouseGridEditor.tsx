// import React, { useCallback, useEffect, useState } from "react";
// import type { ViTriKho } from "@/features/locations/hooks/useWarehouse";
// import { useSidebar } from "@/app/providers/useSidebar";

// interface Zone {
//   id: string;
//   code: string;
//   name: string;
//   color: string;
//   size: number;           // SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ kÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡ (ÃƒÆ’Ã‚Â´)
//   row: number;
//   col: number;
//   occupiedCells: { row: number; col: number }[];
// }

// interface WarehouseGridEditorProps {
//   onSelectZone?: (zoneCode: string) => void;
//   locations?: ViTriKho[];
// }

// export default function WarehouseGridEditor({ onSelectZone, locations: _locations }: WarehouseGridEditorProps) {
//   const [rows, setRows] = useState<number>(10);
//   const [cols, setCols] = useState<number>(14);
//   const [zones, setZones] = useState<Zone[]>(() => [
//     {
//       id: "zone-A",
//       code: "A",
//       name: "Zone A - SÃƒÂ¡Ã‚Â»Ã‚Â¯a & TÃƒÆ’Ã‚Â£",
//       color: "#3b82f6",
//       size: 4,
//       row: 1,
//       col: 1,
//       occupiedCells: [
//         { row: 1, col: 1 },
//         { row: 1, col: 2 },
//         { row: 1, col: 3 },
//         { row: 1, col: 4 }
//       ]
//     },
//     {
//       id: "zone-B",
//       code: "B",
//       name: "Zone B - Ãƒâ€žÃ‚ÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ chÃƒâ€ Ã‚Â¡i & Xe Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â©y",
//       color: "#a855f7",
//       size: 4,
//       row: 3,
//       col: 1,
//       occupiedCells: [
//         { row: 3, col: 1 },
//         { row: 3, col: 2 },
//         { row: 3, col: 3 },
//         { row: 3, col: 4 }
//       ]
//     },
//     {
//       id: "zone-C",
//       code: "C",
//       name: "Zone C - ThÃƒÂ¡Ã‚Â»Ã‚i trang trÃƒÂ¡Ã‚ÂºÃ‚Â» em",
//       color: "#f59e0b",
//       size: 4,
//       row: 5,
//       col: 1,
//       occupiedCells: [
//         { row: 5, col: 1 },
//         { row: 5, col: 2 },
//         { row: 5, col: 3 },
//         { row: 5, col: 4 }
//       ]
//     },
//     {
//       id: "zone-D",
//       code: "D",
//       name: "Zone D - ThÃƒÂ¡Ã‚Â»Ã‚Â±c phÃƒÂ¡Ã‚ÂºÃ‚Â©m Ãƒâ€žÃ†â€™n dÃƒÂ¡Ã‚ÂºÃ‚Â·m",
//       color: "#10b981",
//       size: 4,
//       row: 7,
//       col: 1,
//       occupiedCells: [
//         { row: 7, col: 1 },
//         { row: 7, col: 2 },
//         { row: 7, col: 3 },
//         { row: 7, col: 4 }
//       ]
//     },
//     {
//       id: "zone-E",
//       code: "E",
//       name: "Zone E - ChÃƒâ€žÃ†â€™m sÃƒÆ’Ã‚Â³c sÃƒÂ¡Ã‚Â»Ã‚Â©c khÃƒÂ¡Ã‚Â»Ã‚e",
//       color: "#f43f5e",
//       size: 4,
//       row: 9,
//       col: 1,
//       occupiedCells: [
//         { row: 9, col: 1 },
//         { row: 9, col: 2 },
//         { row: 9, col: 3 },
//         { row: 9, col: 4 }
//       ]
//     }
//   ]);
//   const [newZoneSize, setNewZoneSize] = useState<number>(4);
//   const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
//   const { setExtraContent } = useSidebar();

//   // TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Zone mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi
//   const createNewZone = () => {
//     const code = String.fromCharCode(65 + zones.length); // A, B, C, ...
//     const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

//     const newZone: Zone = {
//       id: `zone-${Date.now()}`,
//       code,
//       name: `Zone ${code}`,
//       color,
//       size: newZoneSize,
//       row: -1,
//       col: -1,
//       occupiedCells: [],
//     };

//     setZones([...zones, newZone]);
//   };

//   // KÃƒÆ’Ã‚Â©o thÃƒÂ¡Ã‚ÂºÃ‚Â£ Zone
//   const handleDragStart = (e: React.DragEvent, zoneId: string) => {
//     e.dataTransfer.setData("zoneId", zoneId);
//   };

//   const handleDrop = (e: React.DragEvent, targetRow: number, targetCol: number) => {
//     e.preventDefault();
//     const zoneId = e.dataTransfer.getData("zoneId");
//     const zoneIndex = zones.findIndex(z => z.id === zoneId);
//     if (zoneIndex === -1) return;

//     const zone = zones[zoneIndex];
//     const newOccupiedCells: { row: number; col: number }[] = [];

//     // BÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ trÃƒÆ’Ã‚Â­ theo hÃƒÆ’ ng ngang hoÃƒÂ¡Ã‚ÂºÃ‚Â·c dÃƒÂ¡Ã‚Â»Ã‚c
//     for (let i = 0; i < zone.size; i++) {
//       if (orientation === "horizontal") {
//         const newCol = targetCol + i;
//         if (newCol >= cols) break; // KhÃƒÆ’Ã‚Â´ng cho trÃƒÆ’ n cÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢t
//         newOccupiedCells.push({ row: targetRow, col: newCol });
//       } else {
//         const newRow = targetRow + i;
//         if (newRow >= rows) break; // KhÃƒÆ’Ã‚Â´ng cho trÃƒÆ’ n hÃƒÆ’ ng
//         newOccupiedCells.push({ row: newRow, col: targetCol });
//       }
//     }

//     const updatedZone = {
//       ...zone,
//       row: targetRow,
//       col: targetCol,
//       occupiedCells: newOccupiedCells,
//     };

//     const newZones = [...zones];
//     newZones[zoneIndex] = updatedZone;
//     setZones(newZones);
//   };

//   const allowDrop = (e: React.DragEvent) => e.preventDefault();

//   // XÃƒÆ’Ã‚Â³a Zone
//   const removeZone = (id: string) => {
//     setZones(zones.filter(z => z.id !== id));
//   };

//   // KiÃƒÂ¡Ã‚Â»Ã†â€™m tra ÃƒÆ’Ã‚Â´ cÃƒÆ’Ã‚Â³ thuÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢c Zone nÃƒÆ’ o khÃƒÆ’Ã‚Â´ng
//   const getZoneAt = (row: number, col: number) => {
//     return zones.find(zone => 
//       zone.occupiedCells.some(cell => cell.row === row && cell.col === col)
//     );
//   };

//   // ThiÃƒÂ¡Ã‚ÂºÃ‚Â¿t lÃƒÂ¡Ã‚ÂºÃ‚Â­p nÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢i dung cho Sidebar.tsx
//   useEffect(() => {
//     setExtraContent(
//       <div className="space-y-6">
//         {/* CÃƒÂ¡Ã‚ÂºÃ‚Â¥u hÃƒÆ’Ã‚Â¬nh Grid */}
//         <div className="space-y-2">
//           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">CÃƒÂ¡Ã‚ÂºÃ‚Â¥u hÃƒÆ’Ã‚Â¬nh lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi kho</h3>

//           <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200/50">
//             <span className="text-xs font-semibold text-gray-600">SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ hÃƒÆ’ ng:</span>
//             <div className="flex gap-2 items-center">
//               <button
//                 type="button"
//                 onClick={() => setRows(Math.max(6, rows - 1))}
//                 className="w-6 h-6 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
//               >
//                 -
//               </button>
//               <span className="w-8 text-center text-xs font-bold text-gray-800">{rows}</span>
//               <button
//                 type="button"
//                 onClick={() => setRows(rows + 1)}
//                 className="w-6 h-6 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
//               >
//                 +
//               </button>
//             </div>
//           </div>

//           <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200/50">
//             <span className="text-xs font-semibold text-gray-600">SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ cÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢t:</span>
//             <div className="flex gap-2 items-center">
//               <button
//                 type="button"
//                 onClick={() => setCols(Math.max(8, cols - 1))}
//                 className="w-6 h-6 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
//               >
//                 -
//               </button>
//               <span className="w-8 text-center text-xs font-bold text-gray-800">{cols}</span>
//               <button
//                 type="button"
//                 onClick={() => setCols(cols + 1)}
//                 className="w-6 h-6 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
//               >
//                 +
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* HÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºng bÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ trÃƒÆ’Ã‚Â­ */}
//         <div className="space-y-2">
//           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">HÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºng bÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ trÃƒÆ’Ã‚Â­ (thÃƒÂ¡Ã‚ÂºÃ‚Â£)</h3>
//           <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
//             <button
//               type="button"
//               onClick={() => setOrientation("horizontal")}
//               className={`flex-1 py-1.5 text-xs font-bold cursor-pointer transition-colors border-0 ${
//                 orientation === "horizontal"
//                   ? "bg-pink-600 text-white"
//                   : "bg-white text-gray-600 hover:bg-gray-50"
//               }`}
//             >
//               Ngang
//             </button>
//             <button
//               type="button"
//               onClick={() => setOrientation("vertical")}
//               className={`flex-1 py-1.5 text-xs font-bold cursor-pointer transition-colors border-0 ${
//                 orientation === "vertical"
//                   ? "bg-pink-600 text-white"
//                   : "bg-white text-gray-600 hover:bg-gray-50"
//               }`}
//             >
//               DÃƒÂ¡Ã‚Â»Ã‚c
//             </button>
//           </div>
//         </div>

//         {/* TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Zone mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi */}
//         <div className="space-y-2">
//           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">ThÃƒÆ’Ã‚Âªm Zone mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi</h3>
//           <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200/50 mb-2">
//             <span className="text-xs font-semibold text-gray-600">SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ kÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡:</span>
//             <div className="flex gap-2 items-center">
//               <button
//                 type="button"
//                 onClick={() => setNewZoneSize(Math.max(1, newZoneSize - 1))}
//                 className="w-6 h-6 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
//               >
//                 -
//               </button>
//               <span className="w-8 text-center text-xs font-bold text-gray-800">{newZoneSize}</span>
//               <button
//                 type="button"
//                 onClick={() => setNewZoneSize(newZoneSize + 1)}
//                 className="w-6 h-6 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
//               >
//                 +
//               </button>
//             </div>
//           </div>
//           {/*  <button
//                         onClick={() => {
//                             resetForm();
//                             setShowModal(true);`
//                         }}
//                         className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors">
//                         + ThÃƒÆ’Ã‚Âªm sÃƒÂ¡Ã‚ÂºÃ‚Â£n phÃƒÂ¡Ã‚ÂºÃ‚Â©m
//                     </button> */}
//           <button
//             type="button"
//             onClick={createNewZone}
//             className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs py-2 rounded-lg transition cursor-pointer shadow-sm border-0"
//           >
//             + ThÃƒÆ’Ã‚Âªm PhÃƒÆ’Ã‚Â¢n Khu mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi
//           </button>
//         </div>

//         {/* Danh sÃƒÆ’Ã‚Â¡ch phÃƒÆ’Ã‚Â¢n khu */}
//         <div className="space-y-2">
//           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">KÃƒÆ’Ã‚Â©o thÃƒÂ¡Ã‚ÂºÃ‚Â£ PhÃƒÆ’Ã‚Â¢n khu</h3>
//           <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
//             {zones.length === 0 && (
//               <p className="text-xs text-gray-400 italic text-center py-4">ChÃƒâ€ Ã‚Â°a cÃƒÆ’Ã‚Â³ phÃƒÆ’Ã‚Â¢n khu nÃƒÆ’ o</p>
//             )}
//             {zones.map((zone) => (
//               <div
//                 key={zone.id}
//                 draggable
//                 onDragStart={(e) => handleDragStart(e, zone.id)}
//                 className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md hover:border-pink-300 transition select-none"
//               >
//                 <div
//                   className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0"
//                   style={{ backgroundColor: zone.color }}
//                 >
//                   {zone.code}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-xs font-bold text-gray-800 truncate">{zone.name}</p>
//                   <p className="text-[9px] text-gray-400">
//                     {zone.size} kÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡ ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ {zone.occupiedCells.length > 0 ? "Ãƒâ€žÃ‚ÃƒÆ’Ã‚Â£ Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t" : "ChÃƒâ€ Ã‚Â°a Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t"}
//                   </p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     removeZone(zone.id);
//                   }}
//                   className="text-red-400 hover:text-red-600 text-xs ml-1 shrink-0 cursor-pointer font-bold w-4 h-4 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors border-0"
//                   title="XÃƒÆ’Ã‚Â³a phÃƒÆ’Ã‚Â¢n khu"
//                 >
//                   ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¢
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//     return () => setExtraContent(null);
//   }, [setExtraContent, rows, cols, zones, newZoneSize, orientation]);

//   return (
//     <div className="flex-1 overflow-auto p-6 bg-gray-100 flex flex-col h-[calc(100vh-180px)] rounded-xl border border-gray-200">
//       <div className="mb-4">
//         <h3 className="text-base font-bold text-gray-800 uppercase tracking-wide">MÃƒÂ¡Ã‚ÂºÃ‚Â·t BÃƒÂ¡Ã‚ÂºÃ‚Â±ng BÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ TrÃƒÆ’Ã‚Â­ Kho</h3>
//         <p className="text-xs text-gray-500">KÃƒÆ’Ã‚Â©o cÃƒÆ’Ã‚Â¡c phÃƒÆ’Ã‚Â¢n khu tÃƒÂ¡Ã‚Â»Ã‚Â« thanh menu bÃƒÆ’Ã‚Âªn trÃƒÆ’Ã‚Â¡i thÃƒÂ¡Ã‚ÂºÃ‚Â£ vÃƒÆ’ o ÃƒÆ’Ã‚Â´ bÃƒÂ¡Ã‚ÂºÃ‚Â¥t kÃƒÂ¡Ã‚Â»Ã‚Â³ trÃƒÆ’Ã‚Âªn lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ xÃƒÆ’Ã‚Â¡c Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh vÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ trÃƒÆ’Ã‚Â­. HÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºng bÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ trÃƒÆ’Ã‚Â­ (ngang/dÃƒÂ¡Ã‚Â»Ã‚c) sÃƒÂ¡Ã‚ÂºÃ‚Â½ ÃƒÆ’Ã‚Â¡p dÃƒÂ¡Ã‚Â»Ã‚Â¥ng khi thÃƒÂ¡Ã‚ÂºÃ‚Â£.</p>
//       </div>

//       <div className="flex-1 flex justify-start items-start overflow-auto">
//         <div
//           className="inline-grid gap-1.5 bg-white p-4 rounded-3xl shadow-inner border border-gray-200"
//           style={{ gridTemplateColumns: `repeat(${cols}, 68px)` }}
//         >
//           {Array.from({ length: rows * cols }).map((_, index) => {
//             const row = Math.floor(index / cols);
//             const col = index % cols;
//             const zone = getZoneAt(row, col);

//             return (
//               <div
//                 key={index}
//                 onDrop={(e) => handleDrop(e, row, col)}
//                 onDragOver={allowDrop}
//                 onClick={() => zone && onSelectZone && onSelectZone(zone.code)}
//                 className={`
//                   h-16 rounded-2xl border-2 flex items-center justify-center text-sm font-medium
//                   transition-all cursor-pointer hover:scale-105
//                   ${zone 
//                     ? "border-transparent shadow-sm" 
//                     : "border-dashed border-gray-255 hover:border-pink-300 hover:bg-pink-50/20"
//                   }
//                 `}
//                 style={zone ? { backgroundColor: `${zone.color}25` } : {}}
//               >
//                 {zone ? (
//                   <div className="text-center">
//                     <div className="font-bold" style={{ color: zone.color }}>
//                       {zone.code}
//                     </div>
//                     <div className="text-[10px] text-gray-550 mt-0.5">
//                       {zone.size} kÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡
//                     </div>
//                   </div>
//                 ) : (
//                   <span className="text-gray-300 text-[10px]">({row + 1}, {col + 1})</span>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useCallback, useEffect, useState } from "react";
import type { ViTriKho } from "@/features/locations/hooks/useWarehouse";
import { useSidebar } from "@/app/providers/useSidebar";

interface Zone {
    id: string;
    code: string;
    name: string;
    color: string;
    size: number;           // SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ kÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡ (ÃƒÆ’Ã‚Â´)
    row: number;
    col: number;
    occupiedCells: { row: number; col: number }[];
}

interface WarehouseGridEditorProps {
    onSelectZone?: (zoneCode: string) => void;
    locations?: ViTriKho[];
}

export default function WarehouseGridEditor({ onSelectZone }: WarehouseGridEditorProps) {
    const [rows, setRows] = useState<number>(10);
    const [cols, setCols] = useState<number>(14);
    const [zones, setZones] = useState<Zone[]>(() => [
        {
            id: "zone-A",
            code: "A",
            name: "Zone A - SÃƒÂ¡Ã‚Â»Ã‚Â¯a & TÃƒÆ’Ã‚Â£",
            color: "#3b82f6",
            size: 4,
            row: 1,
            col: 1,
            occupiedCells: [
                { row: 1, col: 1 },
                { row: 1, col: 2 },
                { row: 1, col: 3 },
                { row: 1, col: 4 }
            ]
        },
        {
            id: "zone-B",
            code: "B",
            name: "Zone B - Ãƒâ€žÃ‚ÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ chÃƒâ€ Ã‚Â¡i & Xe Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â©y",
            color: "#a855f7",
            size: 4,
            row: 3,
            col: 1,
            occupiedCells: [
                { row: 3, col: 1 },
                { row: 3, col: 2 },
                { row: 3, col: 3 },
                { row: 3, col: 4 }
            ]
        },
        {
            id: "zone-C",
            code: "C",
            name: "Zone C - ThÃƒÂ¡Ã‚Â»Ã‚i trang trÃƒÂ¡Ã‚ÂºÃ‚Â» em",
            color: "#f59e0b",
            size: 4,
            row: 5,
            col: 1,
            occupiedCells: [
                { row: 5, col: 1 },
                { row: 5, col: 2 },
                { row: 5, col: 3 },
                { row: 5, col: 4 }
            ]
        },
        {
            id: "zone-D",
            code: "D",
            name: "Zone D - ThÃƒÂ¡Ã‚Â»Ã‚Â±c phÃƒÂ¡Ã‚ÂºÃ‚Â©m Ãƒâ€žÃ†â€™n dÃƒÂ¡Ã‚ÂºÃ‚Â·m",
            color: "#10b981",
            size: 4,
            row: 7,
            col: 1,
            occupiedCells: [
                { row: 7, col: 1 },
                { row: 7, col: 2 },
                { row: 7, col: 3 },
                { row: 7, col: 4 }
            ]
        },
        {
            id: "zone-E",
            code: "E",
            name: "Zone E - ChÃƒâ€žÃ†â€™m sÃƒÆ’Ã‚Â³c sÃƒÂ¡Ã‚Â»Ã‚Â©c khÃƒÂ¡Ã‚Â»Ã‚e",
            color: "#f43f5e",
            size: 4,
            row: 9,
            col: 1,
            occupiedCells: [
                { row: 9, col: 1 },
                { row: 9, col: 2 },
                { row: 9, col: 3 },
                { row: 9, col: 4 }
            ]
        }
    ]);
    const [newZoneSize, setNewZoneSize] = useState<number>(4);
    const [newZoneName, setNewZoneName] = useState<string>("");
    const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
    const { setExtraContent } = useSidebar();

    // TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Zone mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi
    const createNewZone = useCallback(() => {
        const code = String.fromCharCode(65 + zones.length); // A, B, C, ...
        const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

        const newZone: Zone = {
            id: `zone-${Date.now()}`,
            code,
            name: newZoneName.trim() ? `Zone ${code} - ${newZoneName.trim()}` : `Zone ${code}`,
            color,
            size: newZoneSize,
            row: -1,
            col: -1,
            occupiedCells: [],
        };

        setZones([...zones, newZone]);
        setNewZoneName(""); // Reset field nhÃƒÂ¡Ã‚ÂºÃ‚Â­p sau khi thÃƒÆ’Ã‚Âªm thÃƒÆ’ nh cÃƒÆ’Ã‚Â´ng
    }, [newZoneName, newZoneSize, zones]);

    // KÃƒÆ’Ã‚Â©o thÃƒÂ¡Ã‚ÂºÃ‚Â£ Zone
    const handleDragStart = (e: React.DragEvent, zoneId: string) => {
        e.dataTransfer.setData("zoneId", zoneId);
    };

    const handleDrop = (e: React.DragEvent, targetRow: number, targetCol: number) => {
        e.preventDefault();
        const zoneId = e.dataTransfer.getData("zoneId");
        const zoneIndex = zones.findIndex(z => z.id === zoneId);
        if (zoneIndex === -1) return;

        const zone = zones[zoneIndex];
        const newOccupiedCells: { row: number; col: number }[] = [];

        // BÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ trÃƒÆ’Ã‚Â­ theo hÃƒÆ’ ng ngang hoÃƒÂ¡Ã‚ÂºÃ‚Â·c dÃƒÂ¡Ã‚Â»Ã‚c
        for (let i = 0; i < zone.size; i++) {
            if (orientation === "horizontal") {
                const newCol = targetCol + i;
                if (newCol >= cols) break; // KhÃƒÆ’Ã‚Â´ng cho trÃƒÆ’ n cÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢t
                newOccupiedCells.push({ row: targetRow, col: newCol });
            } else {
                const newRow = targetRow + i;
                if (newRow >= rows) break; // KhÃƒÆ’Ã‚Â´ng cho trÃƒÆ’ n hÃƒÆ’ ng
                newOccupiedCells.push({ row: newRow, col: targetCol });
            }
        }

        const updatedZone = {
            ...zone,
            row: targetRow,
            col: targetCol,
            occupiedCells: newOccupiedCells,
        };

        const newZones = [...zones];
        newZones[zoneIndex] = updatedZone;
        setZones(newZones);
    };

    const allowDrop = (e: React.DragEvent) => e.preventDefault();

    // XÃƒÆ’Ã‚Â³a Zone
    const removeZone = useCallback((id: string) => {
        setZones(currentZones => currentZones.filter(z => z.id !== id));
    }, []);

    // KiÃƒÂ¡Ã‚Â»Ã†â€™m tra ÃƒÆ’Ã‚Â´ cÃƒÆ’Ã‚Â³ thuÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢c Zone nÃƒÆ’ o khÃƒÆ’Ã‚Â´ng
    const getZoneAt = (row: number, col: number) => {
        return zones.find(zone =>
            zone.occupiedCells.some(cell => cell.row === row && cell.col === col)
        );
    };

    // ThiÃƒÂ¡Ã‚ÂºÃ‚Â¿t lÃƒÂ¡Ã‚ÂºÃ‚Â­p nÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢i dung cho Sidebar.tsx
    useEffect(() => {
        setExtraContent(
            <div className="space-y-6">
                {/* CÃƒÂ¡Ã‚ÂºÃ‚Â¥u hÃƒÆ’Ã‚Â¬nh Grid */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">CÃƒÂ¡Ã‚ÂºÃ‚Â¥u hÃƒÆ’Ã‚Â¬nh lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi kho</h3>

                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200/50">
                        <span className="text-xs font-semibold text-gray-600">SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ hÃƒÆ’ ng:</span>
                        <div className="flex gap-2 items-center">
                            <button
                                type="button"
                                onClick={() => setRows(Math.max(6, rows - 1))}
                                className="w-6 h-6 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
                            >
                                -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-gray-800">{rows}</span>
                            <button
                                type="button"
                                onClick={() => setRows(rows + 1)}
                                className="w-6 h-6 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200/50">
                        <span className="text-xs font-semibold text-gray-600">SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ cÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢t:</span>
                        <div className="flex gap-2 items-center">
                            <button
                                type="button"
                                onClick={() => setCols(Math.max(8, cols - 1))}
                                className="w-6 h-6 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
                            >
                                -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-gray-800">{cols}</span>
                            <button
                                type="button"
                                onClick={() => setCols(cols + 1)}
                                className="w-6 h-6 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* HÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºng bÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ trÃƒÆ’Ã‚Â­ */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">HÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºng bÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ trÃƒÆ’Ã‚Â­ (thÃƒÂ¡Ã‚ÂºÃ‚Â£)</h3>
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <button
                            type="button"
                            onClick={() => setOrientation("horizontal")}
                            className={`flex-1 py-1.5 text-xs font-bold cursor-pointer transition-colors border-0 ${orientation === "horizontal"
                                ? "bg-pink-600 text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            Ngang
                        </button>
                        <button
                            type="button"
                            onClick={() => setOrientation("vertical")}
                            className={`flex-1 py-1.5 text-xs font-bold cursor-pointer transition-colors border-0 ${orientation === "vertical"
                                ? "bg-pink-600 text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            DÃƒÂ¡Ã‚Â»Ã‚c
                        </button>
                    </div>
                </div>

                {/* TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Zone mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">ThÃƒÆ’Ã‚Âªm Zone mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi</h3>

                    {/* ÃƒÆ’Ã¢â‚¬ nhÃƒÂ¡Ã‚ÂºÃ‚Â­p tÃƒÆ’Ã‚Âªn phÃƒÆ’Ã‚Â¢n khu */}
                    <div className="space-y-1 mb-2">
                        <label htmlFor="zone-name-input" className="text-[11px] font-semibold text-gray-600 block">TÃƒÆ’Ã‚Âªn phÃƒÆ’Ã‚Â¢n khu (tÃƒÆ’Ã‚Â¹y chÃƒÂ¡Ã‚Â»Ã‚n):</label>
                        <input
                            id="zone-name-input"
                            type="text"
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            placeholder="VD: SÃƒÂ¡Ã‚Â»Ã‚Â¯a & TÃƒÆ’Ã‚Â£, Ãƒâ€žÃ‚ÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ chÃƒâ€ Ã‚Â¡i..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-pink-500 bg-white"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200/50 mb-2">
                        <span className="text-xs font-semibold text-gray-600">SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ kÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡:</span>
                        <div className="flex gap-2 items-center">
                            <button
                                type="button"
                                onClick={() => setNewZoneSize(Math.max(1, newZoneSize - 1))}
                                className="w-6 h-6 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
                            >
                                -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-gray-800">{newZoneSize}</span>
                            <button
                                type="button"
                                onClick={() => setNewZoneSize(newZoneSize + 1)}
                                className="w-6 h-6 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={createNewZone}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs py-2 rounded-lg transition cursor-pointer shadow-sm border-0"
                    >
                        + ThÃƒÆ’Ã‚Âªm PhÃƒÆ’Ã‚Â¢n Khu mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi
                    </button>
                </div>

                {/* Danh sÃƒÆ’Ã‚Â¡ch phÃƒÆ’Ã‚Â¢n khu */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">KÃƒÆ’Ã‚Â©o thÃƒÂ¡Ã‚ÂºÃ‚Â£ PhÃƒÆ’Ã‚Â¢n khu</h3>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {zones.length === 0 && (
                            <p className="text-xs text-gray-400 italic text-center py-4">ChÃƒâ€ Ã‚Â°a cÃƒÆ’Ã‚Â³ phÃƒÆ’Ã‚Â¢n khu nÃƒÆ’ o</p>
                        )}
                        {zones.map((zone) => (
                            <div
                                key={zone.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, zone.id)}
                                className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md hover:border-pink-300 transition select-none"
                            >
                                <div
                                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0"
                                    style={{ backgroundColor: zone.color }}
                                >
                                    {zone.code}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-800 truncate">{zone.name}</p>
                                    <p className="text-[9px] text-gray-400">
                                        {zone.size} kÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡ ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ {zone.occupiedCells.length > 0 ? "Ãƒâ€žÃ‚ÃƒÆ’Ã‚Â£ Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t" : "ChÃƒâ€ Ã‚Â°a Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeZone(zone.id);
                                    }}
                                    className="text-red-400 hover:text-red-600 text-xs ml-1 shrink-0 cursor-pointer font-bold w-4 h-4 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors border-0"
                                    title="XÃƒÆ’Ã‚Â³a phÃƒÆ’Ã‚Â¢n khu"
                                >
                                    ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¢
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent, rows, cols, zones, newZoneSize, newZoneName, orientation, createNewZone, removeZone]);

    return (
        <div className="flex-1 overflow-auto p-6 bg-gray-100 flex flex-col h-[calc(100vh-180px)] rounded-xl border border-gray-200">
            <div className="mb-4">
                <h3 className="text-base font-bold text-gray-800 uppercase tracking-wide">MÃƒÂ¡Ã‚ÂºÃ‚Â·t BÃƒÂ¡Ã‚ÂºÃ‚Â±ng BÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ TrÃƒÆ’Ã‚Â­ Kho</h3>
                <p className="text-xs text-gray-500">KÃƒÆ’Ã‚Â©o cÃƒÆ’Ã‚Â¡c phÃƒÆ’Ã‚Â¢n khu tÃƒÂ¡Ã‚Â»Ã‚Â« thanh menu bÃƒÆ’Ã‚Âªn trÃƒÆ’Ã‚Â¡i thÃƒÂ¡Ã‚ÂºÃ‚Â£ vÃƒÆ’ o ÃƒÆ’Ã‚Â´ bÃƒÂ¡Ã‚ÂºÃ‚Â¥t kÃƒÂ¡Ã‚Â»Ã‚Â³ trÃƒÆ’Ã‚Âªn lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ xÃƒÆ’Ã‚Â¡c Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh vÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ trÃƒÆ’Ã‚Â­. HÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºng bÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ trÃƒÆ’Ã‚Â­ (ngang/dÃƒÂ¡Ã‚Â»Ã‚c) sÃƒÂ¡Ã‚ÂºÃ‚Â½ ÃƒÆ’Ã‚Â¡p dÃƒÂ¡Ã‚Â»Ã‚Â¥ng khi thÃƒÂ¡Ã‚ÂºÃ‚Â£.</p>
            </div>

            <div className="flex-1 flex justify-start items-start overflow-auto">
                <div
                    className="inline-grid gap-1.5 bg-white p-4 rounded-3xl shadow-inner border border-gray-200"
                    style={{ gridTemplateColumns: `repeat(${cols}, 68px)` }}
                >
                    {Array.from({ length: rows * cols }).map((_, index) => {
                        const row = Math.floor(index / cols);
                        const col = index % cols;
                        const zone = getZoneAt(row, col);

                        return (
                            <div
                                key={index}
                                onDrop={(e) => handleDrop(e, row, col)}
                                onDragOver={allowDrop}
                                onClick={() => zone && onSelectZone && onSelectZone(zone.code)}
                                className={`
                  h-16 rounded-2xl border-2 flex items-center justify-center text-sm font-medium
                  transition-all cursor-pointer hover:scale-105
                  ${zone
                                        ? "border-transparent shadow-sm"
                                        : "border-dashed border-gray-255 hover:border-pink-300 hover:bg-pink-50/20"
                                    }
                `}
                                style={zone ? { backgroundColor: `${zone.color}25` } : {}}
                            >
                                {zone ? (
                                    <div className="text-center">
                                        <div className="font-bold" style={{ color: zone.color }}>
                                            {zone.code}
                                        </div>
                                        <div className="text-[10px] text-gray-550 mt-0.5">
                                            {zone.size} kÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-gray-300 text-[10px]">({row + 1}, {col + 1})</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}



