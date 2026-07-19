import { useState } from "react";

// Interface Ä‘á»‹nh nghÄ©a cáº¥u trÃºc cá»§a má»™t vá»‹ trÃ­ váº­t lÃ½ trong kho
export interface ViTriKho {
    MaViTri: number;       // ID tá»± tÄƒng Ä‘á»‹nh danh vá»‹ trÃ­ trong cÆ¡ sá»Ÿ dá»¯ liá»‡u
    KhuVuc: string;        // Zone lÆ°u trá»¯ (A, B, C...)
    Ke: string;            // MÃ£ cá»§a ká»‡ hÃ ng (vd: '01', '02'...)
    Tang: string;          // Táº§ng náº±m trÃªn ká»‡ (vd: '01', '02'...)
    MaViTriCha: number | null; // Sá»­ dá»¥ng náº¿u cÃ³ cáº¥u trÃºc vá»‹ trÃ­ cha-con (phÃ¢n cáº¥p)
    TrangThai: 'Trong' | 'DangChua' | 'Day'; // Tráº¡ng thÃ¡i chá»©a hÃ ng cá»§a Ã´ vá»‹ trÃ­
    SanPhamLuuTru?: string; // TÃªn máº·t hÃ ng Ä‘ang Ä‘Æ°á»£c Ä‘áº·t táº¡i Ã´ nÃ y
}

// Interface Ä‘á»‹nh nghÄ©a má»™t ká»‡ hÃ ng
export interface Shelf {
    id: string;
    code: string;          // MÃ£ ká»‡ dáº¡ng chuá»—i (vd: '01')
    name: string;          // TÃªn hiá»ƒn thá»‹ (vd: 'Ká»‡ 01')
}

// Interface Ä‘á»‹nh nghÄ©a má»™t táº§ng cá»§a ká»‡
export interface Layer {
    id: string;
    code: string;          // MÃ£ táº§ng dáº¡ng chuá»—i (vd: '01')
    name: string;          // TÃªn hiá»ƒn thá»‹ (vd: 'Táº§ng 01')
}

// Dá»¯ liá»‡u giáº£ láº­p cÃ¡c ká»‡ máº·c Ä‘á»‹nh ban Ä‘áº§u
const mockShelves: Shelf[] = [
    { id: 's1', code: '01', name: 'Ká»‡ 01' },
    { id: 's2', code: '02', name: 'Ká»‡ 02' },
    { id: 's3', code: '03', name: 'Ká»‡ 03' },
];

// Dá»¯ liá»‡u giáº£ láº­p cÃ¡c táº§ng máº·c Ä‘á»‹nh ban Ä‘áº§u (Sáº¯p xáº¿p tá»« táº§ng cao nháº¥t xuá»‘ng dÆ°á»›i)
const mockLayers: Layer[] = [
    { id: 'l3', code: '03', name: 'Táº§ng 03' },
    { id: 'l2', code: '02', name: 'Táº§ng 02' },
    { id: 'l1', code: '01', name: 'Táº§ng 01' },
];

