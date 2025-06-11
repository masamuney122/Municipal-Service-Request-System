import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { LatLngLiteral } from 'leaflet';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface LocationPickerProps {
  onLocationSelect: (location: LatLngLiteral, address?: any) => void;
  center?: LatLngLiteral;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, center }) => {
  const [markerPosition, setMarkerPosition] = useState<LatLngLiteral | null>(null);

  // Component to handle map center updates
  const MapCenterUpdater = () => {
    const map = useMap();
    
    useEffect(() => {
      if (center) {
        map.setView([center.lat, center.lng], map.getZoom());
        setMarkerPosition(center);
      }
    }, [center, map]);

    return null;
  };

  const findClosestStreet = async (lat: number, lng: number) => {
    try {
      // Search in a larger radius (0.002 degrees is roughly 200 meters)
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=&lat=${lat}&lon=${lng}&radius=0.002&featuretype=street&addressdetails=1&limit=1`
      );
      
      if (response.data && response.data.length > 0) {
        const closestStreet = response.data[0];
        return {
          street: closestStreet.display_name.split(',')[0] || '',
          lat: parseFloat(closestStreet.lat),
          lng: parseFloat(closestStreet.lon),
          address: closestStreet.address
        };
      }
      return null;
    } catch (error) {
      console.error('Error finding closest street:', error);
      return null;
    }
  };

  const findNearbyAddress = async (lat: number, lng: number) => {
    try {
      // Search for any nearby address features
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=&lat=${lat}&lon=${lng}&radius=0.002&addressdetails=1&limit=1`
      );
      
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null;
    } catch (error) {
      console.error('Error finding nearby address:', error);
      return null;
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // First try to get address from exact location
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      const address = response.data.address;
      let street = address.road || address.pedestrian || address.path || address.footway || '';
      let city = address.city || address.town || address.village || address.municipality || '';
      let district = address.county || address.district || address.suburb || address.neighbourhood || '';
      let zipCode = address.postcode || '';
      let finalLat = lat;
      let finalLng = lng;

      // If any field is missing, try to find a nearby address
      if (!street || !city || !district) {
        const closestStreet = await findClosestStreet(lat, lng);
        if (closestStreet) {
          street = street || closestStreet.street;
          finalLat = closestStreet.lat;
          finalLng = closestStreet.lng;
          
          // Use address details from closest street if still missing
          if (closestStreet.address) {
            city = city || closestStreet.address.city || closestStreet.address.town || closestStreet.address.village || '';
            district = district || closestStreet.address.county || closestStreet.address.district || closestStreet.address.suburb || '';
            zipCode = zipCode || closestStreet.address.postcode || '';
          }
        }

        // If still missing information, try to find any nearby address
        if (!city || !district) {
          const nearbyAddress = await findNearbyAddress(lat, lng);
          if (nearbyAddress && nearbyAddress.address) {
            city = city || nearbyAddress.address.city || nearbyAddress.address.town || nearbyAddress.address.village || '';
            district = district || nearbyAddress.address.county || nearbyAddress.address.district || nearbyAddress.address.suburb || '';
            zipCode = zipCode || nearbyAddress.address.postcode || '';
          }
        }
      }

      // If still no street found, use the display name from the reverse geocoding
      if (!street && response.data.display_name) {
        const parts = response.data.display_name.split(',');
        street = parts[0] || '';
      }
      
      return {
        street: street || 'Unknown Street',
        city: city || 'Unknown City',
        state: district || 'Unknown District',
        zipCode: zipCode || '',
        coordinates: {
          lat: finalLat,
          lng: finalLng
        }
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Return default values if geocoding fails
      return {
        street: 'Unknown Street',
        city: 'Unknown City',
        state: 'Unknown District',
        zipCode: '',
        coordinates: {
          lat: lat,
          lng: lng
        }
      };
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      async click(e) {
        const newLoc = { lat: e.latlng.lat, lng: e.latlng.lng };
        setMarkerPosition(newLoc);
        
        // Get address details
        const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        if (address) {
          // Update marker position if we found a closest street
          if (address.coordinates) {
            setMarkerPosition({ lat: address.coordinates.lat, lng: address.coordinates.lng });
            onLocationSelect({ lat: address.coordinates.lat, lng: address.coordinates.lng }, address);
          } else {
            onLocationSelect(newLoc, address);
          }
        }
      },
    });
    return null;
  };

  return (
    <MapContainer center={[38.4237, 27.1428]} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler />
      <MapCenterUpdater />
      {markerPosition && <Marker position={markerPosition} />}
    </MapContainer>
  );
};

export default LocationPicker;

