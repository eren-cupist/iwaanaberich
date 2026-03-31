const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

/**
 * 최소한의 유효한 PNG 파일을 생성하는 스크립트
 * 외부 의존성 없이 순수 Node.js만 사용
 * 초록색 단색 사각형 아이콘을 생성
 */

const ICONS_DIR = path.join(__dirname, "..", "public", "icons");

// PNG 시그니처
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// CRC32 테이블 생성
function makeCrcTable() {
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

const crcTable = makeCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// PNG 청크 생성
function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuffer, data]);
  const crcValue = crc32(crcInput);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crcValue, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// IHDR 청크 생성
function createIHDR(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);   // 너비
  data.writeUInt32BE(height, 4);  // 높이
  data.writeUInt8(8, 8);          // 비트 깊이
  data.writeUInt8(2, 9);          // 컬러 타입 (RGB)
  data.writeUInt8(0, 10);         // 압축 방법
  data.writeUInt8(0, 11);         // 필터 방법
  data.writeUInt8(0, 12);         // 인터레이스 방법
  return createChunk("IHDR", data);
}

// IDAT 청크 생성 (초록색 픽셀로 채움)
function createIDAT(width, height) {
  // 각 행: 필터 바이트(1) + RGB 데이터(width * 3)
  const rawData = Buffer.alloc(height * (1 + width * 3));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3);
    rawData[rowOffset] = 0; // 필터: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // 초록색 (#2ECC71) - 자동매매 봇에 어울리는 머니 그린
      rawData[pixelOffset] = 0x2e;     // R
      rawData[pixelOffset + 1] = 0xcc; // G
      rawData[pixelOffset + 2] = 0x71; // B
    }
  }

  const compressed = zlib.deflateSync(rawData);
  return createChunk("IDAT", compressed);
}

// IEND 청크 생성
function createIEND() {
  return createChunk("IEND", Buffer.alloc(0));
}

// PNG 파일 생성
function createPNG(width, height) {
  const ihdr = createIHDR(width, height);
  const idat = createIDAT(width, height);
  const iend = createIEND();

  return Buffer.concat([PNG_SIGNATURE, ihdr, idat, iend]);
}

// 아이콘 디렉토리 확인 및 생성
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// 아이콘 크기 목록
const sizes = [16, 48, 128];

for (const size of sizes) {
  const pngBuffer = createPNG(size, size);
  const filePath = path.join(ICONS_DIR, `icon${size}.png`);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`생성 완료: icon${size}.png (${pngBuffer.length} bytes)`);
}

console.log("\n모든 아이콘이 생성되었습니다!");
