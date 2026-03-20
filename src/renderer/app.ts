import { CPU } from '../core/cpu';
import { Bus } from '../core/bus';
import { Memory } from '../core/memory';
import { Screen } from './canvas';
import { MEMORY_MAP } from '../core/types';

// ElectronのMainプロセスと通信するための型定義（window.electron経由）
declare global {
  interface Window {
    electron: {
      loadRom: () => Promise<Uint8Array | null>;
    };
  }
}

export class FriskEmulatorApp {
  private cpu: CPU;
  private bus: Bus;
  private memory: Memory;
  private screen: Screen;

  private isRunning: boolean = false;
  private cyclesPerFrame: number = 10000; // 1フレームあたりに実行する命令数（調整可能）

  constructor(canvas: HTMLCanvasElement) {
    // 1. ハードウェアコンポーネントの初期化
    this.memory = new Memory();
    this.bus = new Bus(this.memory);
    this.cpu = new CPU(this.bus);
    this.screen = new Screen(canvas);

    // 2. VRAM書き込みの監視（効率化のため）
    // 今回はシンプルに全フレーム描画するが、必要に応じてここにフックを入れる
  }

  /**
   * エミュレータの起動プロセス
   */
  public async boot() {
    console.log("Frisk-Emulator: Booting...");

    // Mainプロセス（Electron）から .bin を取得
    const romData = await window.electron.loadRom();

    if (!romData) {
      console.error("No ROM loaded. Please select a .bin file.");
      return;
    }

    // ROMをメモリの 0x0000 (RAM_START) にロード
    this.memory.load(romData, MEMORY_MAP.RAM_START);
    
    this.cpu.reset();
    this.isRunning = true;

    // メインループ開始
    this.loop();
  }

  /**
   * 60FPSのメインループ
   */
  private loop = () => {
    if (!this.isRunning) return;

    // 1フレーム分の実行
    // CPUクロックと同期させるため、1/60秒間に一定ステップ数実行する
    for (let i = 0; i < this.cyclesPerFrame; i++) {
      this.cpu.step();
      
      // HALT命令などで止まった場合はループを抜ける
      // @ts-ignore: CPUの状態にアクセス（実際にはCPUクラスにisHaltedフラグを持たせる）
      if (this.cpu.halted) {
        this.isRunning = false;
        console.log("CPU Halted.");
        break;
      }
    }

    // 画面の更新
    // VRAM領域 (0x8000 - 0x9FFF) を抜き出して描画エンジンに渡す
    const vram = new Uint8Array(
        // @ts-ignore: memory内部データへの直接アクセス（高速化のため）
        this.memory.data.buffer, 
        MEMORY_MAP.VRAM_START, 
        MEMORY_MAP.VRAM_END - MEMORY_MAP.VRAM_START + 1
    );
    this.screen.update(vram);

    // 次のフレームへ
    requestAnimationFrame(this.loop);
  }

  public stop() {
    this.isRunning = false;
  }
}

// 実行
const canvas = document.getElementById('display') as HTMLCanvasElement;
const app = new FriskEmulatorApp(canvas);
app.boot();
