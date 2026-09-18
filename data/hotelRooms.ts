export const hotelRoomsByFloor = {
  "1st Floor": ["1", "2", "3", "101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111"],
  "2nd Floor": ["201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "211"],
  "3rd Floor": ["301", "302", "303", "304", "305", "306", "307", "308", "309", "310", "311"],
  "4th Floor": ["401", "402", "403", "404"],
} as const;

export const hotelRoomCount = Object.values(hotelRoomsByFloor).flat().length;
