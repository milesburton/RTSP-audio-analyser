/**
 * Maps YAMNet sound classifications to appropriate emojis
 */
export const emojiMap: Record<string, string> = {
    // Human sounds
    "Speech": "🗣️",
    "Child speech, kid speaking": "🗣️🧒",
    "Conversation": "💬",
    "Narration, monologue": "📖",
    "Babbling": "👶",
    "Shout": "😡",
    "Screaming": "😱",
    "Whispering": "🤫",
    "Laughter": "😄",
    "Baby laughter": "👶😄",
    "Crying, sobbing": "😢",
    "Baby cry, infant cry": "👶😢",
    "Sigh": "😔",
    "Singing": "🎤",
    "Male singing": "👨🎤",
    "Female singing": "👩🎤",
    "Child singing": "🧒🎤",
    "Whistling": "😗",
    "Cough": "😷",
    "Sneeze": "🤧",
    "Sniff": "👃",
    "Run": "🏃",
    "Walk, footsteps": "👣",
    "Clapping": "👏",
    "Cheering": "🙌",
    "Crowd": "👥",
    "Children playing": "🧒👦👧",
    
    // Animal sounds
    "Animal": "🐾",
    "Dog": "🐕",
    "Bark": "🐕‍🦺",
    "Yip": "🐶",
    "Howl": "🐺",
    "Growling": "😠🐕",
    "Cat": "🐈",
    "Purr": "😺",
    "Meow": "😽",
    "Hiss": "🙀",
    "Horse": "🐎",
    "Neigh, whinny": "🐴",
    "Cattle, bovinae": "🐄",
    "Moo": "🐮",
    "Pig": "🐖",
    "Oink": "🐷",
    "Goat": "🐐",
    "Bleat": "🐑",
    "Sheep": "🐑",
    "Chicken, rooster": "🐓",
    "Cluck": "🐔",
    "Duck": "🦆",
    "Quack": "🦆",
    "Bird": "🐦",
    "Bird vocalization, bird call, bird song": "🐦🎵",
    "Chirp, tweet": "🐤",
    "Owl": "🦉",
    "Frog": "🐸",
    "Insect": "🐜",
    "Mosquito": "🦟",
    "Fly, housefly": "🪰",
    "Buzz": "🐝",
    "Bee, wasp, etc.": "🐝",
  
    // Music and instruments
    "Music": "🎵",
    "Musical instrument": "🎸",
    "Guitar": "🎸",
    "Piano": "🎹",
    "Drum": "🥁",
    "Saxophone": "🎷",
    "Trumpet": "🎺",
    "Violin, fiddle": "🎻",
    "Flute": "🎶",
    "Bell": "🔔",
    "Accordion": "🪗",
  
    // Vehicles
    "Vehicle": "🚗",
    "Boat, Water vehicle": "🚢",
    "Ship": "🛳️",
    "Motor vehicle (road)": "🛣️",
    "Car": "🚙",
    "Vehicle horn, car horn, honking": "📯",
    "Car alarm": "🚨🚗",
    "Tire squeal": "🛞",
    "Truck": "🚚",
    "Bus": "🚌",
    "Police car (siren)": "🚓",
    "Ambulance (siren)": "🚑",
    "Fire engine, fire truck (siren)": "🚒",
    "Motorcycle": "🏍️",
    "Train": "🚆",
    "Helicopter": "🚁",
    "Airplane": "✈️",
    "Bicycle": "🚲",
  
    // Nature sounds
    "Wind": "💨",
    "Thunderstorm": "⛈️",
    "Thunder": "🌩️",
    "Rain": "🌧️",
    "Water": "💧",
    "Stream": "🏞️",
    "Waterfall": "🌊",
    "Ocean": "🌊",
    "Fire": "🔥",
  
    // Home sounds
    "Door": "🚪",
    "Doorbell": "🔔",
    "Knock": "✊",
    "Tap": "👆",
    "Squeak": "🔊",
    "Dishes, pots, and pans": "🍽️",
    "Microwave oven": "🔄",
    "Blender": "🧇",
    "Vacuum cleaner": "🧹",
    "Water tap, faucet": "🚿",
    "Toilet flush": "🚽",
    "Typing": "⌨️",
    "Telephone": "📞",
    "Telephone bell ringing": "☎️",
    "Ringtone": "📱",
    "Alarm clock": "⏰",
    "Clock": "🕰️",
    "Mechanical fan": "🌀",
    "Air conditioning": "❄️",
    "Printer": "🖨️",
    "Camera": "📷",
  
    // Alerts and alarms
    "Alarm": "🚨",
    "Siren": "🚨",
    "Civil defense siren": "📢",
    "Smoke detector, smoke alarm": "🔥🔔",
    "Fire alarm": "🔥🚨",
    "Buzzer": "🔊",
  
    // Tools and machinery
    "Engine": "⚙️",
    "Chainsaw": "🪚",
    "Drill": "🔨",
    "Hammer": "🔨",
    "Sawing": "🪚",
    "Power tool": "🔌",
  
    // Impacts and explosions
    "Explosion": "💥",
    "Gunshot, gunfire": "🔫",
    "Fireworks": "🎆",
    "Boom": "💥",
    "Glass": "🪟",
    "Shatter": "💔",
    "Breaking": "💔",
    "Crash": "💥",
    "Thump, thud": "👊",
  
    // Various sounds
    "Beep, bleep": "🔊",
    "Static": "📺",
    "White noise": "🌫️",
    "Silence": "🤫",
    "Echo": "🔊🔊",
    "Television": "📺",
    "Radio": "📻",
    
    // Error states
    "error": "❌",
    "insufficient_data": "📉",
    "preprocessing_error": "🔧",
    "unknown_class": "❓"
  };
  
  /**
   * Get an emoji for a sound label
   * @param label Sound label from YAMNet
   * @param fallbackEmoji Emoji to use if label isn't in the map
   * @returns Appropriate emoji for the sound
   */
  export function getEmojiForLabel(label: string, fallbackEmoji = "❓"): string {
    return emojiMap[label] || fallbackEmoji;
  }