// Dá»¯ liá»‡u giáº£ láº­p cÃ¡c vá»‹ trÃ­ chi tiáº¿t trong kho kÃ¨m tráº¡ng thÃ¡i chá»©a sáº£n pháº©m cá»§a nhiá»u Khu Vá»±c (Zone A - E)
const generateMockLocations = (): ViTriKho[] => {
    const list: ViTriKho[] = [];
    let id = 1;
    
    // Cáº¥u hÃ¬nh sáº£n pháº©m Ä‘áº·c thÃ¹ cho tá»«ng Zone cá»§a kho Máº¹ & BÃ© (Bambi WMS)
    const zoneAProducts: Record<string, { status: 'Trong' | 'DangChua' | 'Day'; product?: string }> = {
        '01-01': { status: 'DangChua', product: 'TÃ£ quáº§n Huggies' },
        '01-02': { status: 'Trong' },
        '01-03': { status: 'Day', product: 'Sá»¯a Frisolac Gold' },
        '02-01': { status: 'Trong' },
        '02-02': { status: 'DangChua', product: 'KhÄƒn Æ°á»›t Bobby' },
        '02-03': { status: 'Trong' },
        '03-01': { status: 'Trong' },
        '03-02': { status: 'Trong' },
        '03-03': { status: 'Trong' },
    };

    const zoneBProducts: Record<string, { status: 'Trong' | 'DangChua' | 'Day'; product?: string }> = {
        '01-01': { status: 'DangChua', product: 'Xe Ä‘áº©y Joie Baby' },
        '01-02': { status: 'Trong' },
        '01-03': { status: 'Trong' },
        '02-01': { status: 'Day', product: 'Bá»™ Ä‘á»“ chÆ¡i Lego Duplo' },
        '02-02': { status: 'Trong' },
        '02-03': { status: 'DangChua', product: 'ThÃº bÃ´ng gáº¥u con' },
        '03-01': { status: 'Trong' },
        '03-02': { status: 'Trong' },
        '03-03': { status: 'Trong' },
    };

    const zoneCProducts: Record<string, { status: 'Trong' | 'DangChua' | 'Day'; product?: string }> = {
        '01-01': { status: 'Trong' },
        '01-02': { status: 'DangChua', product: 'Body chip Nous sÆ¡ sinh' },
        '01-03': { status: 'Trong' },
        '02-01': { status: 'Trong' },
        '02-02': { status: 'Day', product: 'Ão khoÃ¡c giÃ³ giá»¯ áº¥m' },
        '02-03': { status: 'Trong' },
        '03-01': { status: 'DangChua', product: 'MÅ© cotton Nous' },
        '03-02': { status: 'Trong' },
        '03-03': { status: 'Trong' },
    };

    const zoneDProducts: Record<string, { status: 'Trong' | 'DangChua' | 'Day'; product?: string }> = {
        '01-01': { status: 'Day', product: 'Bá»™t Äƒn dáº·m Heinz' },
        '01-02': { status: 'Trong' },
        '01-03': { status: 'Trong' },
        '02-01': { status: 'DangChua', product: 'NÆ°á»›c Ã©p trÃ¡i cÃ¢y Pigeon' },
        '02-02': { status: 'Trong' },
        '02-03': { status: 'Trong' },
        '03-01': { status: 'Trong' },
        '03-02': { status: 'Day', product: 'BÃ¡nh Äƒn dáº·m Gerber' },
        '03-03': { status: 'Trong' },
    };

    const zoneEProducts: Record<string, { status: 'Trong' | 'DangChua' | 'Day'; product?: string }> = {
        '01-01': { status: 'Trong' },
        '01-02': { status: 'Day', product: 'Nhiá»‡t káº¿ há»“ng ngoáº¡i' },
        '01-03': { status: 'Trong' },
        '02-01': { status: 'Trong' },
        '02-02': { status: 'Trong' },
        '02-03': { status: 'DangChua', product: 'Dáº§u trÃ m khuynh diá»‡p' },
        '03-01': { status: 'Trong' },
        '03-02': { status: 'Trong' },
        '03-03': { status: 'Trong' },
    };

    const configs: Record<string, Record<string, { status: 'Trong' | 'DangChua' | 'Day'; product?: string }>> = {
        'A': zoneAProducts,
        'B': zoneBProducts,
        'C': zoneCProducts,
        'D': zoneDProducts,
        'E': zoneEProducts,
    };

    const zones = ['A', 'B', 'C', 'D', 'E'];
    const shelves = ['01', '02', '03'];
    const layers = ['01', '02', '03'];

    zones.forEach(zone => {
        shelves.forEach(shelf => {
            layers.forEach(layer => {
                const key = `${shelf}-${layer}`;
                const config = configs[zone]?.[key] || { status: 'Trong' };
                list.push({
                    MaViTri: id++,
                    KhuVuc: zone,
                    Ke: shelf,
                    Tang: layer,
                    MaViTriCha: null,
                    TrangThai: config.status,
                    SanPhamLuuTru: config.product
                });
            });
        });
    });

    return list;
};

const mockLocations = generateMockLocations();

/**
 * Custom Hook useWarehouse
 * ÄÃ³ng vai trÃ² quáº£n lÃ½ toÃ n bá»™ cÃ¡c thao tÃ¡c nghiá»‡p vá»¥, tráº¡ng thÃ¡i hiá»ƒn thá»‹
 * cá»§a cáº¥u trÃºc sÆ¡ Ä‘á»“ kho (Zone, Ká»‡, Táº§ng, Vá»‹ TrÃ­).
 */
