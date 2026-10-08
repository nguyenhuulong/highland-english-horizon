// Mục từ điển bổ sung cho các dân tộc/mục còn thiếu (H'Mông, Tày, Nùng, địa danh...).
// ⚠️ Chờ khách xác minh — xem docs/CULTURE_REVIEW.md.
import type { LexiconEntry } from "@/data/cultureLexicon";

export const CULTURE_LEXICON_EXTRA: Record<string, LexiconEntry> = {
  // Địa danh
  "Lạc Dương": { en: "Lac Duong", meaning: "Huyện miền núi ở Lâm Đồng", usage: "Lac Duong is a mountain district in Lam Dong province." },
  "Đam Rông": { en: "Dam Rong", meaning: "Huyện miền núi ở Lâm Đồng", usage: "Dam Rong is a highland district where many K'Ho families live." },
  "Di Linh": { en: "Di Linh", meaning: "Huyện cao nguyên ở Lâm Đồng", usage: "Di Linh is a highland area with green hills." },
  "Lâm Đồng": { en: "Lam Dong province", meaning: "Tỉnh ở Tây Nguyên", usage: "Lam Dong is a province in the Central Highlands." },
  "Cát Tiên": { en: "Cat Tien", meaning: "Vùng rừng và sông ở phía nam Tây Nguyên", usage: "Cat Tien is known for its forest and river." },
  "Lưu vực sông Đồng Nai": { en: "Dong Nai river basin", meaning: "Vùng đất quanh sông Đồng Nai", usage: "The Dong Nai river basin gives water to many villages." },
  "Đắk Lắk": { en: "Dak Lak province", meaning: "Tỉnh ở Tây Nguyên", usage: "Dak Lak is a province in the Central Highlands." },
  "Đắk Nông": { en: "Dak Nong province", meaning: "Tỉnh ở Tây Nguyên", usage: "Dak Nong is a province in the Central Highlands with many ethnic communities." },
  "Buôn Đôn": { en: "Buon Don", meaning: "Vùng nổi tiếng với voi ở Đắk Lắk", usage: "Buon Don is famous for its elephants." },
  "Hà Giang": { en: "Ha Giang province", meaning: "Tỉnh vùng núi phía bắc", usage: "Ha Giang is a mountain province in northern Vietnam." },
  "Cao nguyên đá Đồng Văn": { en: "Dong Van Karst Plateau", meaning: "Cao nguyên đá ở Hà Giang", usage: "The Dong Van Karst Plateau is a rocky highland in the north." },
  "Cao Bằng": { en: "Cao Bang province", meaning: "Tỉnh vùng núi phía bắc", usage: "Cao Bang is a mountain province in northern Vietnam." },
  "Bắc Kạn": { en: "Bac Kan province", meaning: "Tỉnh vùng núi phía bắc", usage: "Bac Kan is a mountain province in northern Vietnam." },
  "Lạng Sơn": { en: "Lang Son province", meaning: "Tỉnh vùng núi phía bắc", usage: "Lang Son is a border province in northern Vietnam." },

  // Trang phục
  "Gùi đeo vai": { en: "Shoulder basket", meaning: "Gùi đan bằng tre mây để đeo trên lưng", usage: "She carries vegetables in a shoulder basket." },
  "Váy xòe thổ cẩm nhiều màu": { en: "Colorful brocade skirt", meaning: "Váy nhiều màu dệt hoặc thêu hoa văn", usage: "The colorful brocade skirt is worn on special days." },
  "Áo thêu hoa văn": { en: "Embroidered shirt", meaning: "Áo có hoa văn thêu tay", usage: "Her embroidered shirt has beautiful patterns." },
  "Trang sức bạc truyền thống": { en: "Traditional silver jewelry", meaning: "Đồ trang sức bằng bạc", usage: "Traditional silver jewelry shines at festivals." },
  "Áo chàm dài truyền thống": { en: "Long indigo shirt", meaning: "Áo dài nhuộm màu chàm xanh đậm", usage: "A long indigo shirt is traditional clothing." },
  "Khăn vấn đầu": { en: "Head wrap", meaning: "Khăn quấn quanh đầu", usage: "She wears a head wrap on festival days." },
  "Thắt lưng thêu hoa văn": { en: "Embroidered belt", meaning: "Thắt lưng có hoa văn thêu", usage: "The embroidered belt matches her shirt." },
  "Áo chàm năm thân": { en: "Five-panel indigo shirt", meaning: "Áo chàm cắt may năm thân", usage: "A five-panel indigo shirt is part of Nung clothing." },
  "Khăn đội đầu truyền thống": { en: "Traditional headscarf", meaning: "Khăn đội đầu theo phong tục", usage: "The traditional headscarf is neatly folded." },
  "Trang phục nhuộm chàm": { en: "Indigo-dyed clothing", meaning: "Quần áo nhuộm bằng cây chàm", usage: "Indigo-dyed clothing is deep blue." },

  // Lễ hội
  "Lễ hội Gầu Tào": { en: "Gau Tao Festival", meaning: "Lễ hội mùa xuân của người H'Mông", usage: "People gather for the Gau Tao Festival in spring." },
  "Tết truyền thống H'Mông": { en: "H'Mong traditional New Year", meaning: "Tết theo phong tục của người H'Mông", usage: "Families enjoy the H'Mong traditional New Year together." },
  "Chợ phiên vùng cao": { en: "Highland market", meaning: "Phiên chợ họp theo ngày ở vùng cao", usage: "The highland market is full of colorful cloth." },
  "Lễ hội Lồng Tồng": { en: "Long Tong Festival", meaning: "Lễ hội xuống đồng mùa xuân, cầu mùa màng tốt", usage: "The Long Tong Festival is held in spring." },
  "Lễ hội Nàng Hai": { en: "Nang Hai Festival", meaning: "Lễ hội truyền thống của người Tày", usage: "The Nang Hai Festival is a traditional Tay celebration." },
  "Tết Nguyên đán": { en: "Lunar New Year", meaning: "Tết cổ truyền của người Việt", usage: "Families gather for Lunar New Year." },
  "Lễ cầu mùa": { en: "Harvest Prayer Ceremony", meaning: "Lễ cầu cho mùa màng tốt tươi", usage: "People join the Harvest Prayer Ceremony before planting." },
  "Các hội xuân địa phương": { en: "Local spring festivals", meaning: "Các hội xuân của từng địa phương", usage: "Local spring festivals bring villages together." },

  // Nhạc cụ
  "Khèn H'Mông": { en: "H'Mong khen", meaning: "Nhạc cụ làm từ nhiều ống trúc ghép lại", usage: "He plays the H'Mong khen and dances." },
  "Đàn môi": { en: "Mouth harp", meaning: "Nhạc cụ nhỏ đặt ở môi để thổi/gảy", usage: "The mouth harp makes a soft sound." },
  "Sáo Mèo": { en: "H'Mong flute", meaning: "Sáo của người H'Mông", usage: "The H'Mong flute sounds bright and clear." },
  "Đàn tính": { en: "Tinh lute", meaning: "Đàn dây của người Tày, Nùng, Thái", usage: "She plays the tinh lute when she sings Then." },
  "Trống": { en: "Drum", meaning: "Nhạc cụ gõ", usage: "The drum starts the festival." },
  "Chiêng": { en: "Gong", meaning: "Nhạc cụ bằng đồng, đánh bằng dùi", usage: "The gong rings across the village." },
  "Kèn lá": { en: "Leaf horn", meaning: "Kèn thổi bằng lá", usage: "He plays a tune on the leaf horn." },
  "Trống sành": { en: "Clay drum", meaning: "Trống làm từ sành, đất nung", usage: "The clay drum has a deep sound." },

  // Nghề thủ công
  "Vẽ sáp ong trên vải": { en: "Beeswax cloth painting", meaning: "Vẽ bằng sáp ong rồi nhuộm vải", usage: "Beeswax cloth painting keeps white lines in the pattern." },
  "Dệt lanh": { en: "Linen weaving", meaning: "Dệt vải từ sợi lanh", usage: "Linen weaving takes many days." },
  "Thêu thùa": { en: "Embroidery", meaning: "Thêu hoa văn lên vải", usage: "Embroidery needs patience and careful hands." },
  "Làm bánh truyền thống": { en: "Making traditional cakes", meaning: "Làm các loại bánh theo cách xưa", usage: "Making traditional cakes is a family activity." },
  "Dệt vải chàm": { en: "Indigo cloth weaving", meaning: "Dệt và nhuộm vải màu chàm", usage: "Indigo cloth weaving gives deep blue fabric." },
  "Làm giấy bản": { en: "Handmade paper making", meaning: "Làm giấy thủ công từ vỏ cây", usage: "Handmade paper making uses tree bark." },
  "Rèn nông cụ": { en: "Making farm tools", meaning: "Rèn dụng cụ làm nông", usage: "Making farm tools helps farmers work in the fields." },

  // Ẩm thực
  "Thắng cố": { en: "Thang co stew", meaning: "Món hầm truyền thống của người H'Mông", usage: "Thang co stew is often sold at highland markets." },
  "Mèn mén": { en: "Corn flour dish", meaning: "Món ăn làm từ bột ngô", usage: "Corn flour dish is a common meal in the highlands." },
  "Rượu ngô": { en: "Corn wine", meaning: "Rượu nấu từ ngô", usage: "Corn wine is served to guests." },
  "Xôi ngũ sắc": { en: "Five-color sticky rice", meaning: "Xôi năm màu nhuộm từ lá và hoa", usage: "Five-color sticky rice looks bright and beautiful." },
  "Thịt lợn quay": { en: "Roast pork", meaning: "Thịt lợn quay giòn", usage: "Roast pork is served on special days." },
  "Bánh chưng đen": { en: "Black sticky rice cake", meaning: "Bánh chưng nhuộm màu đen từ lá", usage: "The black sticky rice cake is wrapped in leaves." },
  "Khâu nhục": { en: "Khau nhuc pork dish", meaning: "Món thịt ba chỉ hấp của miền núi phía bắc", usage: "Khau nhuc pork dish is served at festivals." },
  "Bánh khảo": { en: "Khao cake", meaning: "Bánh ngọt làm từ bột gạo rang", usage: "The Khao cake is sweet and soft." },
  "Rượu men lá": { en: "Leaf-yeast rice wine", meaning: "Rượu gạo ủ bằng men lá", usage: "Leaf-yeast rice wine is shared with guests." },
};
