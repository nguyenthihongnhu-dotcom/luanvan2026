import { useState } from "react";

// Interface định nghĩa cấu trúc của một vị trí vật lý trong kho
export interface ViTriKho {
    MaViTri: number;       // ID tự tăng định danh vị trí trong cơ sở dữ liệu
    KhuVuc: string;        // Zone lưu trữ (A, B, C...)
    Ke: string;            // Mã của kệ hàng (vd: '01', '02'...)
    Tang: string;          // Tầng nằm trên kệ (vd: '01', '02'...)
    MaViTriCha: number | null; // Sử dụng nếu có cấu trúc vị trí cha-con (phân cấp)
    TrangThai: 'Trong' | 'DangChua' | 'Day'; // Trạng thái chứa hàng của ô vị trí
    SanPhamLuuTru?: string; // Tên mặt hàng đang được đặt tại ô này
}

// Interface định nghĩa một kệ hàng
export interface Shelf {
    id: string;
    code: string;          // Mã kệ dạng chuỗi (vd: '01')
    name: string;          // Tên hiển thị (vd: 'Kệ 01')
}

// Interface định nghĩa một tầng của kệ
export interface Layer {
    id: string;
    code: string;          // Mã tầng dạng chuỗi (vd: '01')
    name: string;          // Tên hiển thị (vd: 'Tầng 01')
}

// Dữ liệu giả lập các kệ mặc định ban đầu
const mockShelves: Shelf[] = [
    { id: 's1', code: '01', name: 'Kệ 01' },
    { id: 's2', code: '02', name: 'Kệ 02' },
    { id: 's3', code: '03', name: 'Kệ 03' },
];

// Dữ liệu giả lập các tầng mặc định ban đầu (Sắp xếp từ tầng cao nhất xuống dưới)
const mockLayers: Layer[] = [
    { id: 'l3', code: '03', name: 'Tầng 03' },
    { id: 'l2', code: '02', name: 'Tầng 02' },
    { id: 'l1', code: '01', name: 'Tầng 01' },
];

