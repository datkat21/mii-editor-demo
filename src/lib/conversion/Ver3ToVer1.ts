import type { Ver3StoreData } from "../../types/struct/FFLStoreData";
import { RFLStoreData } from "../../types/struct/RFLStoreData";
import { parseHexOrB64TextStringToUint8Array } from "../../util/parseString";

// UNFINISHED
export const Ver3ToVer1EyeType = [
  // Wii eye types
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47,
  // 3DS/Wii U eye types
  // closest hand picked guess

  38 /* 48 */, 37 /* 49 */, 36 /* 50 */, 7 /* 51 */, 31 /* 52 */, 37 /* 53 */,
  0 /* 54 */, 15 /* 55 */, 38 /* 56 */, 32 /* 57 */, 37 /* 58 */, 0 /* 59 */,
];

// do not rely on this working as it doesn't backport ver3 specific fields to rfl properly
export function Ver3DataToVer1(ver3: Ver3StoreData) {
  const rsd = RFLStoreData.unpack(
    parseHexOrB64TextStringToUint8Array("0".repeat(76 * 2))
  ) as RFLStoreData;

  const charData = rsd.RFLCharData;

  charData.padding0 = ver3.padding_0;
  charData.gender = ver3.gender;
  charData.birthMonth = ver3.birth_month;
  charData.birthDay = ver3.birth_day;
  charData.favoriteColor = ver3.favorite_color;
  charData.favorite = ver3.favorite;
  charData.name = ver3.name;
  charData.height = ver3.height;
  charData.build = ver3.build;
  charData.create_id = ver3.create_id;
  charData.faceType = ver3.face_type;
  charData.faceColor = ver3.face_color;
  charData.faceTex = ver3.face_make;
  charData.padding_2 = ver3.padding_2;
  charData.localonly = ver3.localonly;
  charData.type = ver3.create_id.flag_normal;
  charData.hairType = ver3.hair_type;
  charData.hairColor = ver3.hair_color;
  charData.hairFlip = ver3.hair_flip;
  charData.padding_3 = ver3.padding_3;
  charData.eyebrowType = ver3.eyebrow_type;
  charData.eyebrowRotate = ver3.eyebrow_rotate;
  charData.padding_4 = ver3.padding_4;
  charData.eyebrowColor = ver3.eyebrow_color;
  charData.eyebrowScale = ver3.eyebrow_scale;
  charData.eyebrowY = ver3.eyebrow_y;
  charData.eyebrowX = ver3.eyebrow_x;
  charData.eyeType = ver3.eye_type;
  charData.eyeRotate = ver3.eye_rotate;
  charData.eyeY = ver3.eye_y;
  charData.eyeColor = ver3.eye_color;
  charData.eyeScale = ver3.eye_scale;
  charData.eyeX = ver3.eye_x;
  charData.padding_5 = ver3.padding_5;
  charData.noseType = ver3.nose_type;
  charData.noseScale = ver3.nose_scale;
  charData.noseY = ver3.nose_y;
  charData.padding_6 = ver3.padding_6;
  charData.mouthType = ver3.mouth_type;
  charData.mouthColor = ver3.mouth_color;
  charData.mouthScale = ver3.mouth_scale;
  charData.mouthY = ver3.mouth_y;
  charData.glassType = ver3.glasses_type;
  charData.glassColor = ver3.glasses_color;
  charData.glassScale = ver3.glasses_scale;
  charData.glassY = ver3.glass_y;
  charData.mustacheType = ver3.mustache_type;
  charData.beardType = ver3.beard_type;
  charData.beardColor = ver3.beard_color;
  charData.beardScale = ver3.beard_scale;
  charData.beardY = ver3.beard_y;
  charData.moleType = ver3.mole_type;
  charData.moleScale = ver3.mole_scale;
  charData.moleY = ver3.mole_y;
  charData.moleX = ver3.mole_x;
  charData.padding_8 = ver3.padding_8;
  charData.creatorName = ver3.creator;

  return RFLStoreData.pack(rsd);
}
