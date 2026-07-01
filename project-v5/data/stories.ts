import type { Story } from "@/types";

export const STORIES: Story[] = [
  {
    id: "story-001",
    title: { vi: "Ngày hội của làng", en: "The Village Festival" },
    level: 2,
    ethnic_culture: "K'Ho",
    color: "#E8643A",
    emoji: "🌄",
    description_vi:
      "Bé Ya Đin tham dự Lễ hội mừng lúa mới của người K'Ho, học từ vựng về màu sắc, nhạc cụ và lời chào hỏi.",
    vocabulary: [
      { en: "festival", vi: "lễ hội" },
      { en: "village", vi: "làng" },
      { en: "traditional", vi: "truyền thống" },
      { en: "costume", vi: "trang phục" },
      { en: "drum", vi: "trống" },
      { en: "dance", vi: "nhảy múa" },
      { en: "harvest", vi: "mùa gặt" },
      { en: "happy", vi: "vui vẻ" },
      { en: "together", vi: "cùng nhau" },
      { en: "music", vi: "âm nhạc" },
    ],
    panels: [
      {
        id: 1,
        bg: "#FFF3E0",
        scene: "morning_village",
        dialogue: [
          {
            character: "Ya Đin",
            vi: "Hôm nay là ngày hội của làng!",
            en: "Today is our village festival!",
          },
        ],
      },
      {
        id: 2,
        bg: "#E8F5E9",
        scene: "costume",
        dialogue: [
          {
            character: "Mẹ",
            vi: "Mặc trang phục truyền thống nào, con!",
            en: "Put on your traditional costume!",
          },
          {
            character: "Ya Đin",
            vi: "Đẹp quá mẹ ơi!",
            en: "It is so beautiful, Mom!",
          },
        ],
      },
      {
        id: 3,
        bg: "#FFF8E1",
        scene: "drum",
        dialogue: [
          {
            character: "Ông Già",
            vi: "Tiếng trống vang lên, lễ hội bắt đầu!",
            en: "The drum sounds – the festival begins!",
          },
        ],
      },
      {
        id: 4,
        bg: "#FCE4EC",
        scene: "dance",
        dialogue: [
          {
            character: "Ya Đin",
            vi: "Chúng mình cùng nhảy múa nào!",
            en: "Let us dance together!",
          },
          {
            character: "Bạn K'Lang",
            vi: "Vui quá! Âm nhạc hay lắm!",
            en: "So happy! The music is great!",
          },
        ],
      },
      {
        id: 5,
        bg: "#E3F2FD",
        scene: "harvest",
        dialogue: [
          {
            character: "Bố",
            vi: "Đây là lễ mừng mùa gặt của làng ta.",
            en: "This is our village harvest festival.",
          },
          {
            character: "Ya Đin",
            vi: "Con hiểu rồi! Cảm ơn bố!",
            en: "I understand! Thank you, Dad!",
          },
        ],
      },
    ],
    quiz: [
      {
        question_en: "What is today?",
        options: [
          "A school day",
          "The village festival",
          "A market day",
          "A rainy day",
        ],
        answer: 1,
      },
      {
        question_en: "What does Ya Đin put on?",
        options: [
          "School uniform",
          "Rain coat",
          "Traditional costume",
          "Pajamas",
        ],
        answer: 2,
      },
      {
        question_en: "What makes the festival start?",
        options: ["A bell", "The drum", "A whistle", "A song"],
        answer: 1,
      },
      {
        question_en: "What does 'harvest' mean in Vietnamese?",
        options: ["lễ hội", "âm nhạc", "mùa gặt", "trang phục"],
        answer: 2,
      },
    ],
    missions: [
      {
        id: "story-001-mission-1",
        type: "select",
        title: "Khám phá nhạc cụ K'Ho",
        prompt: "Nhạc cụ nào dưới đây là nhạc cụ truyền thống của người K'Ho?",
        options: [
          { id: "a", label: "Cồng chiêng", emoji: "🥁", correct: true },
          { id: "b", label: "Đàn guitar", emoji: "🎸", correct: false },
          { id: "c", label: "Trống jazz", emoji: "🪘", correct: false },
        ],
        fact: "Cồng chiêng là nhạc cụ quan trọng trong các lễ hội của người K'Ho, thường được sử dụng trong Lễ hội mừng lúa mới.",
      },
      {
        id: "story-001-mission-2",
        type: "info",
        title: "Lễ hội mừng lúa mới",
        prompt: "Tìm hiểu ý nghĩa của Lễ hội mừng lúa mới đối với người K'Ho.",
        fact: "Lễ hội mừng lúa mới là dịp người K'Ho tạ ơn thần linh sau một mùa vụ bội thu, thường tổ chức cồng chiêng và múa hát cùng cả buôn làng.",
      },
    ],
  },
  {
    id: "story-002",
    title: { vi: "Rừng thông của chúng mình", en: "Our Pine Forest" },
    level: 1,
    ethnic_culture: "Mạ",
    color: "#2E7D32",
    emoji: "🌲",
    description_vi:
      "Bé K'Lang và bạn đi dạo trong rừng thông Đà Lạt, khám phá thiên nhiên.",
    vocabulary: [
      { en: "forest", vi: "rừng" },
      { en: "tree", vi: "cây" },
      { en: "bird", vi: "chim" },
      { en: "butterfly", vi: "bướm" },
      { en: "green", vi: "màu xanh lá" },
      { en: "tall", vi: "cao" },
      { en: "fly", vi: "bay" },
      { en: "run", vi: "chạy" },
    ],
    panels: [
      {
        id: 1,
        bg: "#E8F5E9",
        scene: "forest_entrance",
        dialogue: [
          {
            character: "K'Lang",
            vi: "Chúng mình vào rừng thông thôi!",
            en: "Let's go into the pine forest!",
          },
        ],
      },
      {
        id: 2,
        bg: "#F1F8E9",
        scene: "big_tree",
        dialogue: [
          {
            character: "K'Lang",
            vi: "Ồ! Cái cây này cao quá!",
            en: "Oh! This tree is so tall!",
          },
          {
            character: "Bạn Ami",
            vi: "Và xanh lắm nữa!",
            en: "And so green!",
          },
        ],
      },
      {
        id: 3,
        bg: "#E0F2F1",
        scene: "birds",
        dialogue: [
          {
            character: "Ami",
            vi: "Nhìn kìa! Đàn chim đang bay!",
            en: "Look! The birds are flying!",
          },
          {
            character: "K'Lang",
            vi: "Đẹp quá! Chúng bay thật nhẹ nhàng.",
            en: "So beautiful! They fly so gently.",
          },
        ],
      },
      {
        id: 4,
        bg: "#FFF9C4",
        scene: "butterfly",
        dialogue: [
          {
            character: "K'Lang",
            vi: "Con bướm! Con chạy theo nào!",
            en: "A butterfly! Let me run after it!",
          },
          {
            character: "Ami",
            vi: "Ha ha! Con bướm bay nhanh hơn bạn đó!",
            en: "Ha ha! The butterfly flies faster than you!",
          },
        ],
      },
    ],
    quiz: [
      {
        question_en: "Where do K'Lang and Ami go?",
        options: [
          "To school",
          "To the market",
          "Into the pine forest",
          "To the river",
        ],
        answer: 2,
      },
      {
        question_en: "What do they see flying in the sky?",
        options: ["Butterflies", "Birds", "Kites", "Bees"],
        answer: 1,
      },
      {
        question_en: "What does 'tall' mean?",
        options: ["nhỏ", "cao", "xanh", "bay"],
        answer: 1,
      },
      {
        question_en: "What does K'Lang run after?",
        options: ["A bird", "A frog", "A butterfly", "A rabbit"],
        answer: 2,
      },
    ],
    missions: [
      {
        id: "story-002-mission-1",
        type: "select",
        title: "Khám phá lễ hội của người Mạ",
        prompt: "Lễ hội nào dưới đây là lễ hội truyền thống của người Mạ?",
        options: [
          { id: "a", label: "Lễ hội đâm trâu", emoji: "🐃", correct: true },
          { id: "b", label: "Lễ hội Trung thu", emoji: "🥮", correct: false },
          { id: "c", label: "Lễ Phục sinh", emoji: "🐰", correct: false },
        ],
        fact: "Lễ hội đâm trâu là một nghi lễ quan trọng của người Mạ, thể hiện lòng biết ơn với thần linh và cầu mong mùa màng bội thu.",
      },
    ],
  },
  {
    id: "story-003",
    title: { vi: "Chợ phiên vùng cao", en: "The Highland Market" },
    level: 3,
    ethnic_culture: "H'Mông",
    color: "#7B1FA2",
    emoji: "🧵",
    description_vi:
      "Cô bé Mỷ theo mẹ ra chợ phiên, tập mua bán và hỏi giá bằng tiếng Anh.",
    vocabulary: [
      { en: "market", vi: "chợ" },
      { en: "buy", vi: "mua" },
      { en: "sell", vi: "bán" },
      { en: "how much", vi: "bao nhiêu tiền" },
      { en: "expensive", vi: "đắt" },
      { en: "cheap", vi: "rẻ" },
      { en: "basket", vi: "giỏ" },
      { en: "cloth", vi: "vải" },
      { en: "vegetable", vi: "rau củ" },
      { en: "colorful", vi: "nhiều màu sắc" },
      { en: "bargain", vi: "mặc cả" },
      { en: "pay", vi: "trả tiền" },
    ],
    panels: [
      {
        id: 1,
        bg: "#F3E5F5",
        scene: "market_morning",
        dialogue: [
          {
            character: "Mỷ",
            vi: "Mẹ ơi! Chợ phiên hôm nay đông vui quá!",
            en: "Mom! The market is so lively today!",
          },
        ],
      },
      {
        id: 2,
        bg: "#FFF3E0",
        scene: "cloth_stall",
        dialogue: [
          {
            character: "Mỷ",
            vi: "Cuộn vải này đẹp và nhiều màu sắc quá!",
            en: "This cloth is so beautiful and colorful!",
          },
          {
            character: "Người bán",
            vi: "Cảm ơn em! Vải thổ cẩm H'Mông đó.",
            en: "Thank you! It is H'Mong brocade cloth.",
          },
        ],
      },
      {
        id: 3,
        bg: "#E8F5E9",
        scene: "vegetable_stall",
        dialogue: [
          {
            character: "Mẹ",
            vi: "Bao nhiêu tiền một kg rau, cô ơi?",
            en: "How much for one kilogram of vegetables?",
          },
          {
            character: "Người bán",
            vi: "Mười nghìn thôi, rẻ lắm!",
            en: "Only ten thousand, very cheap!",
          },
        ],
      },
      {
        id: 4,
        bg: "#FFF8E1",
        scene: "bargain",
        dialogue: [
          {
            character: "Mỷ",
            vi: "Cái giỏ này đắt quá. Mình có thể mặc cả không mẹ?",
            en: "This basket is expensive. Can we bargain, Mom?",
          },
          {
            character: "Mẹ",
            vi: "Được chứ! Đó là cách mua sắm ở chợ phiên.",
            en: "Sure! That is how we shop at the market.",
          },
        ],
      },
      {
        id: 5,
        bg: "#E3F2FD",
        scene: "paying",
        dialogue: [
          {
            character: "Mỷ",
            vi: "Con trả tiền nhé mẹ! Con học được rồi!",
            en: "Let me pay, Mom! I learned how!",
          },
          {
            character: "Mẹ",
            vi: "Giỏi lắm con! Con gái mẹ lớn rồi đó.",
            en: "Well done! My daughter is growing up.",
          },
        ],
      },
    ],
    quiz: [
      {
        question_en: "Where does Mỷ go with her mom?",
        options: [
          "To school",
          "To the highland market",
          "To the forest",
          "To a festival",
        ],
        answer: 1,
      },
      {
        question_en: "What does 'how much' mean in Vietnamese?",
        options: ["đắt tiền", "bao nhiêu tiền", "trả tiền", "mặc cả"],
        answer: 1,
      },
      {
        question_en: "What is 'cloth' in Vietnamese?",
        options: ["giỏ", "rau củ", "vải", "chợ"],
        answer: 2,
      },
      {
        question_en: "What does Mỷ want to do at the end?",
        options: [
          "Run away",
          "Pay the money herself",
          "Go home",
          "Buy more vegetables",
        ],
        answer: 1,
      },
    ],
    missions: [
      {
        id: "story-003-mission-1",
        type: "select",
        title: "Khám phá trang phục H'Mông",
        prompt:
          "Trang phục truyền thống của người H'Mông thường có đặc điểm gì?",
        options: [
          {
            id: "a",
            label: "Váy xòe thổ cẩm nhiều màu",
            emoji: "👗",
            correct: true,
          },
          { id: "b", label: "Áo vest công sở", emoji: "🤵", correct: false },
          { id: "c", label: "Áo dài trắng", emoji: "👘", correct: false },
        ],
        fact: "Người H'Mông nổi tiếng với váy xòe thổ cẩm nhiều màu sắc và kỹ thuật vẽ sáp ong độc đáo trên vải.",
      },
      {
        id: "story-003-mission-2",
        type: "info",
        title: "Chợ phiên vùng cao",
        prompt: "Tìm hiểu về chợ phiên — nơi diễn ra câu chuyện của Mỷ.",
        fact: "Chợ phiên là nơi giao thương, gặp gỡ quan trọng của đồng bào vùng cao, thường họp theo định kỳ và bán nhiều sản vật địa phương.",
      },
    ],
  },
];

export const SCENE_EMOJIS: Record<string, string> = {
  morning_village: "🌅",
  costume: "👘",
  drum: "🥁",
  dance: "💃",
  harvest: "🌾",
  forest_entrance: "🌲",
  big_tree: "🌳",
  birds: "🐦",
  butterfly: "🦋",
  market_morning: "🏪",
  cloth_stall: "🧵",
  vegetable_stall: "🥬",
  bargain: "🤝",
  paying: "💰",
};
