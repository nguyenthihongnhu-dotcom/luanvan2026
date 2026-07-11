// import React, { useState, useEffect } from "react";
// import type { ViTriKho } from "../../../../hooks/useWarehouse";
// import { useSidebar } from "../../../../context/Sidebarcontext";

// interface Zone {
//   id: string;
//   code: string;
//   name: string;
//   color: string;
//   size: number;           // Số kệ (ô)
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
//       name: "Zone A - Sữa & Tã",
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
//       name: "Zone B - Đồ chơi & Xe đẩy",
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
//       name: "Zone C - Thời trang trẻ em",
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
//       name: "Zone D - Thực phẩm ăn dặm",
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
//       name: "Zone E - Chăm sóc sức khỏe",
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

//   // Tạo Zone mới
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

//   // Kéo thả Zone
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

//     // Bố trí theo hàng ngang hoặc dọc
//     for (let i = 0; i < zone.size; i++) {
//       if (orientation === "horizontal") {
//         const newCol = targetCol + i;
//         if (newCol >= cols) break; // Không cho tràn cột
//         newOccupiedCells.push({ row: targetRow, col: newCol });
//       } else {
//         const newRow = targetRow + i;
//         if (newRow >= rows) break; // Không cho tràn hàng
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

//   // Xóa Zone
//   const removeZone = (id: string) => {
//     setZones(zones.filter(z => z.id !== id));
//   };

//   // Kiểm tra ô có thuộc Zone nào không
//   const getZoneAt = (row: number, col: number) => {
//     return zones.find(zone => 
//       zone.occupiedCells.some(cell => cell.row === row && cell.col === col)
//     );
//   };

//   // Thiết lập nội dung cho Sidebar.tsx
//   useEffect(() => {
//     setExtraContent(
//       <div className="space-y-6">
//         {/* Cấu hình Grid */}
//         <div className="space-y-2">
//           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Cấu hình lưới kho</h3>

//           <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200/50">
//             <span className="text-xs font-semibold text-gray-600">Số hàng:</span>
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
//             <span className="text-xs font-semibold text-gray-600">Số cột:</span>
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

//         {/* Hướng bố trí */}
//         <div className="space-y-2">
//           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Hướng bố trí (thả)</h3>
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
//               Dọc
//             </button>
//           </div>
//         </div>

//         {/* Tạo Zone mới */}
//         <div className="space-y-2">
//           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Thêm Zone mới</h3>
//           <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200/50 mb-2">
//             <span className="text-xs font-semibold text-gray-600">Số kệ:</span>
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
//                         + Thêm sản phẩm
//                     </button> */}
//           <button
//             type="button"
//             onClick={createNewZone}
//             className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs py-2 rounded-lg transition cursor-pointer shadow-sm border-0"
//           >
//             + Thêm Phân Khu mới
//           </button>
//         </div>

//         {/* Danh sách phân khu */}
//         <div className="space-y-2">
//           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Kéo thả Phân khu</h3>
//           <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
//             {zones.length === 0 && (
//               <p className="text-xs text-gray-400 italic text-center py-4">Chưa có phân khu nào</p>
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
//                     {zone.size} kệ • {zone.occupiedCells.length > 0 ? "Đã đặt" : "Chưa đặt"}
//                   </p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     removeZone(zone.id);
//                   }}
//                   className="text-red-400 hover:text-red-600 text-xs ml-1 shrink-0 cursor-pointer font-bold w-4 h-4 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors border-0"
//                   title="Xóa phân khu"
//                 >
//                   ✕
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
//         <h3 className="text-base font-bold text-gray-800 uppercase tracking-wide">Mặt Bằng Bố Trí Kho</h3>
//         <p className="text-xs text-gray-500">Kéo các phân khu từ thanh menu bên trái thả vào ô bất kỳ trên lưới để xác định vị trí. Hướng bố trí (ngang/dọc) sẽ áp dụng khi thả.</p>
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
//                       {zone.size} kệ
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

