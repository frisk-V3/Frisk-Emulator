import { MEMORY_MAP } from './types';

export class Memory {
  private data: Uint8Array;

  constructor(size: number = 0x10000) { // デフォルト 64KB
    this.data = new Uint8Array(size);
  }

  /**
   * 1バイト読み込み
   */
  read(address: number): number {
    return this.data[address] & 0xFF;
  }

  /**
   * 1バイト書き込み
   */
  write(address: number, value: number): void {
    this.data[address] = value & 0xFF;

    // VRAM領域への書き込みを検知（あとでレンダラーへの通知に使用）
    if (address >= MEMORY_MAP.VRAM_START && address <= MEMORY_MAP.VRAM_END) {
      this.onVramWrite(address, value);
    }
  }

  /**
   * 外部（Renderer等）からVRAM更新を監視するためのフック
   */
  public onVramWrite: (address: number, value: number) => void = () => {};

  /**
   * BINファイルを特定のターゲットアドレスにロード
   */
  load(binary: Uint8Array, targetAddress: number = 0x0000): void {
    if (targetAddress + binary.length > this.data.length) {
      throw new Error('Binary is too large for memory');
    }
    this.data.set(binary, targetAddress);
  }

  /**
   * メモリの全初期化
   */
  reset(): void {
    this.data.fill(0);
  }
}
