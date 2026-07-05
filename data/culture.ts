import type { CulturalGroupData } from "@/types";

export const CULTURAL_GROUPS: CulturalGroupData[] = [
  {
    slug: "kho",
    nameVi: "K'Ho",
    nameEn: "K'Ho",
    emoji: "🌄",
    description:
      "Người K'Ho sinh sống chủ yếu tại Lâm Đồng, có đời sống gắn với núi rừng Tây Nguyên và không gian văn hóa cồng chiêng đặc sắc.",
    costume: [
      "Trang phục dệt thổ cẩm truyền thống",
      "Khố truyền thống (nam)",
      "Trang sức hạt cườm",
    ],
    festivals: ["Lễ mừng lúa mới", "Lễ hội cồng chiêng", "Lễ cúng thần rừng"],
    instruments: ["Cồng chiêng", "Sáo tre", "Trống truyền thống"],
    crafts: ["Dệt thổ cẩm", "Đan gùi", "Đan lát", "Chạm khắc gỗ"],
    cuisine: ["Cơm lam", "Rượu cần", "Canh bồi"],
    locations: ["Lạc Dương", "Đam Rông", "Di Linh", "Lâm Đồng"],
    architecture:
      "Traditional stilt houses built with wood and bamboo, adapted to the highland climate.",
  },
  {
    slug: "ma",
    nameVi: "Mạ",
    nameEn: "Ma'",
    emoji: "🌲",
    description:
      "Người Mạ sinh sống lâu đời ở khu vực Nam Tây Nguyên, có đời sống gắn với rừng, nương rẫy và văn hóa cộng đồng bền chặt.",
    costume: ["Áo chàm truyền thống", "Váy quấn thổ cẩm", "Gùi đeo vai"],
    festivals: [
      "Traditional Buffalo Offering Ceremony",
      "Lễ cúng bến nước",
      "Lễ mừng nhà mới",
    ],
    instruments: ["Cồng chiêng", "Sáo tre", "Trống truyền thống"],
    crafts: ["Đan lát mây tre", "Dệt thổ cẩm", "Đan gùi"],
    cuisine: ["Cá suối nướng", "Rau rừng", "Rượu cần"],
    locations: ["Cát Tiên", "Lâm Đồng", "Lưu vực sông Đồng Nai"],
    architecture:
      "Traditional stilt houses built with bamboo, rattan and forest wood.",
  },
  {
    slug: "mnong",
    nameVi: "M'Nông",
    nameEn: "Mnong",
    emoji: "🐘",
    description:
      "Người M'Nông là cộng đồng tiêu biểu của Tây Nguyên, nổi bật với văn hóa thuần dưỡng voi, không gian cồng chiêng và các sử thi dân gian.",
    costume: ["Khố và áo thổ cẩm", "Vòng tay đồng", "Khăn choàng truyền thống"],
    festivals: [
      "Lễ hội đua voi Buôn Đôn",
      "Lễ cúng sức khỏe cho voi",
      "Lễ hội cồng chiêng",
    ],
    instruments: ["Cồng chiêng", "Đàn đá", "Trống lớn"],
    crafts: ["Đan gùi", "Tạc tượng gỗ", "Dệt thổ cẩm"],
    cuisine: ["Cơm lam", "Thịt nướng ống tre", "Canh thụt"],
    locations: ["Đắk Lắk", "Đắk Nông", "Buôn Đôn"],
    architecture:
      "Traditional stilt houses; community longhouses used for important ceremonies.",
  },
  {
    slug: "ede",
    nameVi: "Ê Đê",
    nameEn: "Ê Đê",
    emoji: "🏛️",
    description:
      "Người Ê Đê là dân tộc lớn của Tây Nguyên, nổi bật với nhà dài truyền thống, văn hóa mẫu hệ và sử thi Đam San huyền thoại.",
    costume: [
      "Váy thổ cẩm truyền thống (nữ)",
      "Khố thổ cẩm (nam)",
      "Vòng tay đồng và hạt cườm",
    ],
    festivals: [
      "Lễ hội cồng chiêng Tây Nguyên",
      "Lễ bỏ mả (Pơthi)",
      "Lễ cúng bến nước",
    ],
    instruments: ["Cồng chiêng", "Đàn goong", "Kèn đinh tút"],
    crafts: ["Dệt thổ cẩm", "Đan gùi", "Chạm khắc gỗ"],
    cuisine: ["Cơm lam", "Rượu cần", "Thịt nướng ống tre"],
    locations: ["Đắk Lắk", "Buôn Ma Thuột", "Đắk Nông"],
    architecture:
      "Traditional longhouses (nhà dài) stretching up to 100 meters, home to matrilineal extended families.",
  },
  {
    slug: "giarai",
    nameVi: "Gia Rai",
    nameEn: "Gia Rai",
    emoji: "⛺",
    description:
      "Người Gia Rai là dân tộc đông dân nhất Tây Nguyên, sống theo chế độ mẫu hệ với truyền thống cồng chiêng và nghề điêu khắc nhà mồ độc đáo.",
    costume: [
      "Váy thổ cẩm màu đỏ đen (nữ)",
      "Khố dệt thổ cẩm (nam)",
      "Trang sức đồng và hạt cườm",
    ],
    festivals: ["Lễ bỏ mả (Pơthi)", "Lễ mừng lúa mới", "Lễ hội cồng chiêng"],
    instruments: ["Cồng chiêng", "Đàn T'rưng", "Đàn Klông pút"],
    crafts: ["Điêu khắc nhà mồ", "Dệt thổ cẩm", "Đan gùi mây tre"],
    cuisine: ["Cơm lam", "Rượu ghè", "Gà nướng muối ớt rừng"],
    locations: ["Gia Lai", "Kon Tum", "Pleiku"],
    architecture:
      "Communal stilt houses (nhà rông) at the heart of each village, used for community meetings and ceremonies.",
  },
  {
    slug: "bana",
    nameVi: "Ba Na",
    nameEn: "Ba Na",
    emoji: "🪵",
    description:
      "Người Ba Na là một trong những dân tộc bản địa lâu đời nhất Tây Nguyên, nổi bật với nhà rông đặc trưng và nền nghệ thuật điêu khắc gỗ phong phú.",
    costume: [
      "Váy thổ cẩm đen đỏ (nữ)",
      "Khố dệt tay (nam)",
      "Vòng cổ hạt cườm nhiều tầng",
    ],
    festivals: ["Lễ hội mừng lúa mới", "Lễ đâm trâu", "Lễ hội cồng chiêng"],
    instruments: ["Cồng chiêng", "Đàn T'rưng", "Đàn Klông pút"],
    crafts: ["Chạm khắc gỗ", "Dệt thổ cẩm", "Đan lát mây tre"],
    cuisine: ["Cơm lam", "Rượu cần", "Lá mì xào"],
    locations: ["Kon Tum", "Gia Lai", "Bình Định"],
    architecture:
      "Iconic communal house (nhà rông) with a high thatched roof, the spiritual and social center of each village.",
  },
];

export function getCulturalGroup(
  slugOrName: string,
): CulturalGroupData | undefined {
  const key = slugOrName.toLowerCase().replace(/['']/g, "");
  return CULTURAL_GROUPS.find(
    g => g.slug === key || g.nameVi.toLowerCase().replace(/['']/g, "") === key,
  );
}
