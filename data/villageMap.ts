// Dữ liệu 6 điểm học trên bản đồ làng Tây Nguyên
// Nội dung: truyện kể ngôi thứ ba, song ngữ Anh–Việt
// Tọa độ: % từ góc trên-trái của ảnh bản đồ 1920x1080

export interface MapVocabulary { en: string; vi: string; }

export interface MapStoryPanel {
  panelId: number;
  illustrationHint: string;
  en: string;
  vi: string;
}

export interface MapQuiz {
  question_en: string;
  options: string[];
  answer: number;
}

export interface MapFunFact { en: string; vi: string; }

export interface VillageMapPoint {
  id: string;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  mapPosition: { x: number; y: number };
  emoji: string;
  ethnicSlug: string;
  xpReward: number;
  story: MapStoryPanel[];
  vocabulary: MapVocabulary[];
  quiz: MapQuiz;
  funFact: MapFunFact;
}

export const VILLAGE_MAP_POINTS: VillageMapPoint[] = [
  {
    id: "kho_weaving",
    titleVi: "Hành trình của tấm thổ cẩm K'Ho",
    titleEn: "The Journey of K'Ho Brocade",
    descriptionVi: "Theo chân một tấm thổ cẩm K'Ho từ màu nhuộm tự nhiên đến khung cửi.",
    mapPosition: { x: 13.0, y: 68.0 },
    emoji: "🧵",
    ethnicSlug: "kho",
    xpReward: 25,
    story: [
      {
        panelId: 1,
        illustrationHint: "A K'Ho woman and child walking through a green highland forest, looking at plants used for natural dyes, warm morning light.",
        en: "Ya Đin walks through the forest with her mother. They look for plants that give natural colors.",
        vi: "Ya Đin đi trong rừng cùng mẹ. Hai mẹ con tìm những loại cây có thể tạo ra màu nhuộm tự nhiên.",
      },
      {
        panelId: 2,
        illustrationHint: "Close-up of K'Ho hands preparing plant dye and dipping thread into a natural indigo-colored dye bath.",
        en: "Her mother uses plant dyes to color the thread. The indigo dye makes the thread deep blue.",
        vi: "Mẹ dùng màu nhuộm từ cây để nhuộm sợi chỉ. Màu chàm làm cho sợi chỉ có màu xanh đậm.",
      },
      {
        panelId: 3,
        illustrationHint: "Inside a traditional K'Ho stilt house, a woman carefully weaving colorful patterned cloth on a traditional loom.",
        en: "At home, the thread moves slowly across the loom. Careful hands create beautiful geometric patterns.",
        vi: "Về nhà, những sợi chỉ được đưa qua khung cửi thật chậm. Đôi bàn tay khéo léo tạo nên những hoa văn hình học đẹp mắt.",
      },
      {
        panelId: 4,
        illustrationHint: "A finished K'Ho brocade cloth displayed proudly inside a traditional highland home, with the child admiring its colorful patterns.",
        en: "After many hours, the cloth is finally ready. The colorful patterns carry memories of K'Ho life and nature.",
        vi: "Sau nhiều giờ, tấm vải cuối cùng cũng hoàn thành. Những hoa văn nhiều màu sắc lưu giữ ký ức về cuộc sống và thiên nhiên của người K'Ho.",
      },
    ],
    vocabulary: [
      { en: "forest", vi: "rừng" },
      { en: "plant", vi: "cây" },
      { en: "dye", vi: "nhuộm / màu nhuộm" },
      { en: "thread", vi: "sợi chỉ" },
      { en: "loom", vi: "khung cửi" },
      { en: "pattern", vi: "hoa văn" },
    ],
    quiz: {
      question_en: "What makes the thread deep blue?",
      options: ["Indigo dye", "River water", "Yellow flowers", "Red clay"],
      answer: 0,
    },
    funFact: {
      en: "K'Ho textile traditions use natural materials and geometric designs that connect people with their environment.",
      vi: "Nghề dệt truyền thống của người K'Ho sử dụng vật liệu tự nhiên và những hoa văn hình học gắn với con người và môi trường sống.",
    },
  },
  {
    id: "ma_forest",
    titleVi: "Buổi sáng trong rừng Mạ",
    titleEn: "A Morning in the Mạ Forest",
    descriptionVi: "Pơ Mai theo Ama K'Bram vào rừng và khám phá kiến thức về cây cỏ.",
    mapPosition: { x: 20.0, y: 32.0 },
    emoji: "🌿",
    ethnicSlug: "ma",
    xpReward: 25,
    story: [
      {
        panelId: 1,
        illustrationHint: "A young Mạ girl walking with an elderly Mạ village elder through a lush old forest, with a clear stream nearby.",
        en: "Pơ Mai enters the forest with Ama K'Bram. A small stream flows beside the quiet path.",
        vi: "Pơ Mai vào rừng cùng Ama K'Bram. Một con suối nhỏ chảy bên con đường yên tĩnh.",
      },
      {
        panelId: 2,
        illustrationHint: "The Mạ elder carefully showing the child different forest plants, with birds and butterflies among tall trees.",
        en: "Ama K'Bram shows Pơ Mai several useful forest plants. He teaches her to observe leaves, roots, and flowers.",
        vi: "Ama K'Bram chỉ cho Pơ Mai nhiều loại cây rừng có ích. Ông dạy em quan sát lá, rễ và hoa.",
      },
      {
        panelId: 3,
        illustrationHint: "A small forest animal hiding among leaves while the child and elder observe quietly from a safe distance.",
        en: "They hear birds and see a small animal nearby. Pơ Mai learns to watch wildlife without disturbing it.",
        vi: "Hai ông cháu nghe tiếng chim và nhìn thấy một con vật nhỏ gần đó. Pơ Mai học cách quan sát động vật mà không làm chúng hoảng sợ.",
      },
      {
        panelId: 4,
        illustrationHint: "The Mạ child and elder walking home through the forest, leaving plants untouched and carrying only a small basket.",
        en: "Before leaving, Ama K'Bram reminds Pơ Mai to respect the forest. The forest gives people many gifts, so people must protect it.",
        vi: "Trước khi rời đi, Ama K'Bram nhắc Pơ Mai phải tôn trọng rừng. Rừng mang đến nhiều món quà cho con người, nên con người phải bảo vệ rừng.",
      },
    ],
    vocabulary: [
      { en: "forest", vi: "rừng" },
      { en: "stream", vi: "suối" },
      { en: "plant", vi: "cây" },
      { en: "observe", vi: "quan sát" },
      { en: "wildlife", vi: "động vật hoang dã" },
      { en: "protect", vi: "bảo vệ" },
    ],
    quiz: {
      question_en: "What does Ama K'Bram teach Pơ Mai to protect?",
      options: ["The forest", "The market", "The rice field", "The road"],
      answer: 0,
    },
    funFact: {
      en: "The Mạ have long passed traditional knowledge about forests and useful plants between generations.",
      vi: "Người Mạ từ lâu đã truyền lại kiến thức truyền thống về rừng và các loài cây có ích qua nhiều thế hệ.",
    },
  },
  {
    id: "mnong_elephant",
    titleVi: "Voi và tiếng cồng chiêng M'Nông",
    titleEn: "M'Nông Elephants and Gongs",
    descriptionVi: "N'Thao khám phá mối quan hệ đặc biệt giữa người M'Nông và những chú voi.",
    mapPosition: { x: 43.5, y: 26.0 },
    emoji: "🐘",
    ethnicSlug: "mnong",
    xpReward: 30,
    story: [
      {
        panelId: 1,
        illustrationHint: "A young M'Nông boy arriving at a lively morning festival, with villagers gathering in traditional clothing.",
        en: "N'Thao arrives at the festival early in the morning. Many families gather together in colorful traditional clothing.",
        vi: "N'Thao đến lễ hội từ sáng sớm. Nhiều gia đình cùng tụ họp trong những bộ trang phục truyền thống nhiều màu sắc.",
      },
      {
        panelId: 2,
        illustrationHint: "A friendly elephant standing near the festival area while a young M'Nông boy watches with wonder from a safe distance.",
        en: "Then N'Thao sees an elephant near the festival ground. He feels amazed because this is his first close view.",
        vi: "Sau đó, N'Thao nhìn thấy một con voi gần sân lễ hội. Em rất ngạc nhiên vì đây là lần đầu em được nhìn voi ở khoảng cách gần như vậy.",
      },
      {
        panelId: 3,
        illustrationHint: "M'Nông villagers playing gongs together at a cultural gathering, with the elephant calmly nearby.",
        en: "The gongs begin to sound across the village. The music brings people together during important community celebrations.",
        vi: "Tiếng cồng chiêng bắt đầu vang lên khắp làng. Âm nhạc gắn kết mọi người trong những dịp lễ quan trọng của cộng đồng.",
      },
      {
        panelId: 4,
        illustrationHint: "A M'Nông family gently caring for an elephant near a green river landscape in Đắk Nông.",
        en: "Y Điớp explains that elephants are important in M'Nông culture. People care for them and respect their special place in community life.",
        vi: "Y Điớp giải thích rằng voi có vị trí quan trọng trong văn hóa M'Nông. Người dân chăm sóc và tôn trọng voi trong đời sống cộng đồng.",
      },
    ],
    vocabulary: [
      { en: "festival", vi: "lễ hội" },
      { en: "family", vi: "gia đình" },
      { en: "elephant", vi: "voi" },
      { en: "gongs", vi: "cồng chiêng" },
      { en: "music", vi: "âm nhạc" },
      { en: "respect", vi: "tôn trọng" },
    ],
    quiz: {
      question_en: "What is important in M'Nông community celebrations?",
      options: ["Gong music", "Snow games", "Boat races", "Fireworks"],
      answer: 0,
    },
    funFact: {
      en: "In M'Nông culture, elephants have been valued as important family property and also hold spiritual meaning.",
      vi: "Trong văn hóa M'Nông, voi từng được xem là tài sản quan trọng của gia đình và cũng có ý nghĩa trong đời sống tinh thần.",
    },
  },
  {
    id: "hmong_textile",
    titleVi: "Sắc màu chợ phiên H'Mông",
    titleEn: "Colors at the H'Mông Market",
    descriptionVi: "Sùng Mỷ cùng bố khám phá những màu sắc rực rỡ của trang phục và thổ cẩm H'Mông.",
    mapPosition: { x: 75.5, y: 32.0 },
    emoji: "🌈",
    ethnicSlug: "hmong",
    xpReward: 25,
    story: [
      {
        panelId: 1,
        illustrationHint: "A young H'Mông girl walking with her father through a lively highland market, surrounded by colorful traditional clothing and textiles.",
        en: "Sùng Mỷ visits a highland market with her father. Bright clothes and colorful textiles fill the busy market.",
        vi: "Sùng Mỷ đi chợ phiên vùng cao cùng bố. Những bộ quần áo rực rỡ và các tấm vải nhiều màu sắc làm khu chợ thêm nhộn nhịp.",
      },
      {
        panelId: 2,
        illustrationHint: "Close-up of H'Mông embroidered textile with detailed geometric patterns, while the father explains the craft to his daughter.",
        en: "Her father shows her beautiful embroidered patterns. Each careful stitch takes time and patience.",
        vi: "Bố chỉ cho em những hoa văn thêu rất đẹp. Mỗi mũi thêu cẩn thận đều cần thời gian và sự kiên nhẫn.",
      },
      {
        panelId: 3,
        illustrationHint: "H'Mông women and girls displaying handmade textiles and traditional clothing at a colorful market stall.",
        en: "Sùng Mỷ notices many different colors and patterns. She learns that textile skills can pass from mothers to daughters.",
        vi: "Sùng Mỷ nhận ra có rất nhiều màu sắc và hoa văn khác nhau. Em biết rằng kỹ năng làm vải có thể được truyền từ mẹ sang con gái.",
      },
      {
        panelId: 4,
        illustrationHint: "The girl and her father leaving the colorful highland market, with textiles and mountains visible in the background.",
        en: "At the end, Sùng Mỷ chooses a small colorful cloth. She hopes to learn these careful skills when she grows older.",
        vi: "Cuối buổi chợ, Sùng Mỷ chọn một mảnh vải nhỏ nhiều màu sắc. Em mong sau này sẽ học được những kỹ năng khéo léo ấy.",
      },
    ],
    vocabulary: [
      { en: "market", vi: "chợ" },
      { en: "clothes", vi: "quần áo" },
      { en: "textiles", vi: "vải dệt" },
      { en: "embroidered", vi: "thêu" },
      { en: "pattern", vi: "hoa văn" },
      { en: "stitch", vi: "mũi thêu" },
    ],
    quiz: {
      question_en: "What does Sùng Mỷ see at the highland market?",
      options: ["Colorful textiles", "Snowy boats", "Tall skyscrapers", "Ocean animals"],
      answer: 0,
    },
    funFact: {
      en: "H'Mông textile traditions include handwork such as embroidery and natural dyeing, with skills passed through generations.",
      vi: "Truyền thống dệt may của người H'Mông có các kỹ thuật thủ công như thêu và nhuộm màu tự nhiên, được truyền qua nhiều thế hệ.",
    },
  },
  {
    id: "tay_stilthouse",
    titleVi: "Một ngày trong nhà sàn Tày",
    titleEn: "A Day in a Tày Stilt House",
    descriptionVi: "Lường Khánh giúp bà dọn nhà sàn và khám phá không gian sống của gia đình Tày.",
    mapPosition: { x: 83.5, y: 68.8 },
    emoji: "🏡",
    ethnicSlug: "tay",
    xpReward: 25,
    story: [
      {
        panelId: 1,
        illustrationHint: "A young Tày girl and her grandmother standing outside a traditional wooden stilt house, with green rice fields beyond.",
        en: "Lường Khánh helps her grandmother clean their traditional stilt house. Green rice fields stretch beyond the wooden stairs.",
        vi: "Lường Khánh giúp bà dọn dẹp ngôi nhà sàn truyền thống. Những ruộng lúa xanh trải dài phía ngoài cầu thang gỗ.",
      },
      {
        panelId: 2,
        illustrationHint: "Inside a traditional Tày stilt house, the grandmother and girl cleaning a warm family living space with wooden furniture.",
        en: "Inside, the family shares a large living space. The house is raised above the ground on strong wooden stilts.",
        vi: "Bên trong, gia đình cùng sinh hoạt trong một không gian rộng rãi. Ngôi nhà được nâng cao trên những chiếc cột gỗ chắc chắn.",
      },
      {
        panelId: 3,
        illustrationHint: "The girl helping her grandmother arrange household objects, with woven baskets and everyday tools inside the stilt house.",
        en: "Lường Khánh puts the baskets and household objects in their places. Her grandmother teaches her to keep the home neat.",
        vi: "Lường Khánh đặt những chiếc giỏ và đồ dùng trong nhà vào đúng chỗ. Bà dạy em giữ cho ngôi nhà luôn gọn gàng.",
      },
      {
        panelId: 4,
        illustrationHint: "The girl and grandmother sitting on the wooden stilt house veranda, looking peacefully over green rice fields.",
        en: "When the work ends, they sit on the wooden floor together. They look across the rice fields and enjoy the quiet morning.",
        vi: "Khi công việc xong, hai bà cháu cùng ngồi trên sàn gỗ. Họ nhìn ra những ruộng lúa và tận hưởng buổi sáng yên bình.",
      },
    ],
    vocabulary: [
      { en: "stilt house", vi: "nhà sàn" },
      { en: "clean", vi: "dọn dẹp" },
      { en: "wooden", vi: "bằng gỗ" },
      { en: "ground", vi: "mặt đất" },
      { en: "baskets", vi: "những chiếc giỏ" },
      { en: "rice fields", vi: "ruộng lúa" },
    ],
    quiz: {
      question_en: "Why is a traditional stilt house raised above the ground?",
      options: [
        "It suits local terrain and living conditions",
        "It is built for airplanes",
        "It keeps snow inside",
        "It is used as a boat",
      ],
      answer: 0,
    },
    funFact: {
      en: "Traditional Tày houses often use natural materials and create a shared space for family life.",
      vi: "Nhà sàn truyền thống của người Tày thường sử dụng vật liệu tự nhiên và tạo không gian chung cho sinh hoạt gia đình.",
    },
  },
  {
    id: "nung_music",
    titleVi: "Tiếng Then và đàn tính Nùng",
    titleEn: "Nùng Then and the Tính Lute",
    descriptionVi: "Lâm Bảo khám phá tiếng hát Then và đàn tính qua lời kể của bà Then Lan.",
    mapPosition: { x: 49.5, y: 73.8 },
    emoji: "🎵",
    ethnicSlug: "nung",
    xpReward: 30,
    story: [
      {
        panelId: 1,
        illustrationHint: "An elderly Nùng woman performing Then music with a tính lute in a peaceful village yard, while a young boy watches.",
        en: "One afternoon, Lâm Bảo watches his grandmother perform Then music. Her tính lute makes a gentle sound.",
        vi: "Một buổi chiều, Lâm Bảo xem bà biểu diễn Then. Tiếng đàn tính của bà vang lên nhẹ nhàng.",
      },
      {
        panelId: 2,
        illustrationHint: "Close-up of the grandmother's hands playing the three-string tính lute, with the boy listening carefully.",
        en: "Bà Then Lan plucks the strings and sings a Then song. Lâm Bảo listens carefully to every sound.",
        vi: "Bà Then Lan gảy những sợi dây và hát một bài Then. Lâm Bảo chăm chú lắng nghe từng âm thanh.",
      },
      {
        panelId: 3,
        illustrationHint: "The grandmother wearing traditional Nùng ceremonial clothing while performing, with subtle cultural decorations in the yard.",
        en: "Then music connects songs, stories, and spiritual traditions. It can be part of important ceremonies and community life.",
        vi: "Then kết nối những bài hát, câu chuyện và truyền thống tinh thần. Then có thể xuất hiện trong các nghi lễ quan trọng và đời sống cộng đồng.",
      },
      {
        panelId: 4,
        illustrationHint: "The grandmother gently teaching the young boy about the tính lute, showing how cultural knowledge passes to a younger generation.",
        en: "Lâm Bảo wants to learn the tính lute one day. His grandmother smiles because traditions continue through younger generations.",
        vi: "Lâm Bảo muốn một ngày nào đó được học đàn tính. Bà mỉm cười vì những truyền thống vẫn tiếp tục được trao truyền cho thế hệ trẻ.",
      },
    ],
    vocabulary: [
      { en: "perform", vi: "biểu diễn" },
      { en: "lute", vi: "đàn" },
      { en: "sound", vi: "âm thanh" },
      { en: "strings", vi: "dây đàn" },
      { en: "song", vi: "bài hát" },
      { en: "traditions", vi: "truyền thống" },
    ],
    quiz: {
      question_en: "What instrument does Bà Then Lan play?",
      options: ["A tính lute", "A drum", "A flute", "A gong"],
      answer: 0,
    },
    funFact: {
      en: "Practices of Then among Tày, Nùng, and Thái communities were inscribed by UNESCO in 2019.",
      vi: "Thực hành Then của cộng đồng Tày, Nùng và Thái được UNESCO ghi danh vào Danh sách Di sản văn hóa phi vật thể đại diện của nhân loại năm 2019.",
    },
  },
];