// Dữ liệu giả lập các vị trí chi tiết trong kho kèm trạng thái chứa sản phẩm của nhiều Khu Vực (Zone A - E)
const generateMockLocations = (): ViTriKho[] => {
    const list: ViTriKho[] = [];
    let id = 1;
    
    // Cấu hình sản phẩm đặc thù cho từng Zone của kho Mẹ & Bé (Bambi WMS)
    const zoneAProducts: Record<string, { status: 'Trong' | 'DangChua' | 'Day'; product?: string }> = {
        '01-01': { status: 'DangChua', product: 'Tã quần Huggies' },
        '01-02': { 
            us: 'Trong' },
        '01-03': { status: 'Day', product: 'Sữa Frisolac Gold' },
        '02-01': { status: 'Trong' },
        '02-02': { status: 'DangChua', product: 'Khăn ướt Bobby' },
        '02-03': { status: 'Trong' },
        '03-01': { status: 'Trong' },
        '03-02': { status: 'Trong' },
        '03-03': { status: 'Trong' },
    };

    const zoneBProducts: Record<string, { status: 'Trong' | 'DangChua' | 'Day'; product?: string }> = {
        '01-01': { status: 'DangChua', product: 'Xe đẩy Joie Baby' },
        '01-02': { status: 'Trong' },
        '01-03': { status: 'Trong' },
        '02-01': { status: 'Day', product: 'Bộ đồ chơi Lego Duplo' },
        '02-02': { status: 'Trong' },
        '02-03': { status: 'DangChua', product: 'Thú bông gấu con' },
        '03-01': { status: 'Trong' },
        '03-02': { status: 'Trong' },
        '03-03': { status: 'Trong' },
    };

    const zoneCProducts: Record<string, { status: 'Trong' | 'DangChua' | 'Day'; product?: string }> = {
        '01-01': { status: 'Trong' },
        '01-02': { status: 'DangChua', product: 'Body chip Nous sơ sinh' },
        '01-03': { status: 'Trong' },
        '02-01': { status: 'Trong' },
        '02-02': { status: 'Day', product: 'Áo khoác gió giữ ấm' },
        '02-03': { status: 'Trong' },
        '03-01': { status: 'DangChua', product: 'Mũ cotton Nous' },
        '03-02': { status: 'Trong' },
        '03-03': { status: 'Trong' },
    };

    const zoneDProducts: Record<string, { status: 'Trong' | 'DangChua' | 'Day'; product?: string }> = {
        '01-01': { status: 'Day', product: 'Bột ăn dặm Heinz' },
        '01-02': { status: 'Trong' },
        '01-03': { status: 'Trong' },
        '02-01': { status: 'DangChua', product: 'Nước ép trái cây Pigeon' },
        '02-02': { status: 'Trong' },
        '02-03': { status: 'Trong' },
        '03-01': { status: 'Trong' },
        '03-02': { status: 'Day', product: 'Bánh ăn dặm Gerber' },
        '03-03': { status: 'Trong' },
    };

    const zoneEProducts: Record<string, { status: 'Trong' | 'DangChua' | 'Day'; product?: string }> = {
        '01-01': { status: 'Trong' },
        '01-02': { status: 'Day', product: 'Nhiệt kế hồng ngoại' },
        '01-03': { status: 'Trong' },
        '02-01': { status: 'Trong' },
        '02-02': { status: 'Trong' },
        '02-03': { status: 'DangChua', product: 'Dầu tràm khuynh diệp' },
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
 * Đóng vai trò quản lý toàn bộ các thao tác nghiệp vụ, trạng thái hiển thị
 * của cấu trúc sơ đồ kho (Zone, Kệ, Tầng, Vị Trí).
 */
export function useWarehouse() {
    // Trạng thái khu vực kho đang chọn (Mặc định là null - Hiển thị Bản đồ tổng thể kho)
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    
    // Trạng thái danh sách tầng trong kho
    const [layers, setLayers] = useState<Layer[]>(mockLayers);
    
    // Trạng thái danh sách kệ hàng trong kho
    const [shelves, setShelves] = useState<Shelf[]>(mockShelves);
    
    // Trạng thái danh sách chi tiết các vị trí ô vật lý
    const [locations, setLocations] = useState<ViTriKho[]>(mockLocations);
    
    // Trạng thái vị trí ô vật lý đang được nhấp chọn (dùng để hiển thị bảng chi tiết bên phải)
    const [activeLocation, setActiveLocation] = useState<ViTriKho | null>(null);

    /**
     * Tìm thông tin vị trí ô kho dựa vào mã Kệ và mã Tầng
     * @param shelfCode Mã kệ cần tìm
     * @param layerCode Mã tầng cần tìm
     * @returns Đối tượng vị trí ô kho nếu tìm thấy, ngược lại undefined
     */
    const getLocationInfo = (shelfCode: string, layerCode: string) => {
        return locations.find((loc) =>
            loc.KhuVuc === selectedZone && loc.Ke === shelfCode && loc.Tang === layerCode
        );
    };

    /**
     * Thêm một dãy kệ mới vào cấu trúc kho của Zone hiện tại
     * Tự động sinh mã kệ tiếp theo (vd: Kệ 04) và khởi tạo các ô vị trí tương ứng
     * ở trạng thái trống ('Trong') cho tất cả các tầng.
     */
    const handleAddShelf = () => {
        // Tìm mã số kệ tiếp theo bằng cách lấy mã kệ cuối cùng + 1
        const nextCodeInt = shelves.length > 0
            ? parseInt(shelves[shelves.length - 1].code) + 1
            : 1;
        const shelfCode = nextCodeInt.toString().padStart(2, '0'); // Định dạng dạng '04'

        const newShelf: Shelf = {
            id: `s${nextCodeInt}`,
            code: shelfCode,
            name: `Kệ ${shelfCode}`
        };

        // Lấy ID vị trí cao nhất hiện tại để cộng dồn sinh mã ID tiếp theo
        let currentMaxId = locations.length > 0
            ? Math.max(...locations.map(l => l.MaViTri))
            : 0;

        // Tạo danh sách các vị trí ô kho mới tương ứng với các tầng của kệ mới
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

        // Cập nhật lại danh sách kệ và danh sách các ô vị trí kho
        setShelves([...shelves, newShelf]);
        setLocations([...locations, ...newLocationsForShelf]);
    };

    /**
     * Thêm một tầng mới cho toàn bộ các kệ hàng hiện tại
     * Tầng mới sẽ được sắp xếp thêm vào vị trí cao nhất (Trục Y)
     */
    const handleAddLayer = () => {
        // Lấy mã số tầng cao nhất hiện tại để cộng thêm 1
        const layerCodes = layers.map(l => parseInt(l.code));
        const nextCodeInt = layerCodes.length > 0 ? Math.max(...layerCodes) + 1 : 1;
        const layerCode = nextCodeInt.toString().padStart(2, '0');

        const newLayer: Layer = {
            id: `l${nextCodeInt}`,
            code: layerCode,
            name: `Tầng ${layerCode}`
        };

        let currentMaxId = locations.length > 0 ? Math.max(...locations.map(l => l.MaViTri)) : 0;
        
        // Tạo các ô vị trí kho mới ở tầng này cho tất cả các kệ hàng hiện có
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

        // Thêm tầng mới lên trên cùng của danh sách (Vẽ từ trên xuống dưới)
        setLayers([newLayer, ...layers]);
        setLocations([...locations, ...newLocationsForLayer]);
    };

    /**
     * Xóa một kệ hàng cùng toàn bộ các ô vị trí thuộc kệ đó
     */
    const handleDeleteShelf = (shelfId: string, shelfCode: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa Kệ ${shelfCode}? Toàn bộ vị trí thuộc kệ này sẽ bị xóa.`)) return;
        
        // Loại bỏ kệ khỏi danh sách hiển thị
        setShelves(shelves.filter(s => s.id !== shelfId));
        // Lọc bỏ toàn bộ ô vị trí có mã kệ bị xóa khỏi mảng
        setLocations(locations.filter(l => !(l.KhuVuc === selectedZone && l.Ke === shelfCode)));
        
        // Nếu ô chi tiết đang xem thuộc kệ vừa xóa thì đóng bảng chi tiết
        if (activeLocation?.KhuVuc === selectedZone && activeLocation?.Ke === shelfCode) {
            setActiveLocation(null);
        }
    };

    /**
     * Xóa một tầng trên tất cả các kệ hàng hiện có
     */
    const handleDeleteLayer = (layerId: string, layerCode: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa Tầng ${layerCode}? Toàn bộ vị trí ở tầng này trên tất cả các kệ sẽ bị xóa.`)) return;
        
        // Loại bỏ tầng khỏi danh sách tầng
        setLayers(layers.filter(l => l.id !== layerId));
        // Lọc bỏ toàn bộ ô vị trí thuộc tầng đó khỏi mảng
        setLocations(locations.filter(l => !(l.KhuVuc === selectedZone && l.Tang === layerCode)));
        
        // Nếu ô chi tiết đang xem thuộc tầng vừa xóa thì đóng bảng chi tiết
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
