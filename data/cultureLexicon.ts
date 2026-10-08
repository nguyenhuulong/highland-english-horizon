// Từ điển văn hóa (VI → EN) cho EthnicModal: nhấn vào từ để xem nghĩa tiếng Anh + nghe phát âm.
// Cấu trúc dữ liệu tách khỏi component. scripts/check-lexicon.ts báo mục nào trong data/culture.ts chưa có từ điển.
// ⚠️ Nội dung giải nghĩa chờ khách xác minh (xem docs/CULTURE_REVIEW.md).
import { CULTURE_LEXICON_EXTRA } from "@/data/cultureLexiconExtra";

export interface LexiconEntry {
  en: string;
  meaning: string;
  usage: string;
}

const BASE_LEXICON: Record<string, LexiconEntry> = {
  // Lễ hội
  "Lễ mừng lúa mới": { en: "Rice Harvest Festival", meaning: "Lễ tạ ơn sau mùa thu hoạch", usage: "The Rice Harvest Festival is one of the most important celebrations in the Central Highlands." },
  "Lễ hội cồng chiêng": { en: "Festival of Gong Culture", meaning: "Lễ hội tôn vinh văn hóa cồng chiêng", usage: "The Festival of Gong Culture celebrates the unique heritage of the Central Highlands." },
  "Lễ hội cồng chiêng Tây Nguyên": { en: "Central Highlands Gong Festival", meaning: "Lễ hội cồng chiêng toàn Tây Nguyên", usage: "The Central Highlands Gong Festival is recognized by UNESCO as intangible heritage." },
  "Lễ cúng thần rừng": { en: "Forest Spirit Ceremony", meaning: "Nghi lễ cầu bình an và bảo vệ rừng", usage: "Villagers gather for the Forest Spirit Ceremony every spring." },
  "Lễ cúng bến nước": { en: "Water Source Ceremony", meaning: "Nghi lễ tạ ơn nguồn nước", usage: "The Water Source Ceremony gives thanks for clean water." },
  "Lễ cúng sức khỏe cho voi": { en: "Elephant Health Ceremony", meaning: "Nghi lễ cúng sức khỏe cho voi", usage: "The Elephant Health Ceremony shows the special bond between the Mnong people and elephants." },
  "Traditional Buffalo Offering Ceremony": { en: "Buffalo Offering Ceremony", meaning: "Nghi lễ hiến sinh trâu truyền thống", usage: "The Buffalo Offering Ceremony is held during important community celebrations." },
  "Lễ đâm trâu": { en: "Buffalo Offering Ceremony", meaning: "Nghi lễ hiến sinh trâu truyền thống", usage: "The Buffalo Offering Ceremony is held during important community celebrations." },
  "Lễ bỏ mả (Pơthi)": { en: "Pơthi Ceremony", meaning: "Nghi lễ tiễn đưa người đã khuất", usage: "The Pơthi Ceremony is an important cultural tradition of highland communities." },
  "Lễ hội đua voi Buôn Đôn": { en: "Buon Don Elephant Racing Festival", meaning: "Lễ hội đua voi truyền thống", usage: "The Buon Don Elephant Racing Festival attracts visitors from across Vietnam." },
  "Lễ mừng nhà mới": { en: "New House Ceremony", meaning: "Lễ khánh thành nhà ở mới", usage: "The New House Ceremony brings the whole community together to celebrate." },
  "Lễ hội mừng lúa mới": { en: "New Rice Harvest Festival", meaning: "Lễ mừng vụ lúa mới", usage: "The New Rice Harvest Festival marks the end of the farming season." },

  // Nhạc cụ
  "Cồng chiêng": { en: "Gong ensemble", meaning: "Bộ nhạc cụ cồng chiêng truyền thống", usage: "The gong ensemble is played during important ceremonies." },
  "Sáo tre": { en: "Bamboo flute", meaning: "Sáo làm bằng tre", usage: "He plays a beautiful melody on the bamboo flute." },
  "Trống truyền thống": { en: "Traditional drum", meaning: "Trống dùng trong lễ hội", usage: "The traditional drum signals the start of the ceremony." },
  "Trống lớn": { en: "Large ceremonial drum", meaning: "Trống lớn dùng trong lễ hội", usage: "The large ceremonial drum can be heard throughout the village." },
  "Đàn đá": { en: "Lithophone", meaning: "Nhạc cụ gõ bằng đá cổ", usage: "The lithophone is one of the oldest musical instruments in the world." },
  "Đàn goong": { en: "Goong lute", meaning: "Đàn dây truyền thống của người Tây Nguyên", usage: "The Goong lute is a traditional string instrument played at ceremonies." },
  "Kèn đinh tút": { en: "Dinh Tut horn", meaning: "Kèn truyền thống của một số dân tộc Tây Nguyên", usage: "The Dinh Tut horn is a traditional wind instrument used during ceremonies." },
  "Đàn T'rưng": { en: "T'rưng bamboo xylophone", meaning: "Nhạc cụ làm bằng các ống tre", usage: "The T'rưng bamboo xylophone produces soft and beautiful sounds." },
  "Đàn Klông pút": { en: "Klông pút flute", meaning: "Nhạc cụ ống tre của Tây Nguyên", usage: "Women often play the Klông pút during village festivals." },

  // Ẩm thực
  "Cơm lam": { en: "Bamboo-cooked rice", meaning: "Cơm nấu trong ống tre", usage: "Bamboo-cooked rice is a popular dish in the Central Highlands." },
  "Rượu cần": { en: "Traditional jar rice wine", meaning: "Rượu gạo uống chung bằng cần tre", usage: "Guests share traditional jar rice wine during festivals." },
  "Rượu ghè": { en: "Jar wine", meaning: "Rượu ủ trong ghè truyền thống", usage: "Jar wine is shared among community members at important gatherings." },
  "Canh bồi": { en: "Traditional K'Ho soup", meaning: "Món canh truyền thống của người K'Ho", usage: "Traditional K'Ho soup is served at family gatherings." },
  "Canh thụt": { en: "Bamboo-tube soup", meaning: "Canh nấu trong ống tre", usage: "Bamboo-tube soup is a well-known dish of the M'Nong people." },
  "Thịt nướng ống tre": { en: "Bamboo-grilled meat", meaning: "Thịt nướng trong ống tre", usage: "Bamboo-grilled meat is often prepared during village festivals." },
  "Cá suối nướng": { en: "Grilled stream fish", meaning: "Cá suối nướng trên lửa", usage: "Grilled stream fish is a staple food of the Ma' people." },
  "Rau rừng": { en: "Wild forest vegetables", meaning: "Rau hái từ rừng tự nhiên", usage: "Wild forest vegetables are used in many traditional dishes." },
  "Gà nướng muối ớt rừng": { en: "Grilled chicken with forest spices", meaning: "Gà nướng với gia vị rừng", usage: "Grilled chicken with forest spices is a popular highland dish." },
  "Lá mì xào": { en: "Stir-fried cassava leaves", meaning: "Lá sắn xào", usage: "Stir-fried cassava leaves are a common dish in highland communities." },

  // Nghề thủ công
  "Dệt thổ cẩm": { en: "Brocade weaving", meaning: "Nghề dệt vải thổ cẩm truyền thống", usage: "Brocade weaving has been passed down for generations." },
  "Đan gùi": { en: "Back-basket weaving", meaning: "Đan gùi bằng tre nứa", usage: "Back-basket weaving is an important traditional craft." },
  "Đan lát": { en: "Bamboo weaving", meaning: "Đan các vật dụng bằng tre", usage: "Villagers make many household items through bamboo weaving." },
  "Đan lát mây tre": { en: "Rattan and bamboo weaving", meaning: "Đan lát bằng mây và tre", usage: "Rattan and bamboo weaving produces beautiful and durable baskets." },
  "Đan gùi mây tre": { en: "Rattan back-basket weaving", meaning: "Đan gùi bằng mây tre", usage: "Rattan back-basket weaving is an essential skill in highland communities." },
  "Chạm khắc gỗ": { en: "Wood carving", meaning: "Nghề chạm khắc tượng gỗ", usage: "Wood carving is a respected art form in many Central Highlands communities." },
  "Tạc tượng gỗ": { en: "Traditional wood sculpture", meaning: "Tạc tượng từ gỗ truyền thống", usage: "Traditional wood sculpture is used to decorate village communal houses." },
  "Điêu khắc nhà mồ": { en: "Funeral house sculpture", meaning: "Điêu khắc trang trí nhà mồ", usage: "Funeral house sculpture is a unique form of traditional art in the Central Highlands." },
  "Dệt vải truyền thống": { en: "Traditional cloth weaving", meaning: "Dệt vải theo phương pháp truyền thống", usage: "Traditional cloth weaving produces colorful fabrics used for clothing." },

  // Trang phục
  "Trang phục dệt thổ cẩm truyền thống": { en: "Traditional brocade clothing", meaning: "Trang phục thổ cẩm dệt tay", usage: "Traditional brocade clothing is worn during festivals and ceremonies." },
  "Khố truyền thống (nam)": { en: "Traditional loincloth", meaning: "Khố truyền thống nam giới", usage: "The traditional loincloth is worn by men during ceremonies." },
  "Trang sức hạt cườm": { en: "Bead jewelry", meaning: "Trang sức làm từ hạt cườm", usage: "Bead jewelry is an important part of traditional highland costumes." },
  "Áo chàm truyền thống": { en: "Indigo blouse", meaning: "Áo nhuộm chàm truyền thống", usage: "The indigo blouse is a symbol of highland ethnic identity." },
  "Váy quấn thổ cẩm": { en: "Brocade wrap skirt", meaning: "Váy quấn bằng vải thổ cẩm", usage: "The brocade wrap skirt is decorated with traditional geometric patterns." },
  "Khố và áo thổ cẩm": { en: "Brocade loincloth and shirt", meaning: "Trang phục thổ cẩm truyền thống", usage: "The brocade loincloth and shirt are worn during important ceremonies." },
  "Vòng tay đồng": { en: "Bronze bracelet", meaning: "Vòng tay bằng đồng", usage: "Bronze bracelets are traditional jewelry of Central Highlands peoples." },
  "Khăn choàng truyền thống": { en: "Traditional shawl", meaning: "Khăn choàng truyền thống", usage: "The traditional shawl is worn over the shoulders during festivals." },
};

export const CULTURE_LEXICON: Record<string, LexiconEntry> = { ...BASE_LEXICON, ...CULTURE_LEXICON_EXTRA };

/** Các mục dài trước, để khớp đúng cụm dài nhất. */
export const LEXICON_KEYS = Object.keys(CULTURE_LEXICON).sort((a, b) => b.length - a.length);
