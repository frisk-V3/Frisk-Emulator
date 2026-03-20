import { Bus } from './bus';
import { OpCode, CpuFlag } from './types';

export class CPU {
  // レジスタ実体（8bit: A, B, X, Y, FLAGS / 16bit: PC, SP）
  public registers = {
    A: 0, B: 0, X: 0, Y: 0,
    PC: 0, SP: 0,
    FLAGS: 0,
  };

  private bus: Bus;
  private halted: boolean = false;

  constructor(bus: Bus) {
    this.bus = bus;
    this.reset();
  }

  reset(): void {
    this.registers.A = 0;
    this.registers.B = 0;
    this.registers.X = 0;
    this.registers.Y = 0;
    this.registers.PC = 0x0000; // プログラム開始位置
    this.registers.SP = 0xFFFF; // スタックポインタ初期値
    this.registers.FLAGS = 0;
    this.halted = false;
  }

  /**
   * 1ステップ（1命令）実行
   */
  step(): void {
    if (this.halted) return;

    // 1. Fetch: 現在のPCから命令を読み込む
    const opcode = this.fetch8();

    // 2. Decode & Execute: 命令に応じて処理
    this.execute(opcode);
  }

  private fetch8(): number {
    const value = this.bus.read(this.registers.PC);
    this.registers.PC++;
    return value;
  }

  private fetch16(): number {
    const value = this.bus.read16(this.registers.PC);
    this.registers.PC += 2;
    return value;
  }

  /**
   * 命令実行（ここを増やしていく）
   */
  private execute(opcode: number): void {
    switch (opcode) {
      case OpCode.HALT:
        this.halted = true;
        break;

      case OpCode.LD_A_IMM: // Aレジスタに即値をロード (例: 0x01 0x0A -> A=10)
        this.registers.A = this.fetch8();
        this.updateFlags(this.registers.A);
        break;

      case OpCode.LD_A_B: // A = B
        this.registers.A = this.registers.B;
        this.updateFlags(this.registers.A);
        break;

      case OpCode.ADD_A_B: // A = A + B
        const result = this.registers.A + this.registers.B;
        this.registers.A = result & 0xFF;
        // Carryフラグ判定
        this.setFlag(CpuFlag.Carry, result > 0xFF);
        this.updateFlags(this.registers.A);
        break;

      default:
        console.error(`Unknown OpCode: 0x${opcode.toString(16)} at 0x${(this.registers.PC - 1).toString(16)}`);
        this.halted = true;
    }
  }

  // フラグ更新用ヘルパー（Zero, Negative）
  private updateFlags(value: number): void {
    this.setFlag(CpuFlag.Zero, (value & 0xFF) === 0);
    this.setFlag(CpuFlag.Negative, (value & 0x80) !== 0);
  }

  private setFlag(flag: CpuFlag, on: boolean): void {
    if (on) {
      this.registers.FLAGS |= (1 << flag);
    } else {
      this.registers.FLAGS &= ~(1 << flag);
    }
  }
}
