// Kiến thức văn hóa BỔ SUNG cho prompt AI (ngắn, trung tính, không số liệu cụ thể).
// ⚠️ TOÀN BỘ mục ở đây ở trạng thái "CHỜ KHÁCH XÁC MINH" — xem docs/CULTURE_REVIEW.md.
// Không khẳng định tuyệt đối; không rập khuôn ngoại hình theo dân tộc.
// Lưu ý: nguồn chính vẫn là bảng EthnicGroup (DB). File này chỉ bổ sung chi tiết có thể dạy được.

export interface CultureFact {
  id: string;
  vi: string;
  en: string; // câu tiếng Anh đơn giản dùng làm "hạt giống" cho lời thoại
  keywords: string[]; // từ tiếng Anh hữu ích gắn với mục này
}

export const CULTURE_FACTS: Record<string, CultureFact[]> = {
  kho: [
    {
      id: "kho-brocade",
      vi: "Phụ nữ K'Ho dệt thổ cẩm bằng khung dệt; hoa văn thường là các hình hình học.",
      en: "K'Ho women weave brocade on a loom. The patterns are often geometric shapes.",
      keywords: ["loom", "thread", "pattern", "brocade"],
    },
    {
      id: "kho-gong",
      vi: "Cồng chiêng được đánh trong các lễ hội cộng đồng; không gian văn hóa cồng chiêng Tây Nguyên được UNESCO ghi danh.",
      en: "People play gongs at community festivals. UNESCO recognizes the gong culture of the Central Highlands.",
      keywords: ["gong", "festival", "community", "music"],
    },
    {
      id: "kho-basket",
      vi: "Gùi đan bằng tre, mây dùng để đeo trên lưng mang củi, rau và lúa.",
      en: "A basket made of bamboo and rattan is carried on the back for firewood, vegetables and rice.",
      keywords: ["basket", "bamboo", "carry", "back"],
    },
    {
      id: "kho-rice-bamboo",
      vi: "Cơm lam là gạo nếp nấu trong ống tre trên bếp lửa.",
      en: "Bamboo rice is sticky rice cooked inside a bamboo tube over a fire.",
      keywords: ["bamboo", "sticky rice", "fire", "cook"],
    },
    {
      id: "kho-jar",
      vi: "Rượu cần được uống chung trong lễ hội, mọi người cùng hút qua cần tre.",
      en: "At festivals, people sit together and share jar drink with long bamboo straws.",
      keywords: ["jar", "straw", "share", "together"],
    },
  ],
  ma: [
    {
      id: "ma-forest",
      vi: "Người Mạ sống gần rừng; rừng cho cây thuốc, rau, mây tre và nước suối.",
      en: "The Ma people live near the forest. The forest gives plants, bamboo, rattan and clean stream water.",
      keywords: ["forest", "plant", "stream", "bamboo"],
    },
    {
      id: "ma-elder",
      vi: "Già làng là người hiểu phong tục và kể chuyện xưa cho con cháu.",
      en: "A village elder knows the old customs and tells stories to the children.",
      keywords: ["elder", "story", "custom", "village"],
    },
    {
      id: "ma-indigo",
      vi: "Người Mạ có trang phục màu chàm và vải thổ cẩm dệt thủ công.",
      en: "Ma clothes can be indigo blue, and the brocade cloth is woven by hand.",
      keywords: ["indigo", "cloth", "weave", "hand"],
    },
    {
      id: "ma-basket",
      vi: "Đan lát mây tre là nghề quen thuộc: gùi, rổ, nia.",
      en: "Weaving with bamboo and rattan is a common craft. People make baskets and trays.",
      keywords: ["craft", "basket", "tray", "rattan"],
    },
    {
      id: "ma-stream-ceremony",
      vi: "Lễ cúng bến nước thể hiện lòng biết ơn nguồn nước của buôn làng.",
      en: "The water place ceremony shows thanks for the water that the village uses.",
      keywords: ["water", "ceremony", "thanks", "village"],
    },
  ],
  mnong: [
    {
      id: "mnong-elephant",
      vi: "Người M'Nông có truyền thống gắn bó với voi; voi giúp chở gỗ và đồ đạc.",
      en: "The M'Nong people have a long tradition with elephants. Elephants help carry wood and heavy things.",
      keywords: ["elephant", "carry", "tradition", "heavy"],
    },
    {
      id: "mnong-epic",
      vi: "Người M'Nông có sử thi truyền miệng, như sử thi Ot Ndrong, được hát kể trong cộng đồng.",
      en: "The M'Nong people sing long epic stories, like Ot Ndrong, to the community.",
      keywords: ["epic", "story", "sing", "community"],
    },
    {
      id: "mnong-mother",
      vi: "Xã hội M'Nông truyền thống theo mẫu hệ: con mang họ mẹ.",
      en: "Traditional M'Nong families follow the mother's line. Children take their mother's family name.",
      keywords: ["mother", "family", "name", "tradition"],
    },
    {
      id: "mnong-geopark",
      vi: "Đắk Nông có Công viên địa chất toàn cầu UNESCO với nhiều hang động núi lửa và thác nước.",
      en: "Dak Nong has a UNESCO Global Geopark with volcanic caves and waterfalls.",
      keywords: ["cave", "waterfall", "volcano", "geopark"],
    },
    {
      id: "mnong-craft",
      vi: "Đan gùi, dệt thổ cẩm và tạc tượng gỗ là những nghề thủ công của người M'Nông.",
      en: "Making baskets, weaving brocade and carving wooden statues are M'Nong crafts.",
      keywords: ["basket", "weave", "carve", "wood"],
    },
  ],
  hmong: [
    {
      id: "hmong-khen",
      vi: "Khèn là nhạc cụ làm từ nhiều ống trúc ghép lại, thổi và múa cùng lúc.",
      en: "The khen is a musical instrument made of bamboo pipes. People play it and dance at the same time.",
      keywords: ["khen", "pipe", "bamboo", "dance"],
    },
    {
      id: "hmong-embroidery",
      vi: "Phụ nữ H'Mông thêu hoa văn rực rỡ lên váy, áo và khăn.",
      en: "H'Mong women embroider colorful patterns on skirts, shirts and scarves.",
      keywords: ["embroider", "colorful", "skirt", "needle"],
    },
    {
      id: "hmong-wax",
      vi: "Vẽ sáp ong lên vải rồi nhuộm chàm để tạo hoa văn.",
      en: "People draw with beeswax on cloth and then dye it blue. The wax keeps the pattern white.",
      keywords: ["wax", "dye", "cloth", "pattern"],
    },
    {
      id: "hmong-linen",
      vi: "Vải lanh được dệt từ sợi cây lanh (gai dầu).",
      en: "Linen cloth is woven from plant fibers.",
      keywords: ["linen", "fiber", "plant", "weave"],
    },
    {
      id: "hmong-corn",
      vi: "Mèn mén là món ăn làm từ bột ngô, quen thuộc ở vùng cao.",
      en: "Men men is a dish made from corn flour. Many highland families eat it.",
      keywords: ["corn", "flour", "dish", "highland"],
    },
  ],
  tay: [
    {
      id: "tay-stilt",
      vi: "Nhà sàn của người Tày làm bằng gỗ, có sàn cao để tránh ẩm và thú dữ; dưới sàn thường để củi hoặc nuôi gia súc.",
      en: "A Tay stilt house is made of wood. The floor is high, and people keep firewood below.",
      keywords: ["stilt house", "wood", "floor", "stairs"],
    },
    {
      id: "tay-then",
      vi: "Hát Then và đàn tính của người Tày, Nùng, Thái được UNESCO ghi danh năm 2019.",
      en: "Then singing and the tinh lute are important Tay music. UNESCO recognized them in 2019.",
      keywords: ["lute", "sing", "music", "string"],
    },
    {
      id: "tay-longtong",
      vi: "Lễ hội Lồng Tồng tổ chức vào mùa xuân, cầu mùa màng tốt tươi.",
      en: "The Long Tong festival happens in spring. People ask for a good harvest.",
      keywords: ["festival", "spring", "harvest", "field"],
    },
    {
      id: "tay-indigo",
      vi: "Áo chàm dài là trang phục truyền thống của người Tày.",
      en: "A long indigo shirt is traditional clothing of the Tay people.",
      keywords: ["indigo", "shirt", "traditional", "clothes"],
    },
    {
      id: "tay-rice",
      vi: "Xôi ngũ sắc nấu từ gạo nếp nhuộm màu bằng lá và hoa rừng.",
      en: "Five-color sticky rice gets its colors from leaves and flowers.",
      keywords: ["sticky rice", "color", "leaf", "flower"],
    },
  ],
  nung: [
    {
      id: "nung-then",
      vi: "Người Nùng hát Then và gảy đàn tính; hát Then kể chuyện và gửi lời chúc tốt đẹp.",
      en: "The Nung people sing Then and play the tinh lute. The songs tell stories and send good wishes.",
      keywords: ["lute", "song", "story", "wish"],
    },
    {
      id: "nung-indigo",
      vi: "Người Nùng nhuộm vải chàm màu xanh đậm để may áo.",
      en: "The Nung people dye cloth with indigo to make deep blue shirts.",
      keywords: ["indigo", "dye", "cloth", "blue"],
    },
    {
      id: "nung-cake",
      vi: "Bánh khảo là bánh làm từ bột gạo rang, thường có trong dịp lễ Tết.",
      en: "Banh khao is a sweet cake made from roasted rice flour. Families often eat it at festivals.",
      keywords: ["cake", "rice", "sweet", "festival"],
    },
    {
      id: "nung-rice",
      vi: "Người Nùng có truyền thống trồng lúa nước trên ruộng bậc thang.",
      en: "The Nung people grow rice in wet fields. Some fields look like steps on a hill.",
      keywords: ["rice", "field", "hill", "grow"],
    },
    {
      id: "nung-paper",
      vi: "Giấy bản là loại giấy thủ công làm từ vỏ cây.",
      en: "Handmade paper can be made from tree bark.",
      keywords: ["paper", "bark", "handmade", "tree"],
    },
  ],
};

export function cultureFactsBlock(slug: string | undefined): string {
  const facts = slug ? CULTURE_FACTS[slug] : undefined;
  if (!facts?.length) return "";
  return `KIEN THUC BO SUNG (chua duoc khach xac minh, dung trung tinh, khong them chi tiet):
${facts.map(f => `- ${f.vi} | EN: ${f.en} | tu huu ich: ${f.keywords.join(", ")}`).join("\n")}`;
}
