// 업비트 계좌 정보
export interface UpbitAccount {
  currency: string;
  balance: string;
  locked: string;
  avg_buy_price: string;
  avg_buy_price_modified: boolean;
  unit_currency: string;
}

// 업비트 현재가 (Ticker)
export interface UpbitTicker {
  market: string;
  trade_date: string;
  trade_time: string;
  trade_price: number;
  trade_volume: number;
  prev_closing_price: number;
  change_price: number;
  change_rate: number;
  change: string;
  signed_change_price: number;
  signed_change_rate: number;
  acc_trade_price: number;
  acc_trade_price_24h: number;
  acc_trade_volume: number;
  acc_trade_volume_24h: number;
  highest_52_week_price: number;
  lowest_52_week_price: number;
  timestamp: number;
}

// 업비트 캔들
export interface UpbitCandle {
  market: string;
  candle_date_time_utc: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  timestamp: number;
  candle_acc_trade_price: number;
  candle_acc_trade_volume: number;
}

// 업비트 호가
export interface UpbitOrderbook {
  market: string;
  timestamp: number;
  total_ask_size: number;
  total_bid_size: number;
  orderbook_units: {
    ask_price: number;
    bid_price: number;
    ask_size: number;
    bid_size: number;
  }[];
}

// 업비트 주문 응답
export interface UpbitOrder {
  uuid: string;
  side: string;
  ord_type: string;
  price: string | null;
  state: string;
  market: string;
  created_at: string;
  volume: string;
  remaining_volume: string;
  executed_volume: string;
  trades_count: number;
  paid_fee: string;
  locked: string;
}

// 마켓 정보
export interface UpbitMarket {
  market: string;
  korean_name: string;
  english_name: string;
}
