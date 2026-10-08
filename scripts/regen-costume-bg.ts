import { generateBackgroundImage } from "../lib/imageGen";
import { uploadFromUrl, makeFileName } from "../lib/storage";
(async () => {
  const prompt = "interior of a traditional wooden stilt house in the Central Highlands of Vietnam, plain woven bamboo walls with nothing hanging on them, a wooden loom with colorful brocade thread in the corner, a few woven baskets, woven mat on the wooden floor, a wide open doorway showing green hills, warm soft light, children book illustration, no text, no writing, no signs, no scrolls, no paintings, no lanterns, not Chinese style, no people, no animals";
  const tmp = await generateBackgroundImage({ prompt, nameEn: "costume-v3-plainwall" });
  console.log(await uploadFromUrl({ sourceUrl: tmp, fileName: makeFileName("backgrounds/costume", "jpg") }));
})();