export function useWarehouse() {
    // Tráº¡ng thÃ¡i khu vá»±c kho Ä‘ang chá»n (Máº·c Ä‘á»‹nh lÃ  null - Hiá»ƒn thá»‹ Báº£n Ä‘á»“ tá»•ng thá»ƒ kho)
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    
    // Tráº¡ng thÃ¡i danh sÃ¡ch táº§ng trong kho
    const [layers, setLayers] = useState<Layer[]>(mockLayers);
    
    // Tráº¡ng thÃ¡i danh sÃ¡ch ká»‡ hÃ ng trong kho
    const [shelves, setShelves] = useState<Shelf[]>(mockShelves);
    
    // Tráº¡ng thÃ¡i danh sÃ¡ch chi tiáº¿t cÃ¡c vá»‹ trÃ­ Ã´ váº­t lÃ½
    const [locations, setLocations] = useState<ViTriKho[]>(mockLocations);
    
    // Tráº¡ng thÃ¡i vá»‹ trÃ­ Ã´ váº­t lÃ½ Ä‘ang Ä‘Æ°á»£c nháº¥p chá»n (dÃ¹ng Ä‘á»ƒ hiá»ƒn thá»‹ báº£ng chi tiáº¿t bÃªn pháº£i)
    const [activeLocation, setActiveLocation] = useState<ViTriKho | null>(null);

    /**
     * TÃ¬m thÃ´ng tin vá»‹ trÃ­ Ã´ kho dá»±a vÃ o mÃ£ Ká»‡ vÃ  mÃ£ Táº§ng
     * @param shelfCode MÃ£ ká»‡ cáº§n tÃ¬m
     * @param layerCode MÃ£ táº§ng cáº§n tÃ¬m
     * @returns Äá»‘i tÆ°á»£ng vá»‹ trÃ­ Ã´ kho náº¿u tÃ¬m tháº¥y, ngÆ°á»£c láº¡i undefined
     */
    const getLocationInfo = (shelfCode: string, layerCode: string) => {
        return locations.find((loc) =>
            loc.KhuVuc === selectedZone && loc.Ke === shelfCode && loc.Tang === layerCode
        );
    };

    /**
     * ThÃªm má»™t dÃ£y ká»‡ má»›i vÃ o cáº¥u trÃºc kho cá»§a Zone hiá»‡n táº¡i
     * Tá»± Ä‘á»™ng sinh mÃ£ ká»‡ tiáº¿p theo (vd: Ká»‡ 04) vÃ  khá»Ÿi táº¡o cÃ¡c Ã´ vá»‹ trÃ­ tÆ°Æ¡ng á»©ng
     * á»Ÿ tráº¡ng thÃ¡i trá»‘ng ('Trong') cho táº¥t cáº£ cÃ¡c táº§ng.
     */
    const handleAddShelf = () => {
        // TÃ¬m mÃ£ sá»‘ ká»‡ tiáº¿p theo báº±ng cÃ¡ch láº¥y mÃ£ ká»‡ cuá»‘i cÃ¹ng + 1
        const nextCodeInt = shelves.length > 0
            ? parseInt(shelves[shelves.length - 1].code) + 1
            : 1;
        const shelfCode = nextCodeInt.toString().padStart(2, '0'); // Äá»‹nh dáº¡ng dáº¡ng '04'

        const newShelf: Shelf = {
            id: `s${nextCodeInt}`,
            code: shelfCode,
            name: `Ká»‡ ${shelfCode}`
        };

        // Láº¥y ID vá»‹ trÃ­ cao nháº¥t hiá»‡n táº¡i Ä‘á»ƒ cá»™ng dá»“n sinh mÃ£ ID tiáº¿p theo
        let currentMaxId = locations.length > 0
            ? Math.max(...locations.map(l => l.MaViTri))
            : 0;

        // Táº¡o danh sÃ¡ch cÃ¡c vá»‹ trÃ­ Ã´ kho má»›i tÆ°Æ¡ng á»©ng vá»›i cÃ¡c táº§ng cá»§a ká»‡ má»›i
        const newLocationsForShelf: ViTriKho[] = layers.map((layer) => {
            currentMaxId++;
            return {
                MaViTri: currentMaxId,
                KhuVuc: selectedZone || "",
                Ke: shelfCode,
                Tang: layer.code,
                MaViTriCha: null,
                TrangThai: 'Trong',
            };
        });

        // Cáº­p nháº­t láº¡i danh sÃ¡ch ká»‡ vÃ  danh sÃ¡ch cÃ¡c Ã´ vá»‹ trÃ­ kho
        setShelves([...shelves, newShelf]);
        setLocations([...locations, ...newLocationsForShelf]);
    };

    /**
     * ThÃªm má»™t táº§ng má»›i cho toÃ n bá»™ cÃ¡c ká»‡ hÃ ng hiá»‡n táº¡i
     * Táº§ng má»›i sáº½ Ä‘Æ°á»£c sáº¯p xáº¿p thÃªm vÃ o vá»‹ trÃ­ cao nháº¥t (Trá»¥c Y)
     */
    const handleAddLayer = () => {
        // Láº¥y mÃ£ sá»‘ táº§ng cao nháº¥t hiá»‡n táº¡i Ä‘á»ƒ cá»™ng thÃªm 1
        const layerCodes = layers.map(l => parseInt(l.code));
        const nextCodeInt = layerCodes.length > 0 ? Math.max(...layerCodes) + 1 : 1;
        const layerCode = nextCodeInt.toString().padStart(2, '0');

        const newLayer: Layer = {
            id: `l${nextCodeInt}`,
            code: layerCode,
            name: `Táº§ng ${layerCode}`
        };

        let currentMaxId = locations.length > 0 ? Math.max(...locations.map(l => l.MaViTri)) : 0;
        
        // Táº¡o cÃ¡c Ã´ vá»‹ trÃ­ kho má»›i á»Ÿ táº§ng nÃ y cho táº¥t cáº£ cÃ¡c ká»‡ hÃ ng hiá»‡n cÃ³
        const newLocationsForLayer: ViTriKho[] = shelves.map(shelf => {
            currentMaxId++;
            return {
                MaViTri: currentMaxId,
                KhuVuc: selectedZone || "",
                Ke: shelf.code,
                Tang: layerCode,
                MaViTriCha: null,
                TrangThai: 'Trong',
            };
        });

        // ThÃªm táº§ng má»›i lÃªn trÃªn cÃ¹ng cá»§a danh sÃ¡ch (Váº½ tá»« trÃªn xuá»‘ng dÆ°á»›i)
        setLayers([newLayer, ...layers]);
        setLocations([...locations, ...newLocationsForLayer]);
    };

    /**
     * XÃ³a má»™t ká»‡ hÃ ng cÃ¹ng toÃ n bá»™ cÃ¡c Ã´ vá»‹ trÃ­ thuá»™c ká»‡ Ä‘Ã³
     */
    const handleDeleteShelf = (shelfId: string, shelfCode: string) => {
        if (!window.confirm(`Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a Ká»‡ ${shelfCode}? ToÃ n bá»™ vá»‹ trÃ­ thuá»™c ká»‡ nÃ y sáº½ bá»‹ xÃ³a.`)) return;
        
        // Loáº¡i bá» ká»‡ khá»i danh sÃ¡ch hiá»ƒn thá»‹
        setShelves(shelves.filter(s => s.id !== shelfId));
        // Lá»c bá» toÃ n bá»™ Ã´ vá»‹ trÃ­ cÃ³ mÃ£ ká»‡ bá»‹ xÃ³a khá»i máº£ng
        setLocations(locations.filter(l => !(l.KhuVuc === selectedZone && l.Ke === shelfCode)));
        
        // Náº¿u Ã´ chi tiáº¿t Ä‘ang xem thuá»™c ká»‡ vá»«a xÃ³a thÃ¬ Ä‘Ã³ng báº£ng chi tiáº¿t
        if (activeLocation?.KhuVuc === selectedZone && activeLocation?.Ke === shelfCode) {
            setActiveLocation(null);
        }
    };

    /**
     * XÃ³a má»™t táº§ng trÃªn táº¥t cáº£ cÃ¡c ká»‡ hÃ ng hiá»‡n cÃ³
     */
    const handleDeleteLayer = (layerId: string, layerCode: string) => {
        if (!window.confirm(`Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a Táº§ng ${layerCode}? ToÃ n bá»™ vá»‹ trÃ­ á»Ÿ táº§ng nÃ y trÃªn táº¥t cáº£ cÃ¡c ká»‡ sáº½ bá»‹ xÃ³a.`)) return;
        
        // Loáº¡i bá» táº§ng khá»i danh sÃ¡ch táº§ng
        setLayers(layers.filter(l => l.id !== layerId));
        // Lá»c bá» toÃ n bá»™ Ã´ vá»‹ trÃ­ thuá»™c táº§ng Ä‘Ã³ khá»i máº£ng
        setLocations(locations.filter(l => !(l.KhuVuc === selectedZone && l.Tang === layerCode)));
        
        // Náº¿u Ã´ chi tiáº¿t Ä‘ang xem thuá»™c táº§ng vá»«a xÃ³a thÃ¬ Ä‘Ã³ng báº£ng chi tiáº¿t
        if (activeLocation?.KhuVuc === selectedZone && activeLocation?.Tang === layerCode) {
            setActiveLocation(null);
        }
    };

    return {
        selectedZone,
        setSelectedZone,
        layers,
        shelves,
        locations,
        activeLocation,
        setActiveLocation,
        getLocationInfo,
        handleAddShelf,
        handleAddLayer,
        handleDeleteShelf,
        handleDeleteLayer,
    };
}


