import { Memory } from './memory';
import { MEMORY_MAP } from './types';

export class Bus {
  private memory: Memory;

  constructor(memory: Memory) {
    this.memory = memory;
  }

  /**
   * CPUからの読み込みリクエストを適切なデバイスへ振り分け
   */
  read(address: number): number {
    // 範囲チェック（0x0000 - 0xFFFF）
    const addr = address & 0xFFFF;

    // 基本はメモリから読み込む
    // 将来的に「特定のポート(IO_START等)ならコントローラー状態を返す」処理をここに追加
    return this.memory.read(addr);
  }

  /**
   * CPUからの書き込みリクエストを適切なデバイスへ振り分け
   */
  write(address: number, value: number): void {
    const addr = address & 0xFFFF;
    const val = value & 0xFF;

    // メモリへの書き込み
    // 将来的に「特定のポートならサウンド再生開始」などのフックをここに追加
    this.memory.write(addr, val);
  }

  /**
   * 16bit値の読み込み（リトルエンディアン想定）
   */
  read16(address: number): number {
    const lo = this.read(address);
    const hi = this.read(address + 1);
    return (hi << 8) | lo;
  }

  /**
   * 16bit値の書き込み（リトルエンディアン想定）
   */
  write16(address: number, value: number): void {
    this.write(address, value & 0xFF);         // Low byte
    this.write(address + 1, (value >> 8) & 0xFF); // High byte
  }
}
