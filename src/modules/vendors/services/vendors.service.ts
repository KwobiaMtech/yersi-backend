import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { VendorsRepository } from "../repositories/vendors.repository";
import { SearchVendorsDto } from "../dto/vendor.dto";
import { Vendor } from "../schemas/vendor.schema";
import { LocationService } from "../../location/services/location.service";
import { OrdersRepository } from "../../orders/repositories/orders.repository";
import { Order } from "src/modules/orders/schemas/order.schema";

@Injectable()
export class VendorsService {
  constructor(
    private vendorsRepository: VendorsRepository,
    @Inject(forwardRef(() => LocationService))
    private locationService: LocationService,
    @Inject(forwardRef(() => OrdersRepository))
    private ordersRepository: OrdersRepository,
  ) {}

  async create(vendorData: Partial<Vendor>): Promise<Vendor> {
    return this.vendorsRepository.create(vendorData);
  }

  async searchVendors(searchDto: SearchVendorsDto): Promise<any> {
    let userLat: number;
    let userLng: number;

    // If orderId is provided, use order's pickup address
    if (searchDto.orderId) {
      const order = await this.ordersRepository.findById(searchDto.orderId);
      console.log("Order found:", order?._id);
      console.log("Pickup address:", JSON.stringify(order?.pickupAddress));
      if (order?.pickupAddress?.latitude && order?.pickupAddress?.longitude) {
        userLat = order.pickupAddress.latitude;
        userLng = order.pickupAddress.longitude;
        console.log("Using order coordinates:", { userLat, userLng });
      } else {
        throw new Error('Order pickup address does not have valid coordinates');
      }
    }
    // Get user coordinates from different input methods if orderId not provided
    else if (searchDto.latitude && searchDto.longitude) {
      userLat = searchDto.latitude;
      userLng = searchDto.longitude;
    } else if (searchDto.placeId) {
      const location = await this.locationService.getPlaceDetails(
        searchDto.placeId,
      );
      userLat = location.latitude;
      userLng = location.longitude;
    } else if (searchDto.address) {
      const location = await this.locationService.geocodeAddress(
        searchDto.address,
      );
      userLat = location.latitude;
      userLng = location.longitude;
    } else {
      // Return all vendors without location filtering
      const vendors = await this.vendorsRepository.findAll(
        searchDto.serviceId,
      );
      return this.formatVendorResponse(vendors, searchDto);
    }

    // Search vendors near the user location
    const vendors = await this.vendorsRepository.findNearby(
      userLng,
      userLat,
      searchDto.serviceId,
      searchDto.radius,
    );

    console.log("vendors found 1:", vendors.length);

    // Calculate actual road distance using Google Maps batch API
    if (vendors.length > 0) {
      const destinations = vendors.map(vendor => ({
        lat: vendor.location.coordinates[1],
        lng: vendor.location.coordinates[0],
      }));

      const distances = await this.locationService.calculateDistanceBatch(
        userLat,
        userLng,
        destinations,
      );

      const vendorsWithDistance = vendors.map((vendor, index) => ({
        ...vendor,
        distanceKm: distances[index].distance,
        distance: distances[index].distance,
        distanceText: distances[index].distanceText,
        duration: distances[index].duration,
        durationText: distances[index].durationText,
        distanceStatus: distances[index].status,
      }));

      return this.formatVendorResponse(vendorsWithDistance, searchDto, {
        userLat,
        userLng,
      });
    }

    return this.formatVendorResponse(vendors, searchDto, { userLat, userLng });
  }

  async getVendorById(id: string): Promise<Vendor | null> {
    return this.vendorsRepository.findById(id);
  }

  async getVendorWithServices(id: string): Promise<any> {
    const result = await this.vendorsRepository.findWithServices(id);
    return result[0] || null;
  }

  async getVendorsByService(serviceId: string): Promise<any> {
    const vendors = await this.vendorsRepository.findByService(serviceId);
    return {
      vendors,
      total: vendors.length,
      serviceId,
    };
  }

  async getVendorServices(vendorId: string): Promise<any> {
    const services =
      await this.vendorsRepository.findServicesOfferedByVendor(vendorId);
    return {
      vendorId,
      services,
      total: services.length,
    };
  }

  private formatVendorResponse(
    vendors: any[],
    searchDto: SearchVendorsDto,
    userLocation?: { userLat: number; userLng: number },
  ) {
    // Sort vendors
    let sortedVendors = [...vendors];

    switch (searchDto.sortBy) {
      case "rating":
        sortedVendors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "name":
        sortedVendors.sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );
        break;
      case "distance":
      default:
        if (searchDto.includeDistance) {
          sortedVendors.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
        break;
    }

    const response: any = {
      vendors: sortedVendors,
      total: sortedVendors.length,
      searchCriteria: {
        radius: searchDto.radius,
        serviceId: searchDto.serviceId,
        sortBy: searchDto.sortBy,
        includeDistance: searchDto.includeDistance,
      },
    };

    if (userLocation) {
      response.userLocation = {
        latitude: userLocation.userLat,
        longitude: userLocation.userLng,
      };
    }

    if (sortedVendors.length === 0) {
      response.message =
        "No vendors found in your area. Try increasing the search radius or removing service filters.";
      response.suggestions = [
        "Increase search radius to 20km",
        "Remove service type filter",
        "Check if your location is correct",
      ];
    }

    return response;
  }
}
