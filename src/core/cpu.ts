import { Bus } from './bus';
import { OpCode, CpuFlag } from './types';

// 命令実行関数の型定義
type InstructionHandler = () => void;

export class CPU {
  // レジスタ（ビット幅を意識した初期化）
  public registers = {
    A: 0, B: 0, X: 0, Y: 0,
    PC: 0, SP: 0,
    FLAGS: 0,
  };

  private bus: Bus;
  private halted: boolean = false;

  // 命令テーブル (256個のOpCodeに対応)
  private instructions: InstructionHandler[] = new Array(256);

  constructor(bus: Bus) {
    this.bus = bus;
    this.initInstructionTable();
    this.reset();
  }

  public reset(): void {
    this.registers.A = 0x00;
    this.registers.B = 0x00;
    this.registers.X = 0x00;
    this.registers.Y = 0x00;
    this.registers.PC = 0x0000; // ROMロード開始位置
    this.registers.SP = 0xFFFF; // スタックの底
    this.registers.FLAGS = 0x00;
    this.halted = false;
  }

  /**
   * 命令セットの登録（ここを増やすことでエミュレータが強化される）
   */
  private initInstructionTable(): void {
    // デフォルトは未実装エラーを投げる
    this.instructions.fill(() => {
      throw new Error(`Unimplemented OpCode: 0x${this.bus.read(this.registers.PC - 1).toString(16).toUpperCase()}`);
    });

    // --- 命令の実装開始 ---

    // [0x00] HALT: 停止
    this.instructions[OpCode.HALT] = () => {
      this.halted = true;
    };

    // [0x01] LD A, IMM: Aレジスタに即値をロード
    this.instructions[OpCode.LD_A_IMM] = () => {
      this.registers.A = this.fetch8();
      this.updateStatusFlags(this.registers.A);
    };

    // [0x02] LD A, B: AレジスタにBの値をコピー
    this.instructions[OpCode.LD_A_B] = () => {
      this.registers.A = this.registers.B;
      this.updateStatusFlags(this.registers.A);
    };

    // [0x10] ADD A, B: A = A + B (キャリーフラグ対応)
    this.instructions[OpCode.ADD_A_B] = () => {
      const sum = this.registers.A + this.registers.B;
      this.setFlag(CpuFlag.Carry, sum > 0xFF);
      this.registers.A = sum & 0xFF;
      this.updateStatusFlags(this.registers.A);
    };

    // [0x20] PUSH A: スタックにAを積む
    this.instructions[0x20] = () => {
      this.push8(this.registers.A);
    };

    // [0x21] POP A: スタックからAへ戻す
    this.instructions[0x21] = () => {
      this.registers.A = this.pop8();
      this.updateStatusFlags(this.registers.A);
    };
  }

  // --- 実行サイクル ---

  public step(): void {
    if (this.halted) return;
    const opcode = this.fetch8();
    this.instructions[opcode]();
  }

  // --- 低レイヤーヘルパー ---

  private fetch8(): number {
    return this.bus.read(this.registers.PC++) & 0xFF;
  }

  private push8(value: number): void {
    this.bus.write(this.registers.SP--, value);
  }

  private pop8(): number {
    return this.bus.read(++this.registers.SP);
  }

  private setFlag(flag: CpuFlag, on: boolean): void {
    if (on) this.registers.FLAGS |= (1 << flag);
    else this.registers.FLAGS &= ~(1 << flag);
  }

  private updateStatusFlags(value: number): void {
    this.setFlag(CpuFlag.Zero, (value & 0xFF) === 0);
    this.setFlag(CpuFlag.Negative, (value & 0x80) !== 0);
  }
}
