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
    slug: "hmong",
    nameVi: "H'Mông",
    nameEn: "H'Mong",
    emoji: "🌈",
    description:
      "Người H'Mông nổi tiếng với nghề thêu và dệt vải lanh, trang phục thổ cẩm rực rỡ và các phiên chợ vùng cao đặc sắc.",
    costume: [
      "Váy xòe thổ cẩm nhiều màu",
      "Áo thêu hoa văn",
      "Trang sức bạc truyền thống",
    ],
    festivals: [
      "Lễ hội Gầu Tào",
      "Tết truyền thống H'Mông",
      "Chợ phiên vùng cao",
    ],
    instruments: ["Khèn H'Mông", "Đàn môi", "Sáo Mèo"],
    crafts: ["Vẽ sáp ong trên vải", "Dệt lanh", "Thêu thùa"],
    cuisine: ["Thắng cố", "Mèn mén", "Rượu ngô"],
    locations: ["Đắk Nông", "Hà Giang", "Cao nguyên đá Đồng Văn"],
    architecture:
      "Traditional houses built with wooden frames and thatched roofs, adapted to highland conditions.",
  },
  {
    slug: "tay",
    nameVi: "Tày",
    nameEn: "Tày",
    emoji: "🏞️",
    description:
      "Người Tày sinh sống tại các thung lũng miền núi với nền văn hóa nông nghiệp lâu đời, nổi bật với nhà sàn và lễ hội Lồng Tồng.",
    costume: [
      "Áo chàm dài truyền thống",
      "Khăn vấn đầu",
      "Thắt lưng thêu hoa văn",
    ],
    festivals: ["Lễ hội Lồng Tồng", "Lễ hội Nàng Hai", "Tết Nguyên đán"],
    instruments: ["Đàn tính", "Trống", "Chiêng"],
    crafts: ["Dệt thổ cẩm", "Đan lát", "Làm bánh truyền thống"],
    cuisine: ["Xôi ngũ sắc", "Thịt lợn quay", "Bánh chưng đen"],
    locations: ["Đắk Nông", "Cao Bằng", "Bắc Kạn"],
    architecture:
      "Traditional stilt houses (nhà sàn) built with wood, spacious and well-adapted to highland terrain.",
  },
  {
    slug: "nung",
    nameVi: "Nùng",
    nameEn: "Nùng",
    emoji: "🎵",
    description:
      "Người Nùng có truyền thống canh tác lúa nước và nghề dệt vải chàm đặc sắc, nổi bật với hát Then và đàn tính được UNESCO công nhận.",
    costume: [
      "Áo chàm năm thân",
      "Khăn đội đầu truyền thống",
      "Trang phục nhuộm chàm",
    ],
    festivals: ["Lễ hội Lồng Tồng", "Lễ cầu mùa", "Các hội xuân địa phương"],
    instruments: ["Đàn tính", "Kèn lá", "Trống sành"],
    crafts: ["Dệt vải chàm", "Làm giấy bản", "Rèn nông cụ"],
    cuisine: ["Khâu nhục", "Bánh khảo", "Rượu men lá"],
    locations: ["Đắk Nông", "Lạng Sơn", "Cao Bằng"],
    architecture:
      "Traditional stilt houses or earthen wall houses, using natural local materials.",
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
