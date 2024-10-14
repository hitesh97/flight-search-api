export interface Flight {
  id: number;
  flightNumber: string;
  airline: string;
  departureTime: Date;
  arrivalTime: Date;
  price: number;
  departureCity: string;
  destinationCity: string;
  distance: number; // Distance in kilometers
  co2Emissions?: number; // Optional, calculated later based on distance
}
