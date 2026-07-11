import { Controller, Get, Post, Body, Delete, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async findAll() {
    return this.locationsService.findAll();
  }

  @Post()
  async createMany(
    @Body() data: { KhuVuc: string; Ke: string; Tang: string; TrangThai?: string }[],
  ) {
    return this.locationsService.createMany(data);
  }

  @Delete('shelf')
  async deleteShelf(
    @Query('khuVuc') khuVuc: string,
    @Query('ke') ke: string,
  ) {
    return this.locationsService.deleteShelf(khuVuc, ke);
  }

  @Delete('layer')
  async deleteLayer(
    @Query('khuVuc') khuVuc: string,
    @Query('tang') tang: string,
  ) {
    return this.locationsService.deleteLayer(khuVuc, tang);
  }
}