import React, { useState, useEffect } from "react";
import type { ViTriKho } from "../../../../hooks/useWarehouse";
import { useSidebar } from "../../../../context/Sidebarcontext";

interface Zone {
    id: string;
    code: string;
    name: string;
    color: string;
    size: number;           // Số kệ (ô)
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
            name: "Zone A - Sữa & Tã",
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
            name: "Zone B - Đồ chơi & Xe đẩy",
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
            name: "Zone C - Thời trang trẻ em",
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
            name: "Zone D - Thực phẩm ăn dặm",
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
            name: "Zone E - Chăm sóc sức khỏe",
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

    // Tạo Zone mới
    const createNewZone = () => {
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
        setNewZoneName(""); // Reset field nhập sau khi thêm thành công
    };

    // Kéo thả Zone
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

        // Bố trí theo hàng ngang hoặc dọc
        for (let i = 0; i < zone.size; i++) {
            if (orientation === "horizontal") {
                const newCol = targetCol + i;
                if (newCol >= cols) break; // Không cho tràn cột
                newOccupiedCells.push({ row: targetRow, col: newCol });
            } else {
                const newRow = targetRow + i;
                if (newRow >= rows) break; // Không cho tràn hàng
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

    // Xóa Zone
    const removeZone = (id: string) => {
        setZones(zones.filter(z => z.id !== id));
    };

    // Kiểm tra ô có thuộc Zone nào không
    const getZoneAt = (row: number, col: number) => {
        return zones.find(zone =>
            zone.occupiedCells.some(cell => cell.row === row && cell.col === col)
        );
    };

    // Thiết lập nội dung cho Sidebar.tsx
    useEffect(() => {
        setExtraContent(
            <div className="space-y-6">
                {/* Cấu hình Grid */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Cấu hình lưới kho</h3>

                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200/50">
                        <span className="text-xs font-semibold text-gray-600">Số hàng:</span>
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
                        <span className="text-xs font-semibold text-gray-600">Số cột:</span>
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

                {/* Hướng bố trí */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Hướng bố trí (thả)</h3>
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
                            Dọc
                        </button>
                    </div>
                </div>

                {/* Tạo Zone mới */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Thêm Zone mới</h3>

                    {/* Ô nhập tên phân khu */}
                    <div className="space-y-1 mb-2">
                        <label htmlFor="zone-name-input" className="text-[11px] font-semibold text-gray-600 block">Tên phân khu (tùy chọn):</label>
                        <input
                            id="zone-name-input"
                            type="text"
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            placeholder="VD: Sữa & Tã, Đồ chơi..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-pink-500 bg-white"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200/50 mb-2">
                        <span className="text-xs font-semibold text-gray-600">Số kệ:</span>
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
                        + Thêm Phân Khu mới
                    </button>
                </div>

                {/* Danh sách phân khu */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Kéo thả Phân khu</h3>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {zones.length === 0 && (
                            <p className="text-xs text-gray-400 italic text-center py-4">Chưa có phân khu nào</p>
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
                                        {zone.size} kệ • {zone.occupiedCells.length > 0 ? "Đã đặt" : "Chưa đặt"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeZone(zone.id);
                                    }}
                                    className="text-red-400 hover:text-red-600 text-xs ml-1 shrink-0 cursor-pointer font-bold w-4 h-4 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors border-0"
                                    title="Xóa phân khu"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent, rows, cols, zones, newZoneSize, newZoneName, orientation]);

    return (
        <div className="flex-1 overflow-auto p-6 bg-gray-100 flex flex-col h-[calc(100vh-180px)] rounded-xl border border-gray-200">
            <div className="mb-4">
                <h3 className="text-base font-bold text-gray-800 uppercase tracking-wide">Mặt Bằng Bố Trí Kho</h3>
                <p className="text-xs text-gray-500">Kéo các phân khu từ thanh menu bên trái thả vào ô bất kỳ trên lưới để xác định vị trí. Hướng bố trí (ngang/dọc) sẽ áp dụng khi thả.</p>
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
                                            {zone.size} kệ
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