import { MEMORY_MAP } from '../core/types';

export class Screen {
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private width: number = 128;  // Frisk-Emulator 標準解像度
  private height: number = 64;  // 合計 8,192 ピクセル (8KB VRAMと一致)

  // 256色の固定カラーパレット (RGB)
  private palette: Uint32Array;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get Canvas context');
    this.ctx = context;

    this.imageData = this.ctx.createImageData(this.width, this.height);
    this.palette = this.generatePalette();
    
    // Canvasのサイズを物理ピクセルに合わせる
    canvas.width = this.width;
    canvas.height = this.height;
  }

  /**
   * VRAMの全データを読み取ってCanvasを更新
   */
  public update(vram: Uint8Array): void {
    const data = this.imageData.data;
    const buf = new Uint32Array(data.buffer); // 32bit(RGBA)として一気に書き込む

    for (let i = 0; i < vram.length; i++) {
      // パレットから色を取得してRGBA(32bit)として代入
      buf[i] = this.palette[vram[i]];
    }

    // 描画実行
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  /**
   * 簡易的な256色パレット生成 (RGB332形式など)
   */
  private generatePalette(): Uint32Array {
    const palette = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      const r = (i >> 5) * 36;
      const g = ((i >> 2) & 0x07) * 36;
      const b = (i & 0x03) * 85;
      // リトルエンディアン想定 (ABGR)
      palette[i] = (0xFF << 24) | (b << 16) | (g << 8) | r;
    }
    return palette;
  }
}
