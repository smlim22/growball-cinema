// TypeScript types for POS system

export interface CartItem {
  id: string; // Unique identifier for cart item
  type: 'ticket' | 'fnb';
  name: string;
  quantity: number;
  price: number; // Total price for this item (price * quantity)
  unitPrice?: number; // Price per unit (for display)
  
  // Ticket-specific fields
  movieId?: number;
  movieName?: string;
  showtimeId?: number;
  showtime?: {
    date: string;
    time: string;
  };
  seats?: string[];
  ticketBreakdown?: {
    adult: number;
    senior: number;
    child: number;
  };
  
  // F&B specific fields
  fnbId?: number;
  fnbType?: string; // Food or Beverage
}

export interface FnbItem {
  fnb_id: number;
  fnb_name: string;
  fnb_desc: string;
  type: string;
  price: number;
}

export interface Movie {
  movie_id: number;
  movie_name: string;
  // Add other movie fields as needed
}

export interface Showtime {
  showtime_id: number;
  movie_id: number;
  date: string;
  time: string;
  hall_id: number;
  status: string;
  adult_price: number;
  child_price: number;
  senior_price: number;
}

