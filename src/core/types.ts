/**
 * Frisk-Emulator ハードウェア定義
 */

// レジスタの種類
export type RegisterName = 'A' | 'B' | 'X' | 'Y' | 'PC' | 'SP' | 'FLAGS';

// フラグレジスタのビット位置
export enum CpuFlag {
  Carry = 0,    // 桁上げ
  Zero = 1,     // 演算結果が0
  Negative = 7, // 最上位ビットが1
}

// メモリマップの定義（アドレス範囲）
export const MEMORY_MAP = {
  RAM_START: 0x0000,
  RAM_END:   0x7FFF, // 32KB RAM
  VRAM_START: 0x8000,
  VRAM_END:   0x9FFF, // 8KB VRAM (表示用)
  IO_START:   0xFF00,
  IO_END:     0xFFFF, // I/Oポート
} as const;

// オペコードの定義（例）
export enum OpCode {
  HALT = 0x00,
  LD_A_IMM = 0x01, // Load A with Immediate
  LD_A_B   = 0x02, // A = B
  ADD_A_B  = 0x10, // A = A + B
  // ... ここに命令を増やしていく
}

// 1つの命令の構造
export interface Instruction {
  code: OpCode;
  mnemonic: string;
  bytes: number;   // 命令長（1〜3バイトなど）
  cycles: number;  // 実行にかかるクロック数
}
