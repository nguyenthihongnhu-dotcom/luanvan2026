import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const dbLocations = await this.prisma.vi_tri_kho.findMany({
      include: {
        ton_kho: {
          include: {
            lo_san_pham: {
              include: {
                san_pham: true,
              },
            },
          },
        },
      },
    });

    return dbLocations.map((loc) => {
      // Tìm sản phẩm lưu trữ từ thông tin tồn kho
      const firstInventory = loc.ton_kho?.[0];
      const productName = firstInventory?.lo_san_pham?.san_pham?.TenSanPham;

      return {
        MaViTri: loc.MaViTri,
        KhuVuc: loc.KhuVuc,
        Ke: loc.Ke,
        Tang: loc.Tang,
        MaViTriCha: loc.MaViTriCha,
        TrangThai: loc.TrangThai,
        SanPhamLuuTru: productName || undefined,
      };
    });
  }

  async createMany(data: { KhuVuc: string; Ke: string; Tang: string; TrangThai?: string }[]) {
    return this.prisma.vi_tri_kho.createMany({
      data: data.map((item) => ({
        KhuVuc: item.KhuVuc,
        Ke: item.Ke,
        Tang: item.Tang,
        TrangThai: item.TrangThai || 'Trong',
      })),
    });
  }

  async deleteShelf(khuVuc: string, ke: string) {
    return this.prisma.vi_tri_kho.deleteMany({
      where: {
        KhuVuc: khuVuc,
        Ke: ke,
      },
    });
  }

  async deleteLayer(khuVuc: string, tang: string) {
    return this.prisma.vi_tri_kho.deleteMany({
      where: {
        KhuVuc: khuVuc,
        Tang: tang,
      },
    });
  }
}
