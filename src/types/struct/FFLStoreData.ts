import _ from "../../lib/struct-fu/lib.js";

export const FFLiCreateID = _.struct("FFLiCreateID", [
  _.ubit("flag_normal", 1),
  _.ubit("flag_1", 1),
  _.ubit("flag_temporary", 1),
  _.ubit("flag_3", 1),
  _.ubit("create_date1", 14), // 28-bit field
  _.ubit("create_date2", 14), // 28-bit field
  _.byte("base", 6),
]);
export const date_timestamp = function (createID: any) {
  var val28 = (createID.create_date1 << 14) | createID.create_date2;
  var timestamp = val28 * 2 + 1262304000;
  return new Date(timestamp * 1000);
};
export const FFLiAuthorID = _.struct("FFLiAuthorID", [_.byte("data", 8)]);

export const Ver3StoreData = _.struct("Ver3StoreData", [
  // 0x00: 32 bits
  //_.struct([
  _.ubitLE("mii_version", 8), // LSB
  _.ubitLE("copyable", 1),
  _.ubitLE("ng_word", 1),
  _.ubitLE("region_move", 2),
  _.ubitLE("font_region", 2),
  _.ubitLE("reserved_0", 2), // Unused padding
  _.ubitLE("room_index", 4),
  _.ubitLE("position_in_room", 4),
  _.ubitLE("author_type", 4), // _0_24_27
  _.ubitLE("birth_platform", 3),
  _.ubitLE("reserved_1"), // Unused (MSB)
  //]),

  // 0x04: author_id (8 bytes)
  _.struct("author_id", [FFLiAuthorID]),

  // 0x0C: creator_id (10 bytes)
  //_.byte('create_id', 10),
  _.struct("create_id", [FFLiCreateID]),

  // 0x16: padding (2 bytes)
  _.byte("reserved_2", 2),

  // 0x18: 16 bits for birthday and favorite
  _.ubitLE("gender", 1), // LSB
  _.ubitLE("birth_month", 4),
  _.ubitLE("birth_day", 5),
  _.ubitLE("favorite_color", 4),
  _.ubitLE("favorite", 1),
  _.ubitLE("padding_0", 1), // Placeholder (MSB)

  // 0x1A: name (UTF-16LE, 20 bytes)
  _.char16le("name", 20),

  // 0x2E: height and build
  _.uint8("height"),
  _.uint8("build"),

  // 0x30: 16 bits for face data
  _.ubitLE("localonly", 1), // LSB
  _.ubitLE("face_type", 4),
  _.ubitLE("face_color", 3),
  _.ubitLE("face_tex", 4),
  _.ubitLE("face_make", 4), // MSB

  // 0x32: 16 bits for hair data
  _.ubitLE("hair_type", 8), // LSB
  _.ubitLE("hair_color", 3),
  _.ubitLE("hair_flip", 1),
  _.ubitLE("padding_1", 4), // Unused padding (MSB)

  // 0x34: 16 bits for eye data
  _.ubitLE("eye_type", 6), // LSB
  _.ubitLE("eye_color", 3),
  _.ubitLE("eye_scale", 4),
  _.ubitLE("eye_aspect", 3), // MSB

  // 0x36: 16 bits for eye positioning
  _.ubitLE("eye_rotate", 5), // LSB
  _.ubitLE("eye_x", 4),
  _.ubitLE("eye_y", 5),
  _.ubitLE("padding_2", 2), // Unused padding (MSB)

  // 0x38: 16 bits for eyebrow data
  _.ubitLE("eyebrow_type", 5), // LSB
  _.ubitLE("eyebrow_color", 3),
  _.ubitLE("eyebrow_scale", 4),
  _.ubitLE("eyebrow_aspect", 3),
  _.ubitLE("padding_3", 1), // Unused padding (MSB)

  // 0x3A: 16 bits for eyebrow positioning
  _.ubitLE("eyebrow_rotate", 5), // LSB
  _.ubitLE("eyebrow_x", 4),
  _.ubitLE("eyebrow_y", 5),
  _.ubitLE("padding_4", 2), // Unused padding (MSB)

  // 0x3C: 16 bits for nose data
  _.ubitLE("nose_type", 5), // LSB
  _.ubitLE("nose_scale", 4),
  _.ubitLE("nose_y", 5),
  _.ubitLE("padding_5", 2), // Unused padding (MSB)

  // 0x3E: 16 bits for mouth data
  _.ubitLE("mouth_type", 6), // LSB
  _.ubitLE("mouth_color", 3),
  _.ubitLE("mouth_scale", 4),
  _.ubitLE("mouth_aspect", 3), // MSB

  // 0x40: 16 bits for mustache/mouth position
  _.ubitLE("mouth_y", 5), // LSB
  _.ubitLE("mustache_type", 3),
  _.ubitLE("padding_6", 8), // Unused padding (MSB)

  // 0x42: 16 bits for mustache/beard data
  _.ubitLE("beard_type", 3), // LSB
  _.ubitLE("beard_color", 3),
  _.ubitLE("beard_scale", 4),
  _.ubitLE("beard_y", 5),
  _.ubitLE("padding_7", 1), // Unused padding (MSB)

  // 0x44: 16 bits for glasses data
  _.ubitLE("glasses_type", 4), // LSB
  _.ubitLE("glasses_color", 3),
  _.ubitLE("glasses_scale", 4),
  _.ubitLE("glass_y", 5), // MSB

  // 0x46: 16 bits for mole data
  _.ubitLE("mole_type", 1), // LSB
  _.ubitLE("mole_scale", 4),
  _.ubitLE("mole_x", 5),
  _.ubitLE("mole_y", 5),
  _.ubitLE("padding_8", 1), // Unused padding (MSB)

  // FFLStoreData
  _.char16le("creator", 20),
  _.uint16le("padding_9"),
  _.uint16("checksum"),
]);
