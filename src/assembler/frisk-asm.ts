import * as fs from 'fs';
import { OpCode } from '../core/types';

export class FriskAssembler {
  private labels: Map<string, number> = new Map();
  private opcodes: Record<string, number> = {
    'HALT': OpCode.HALT,     // 0x00
    'LD_A': OpCode.LD_A_IMM, // 0x01 (Immediate)
    'LD_A_B': OpCode.LD_A_B, // 0x02
    'ADD_A_B': OpCode.ADD_A_B, // 0x10
    // 今後 CPU.ts に追加する命令をここにも定義する
  };

  /**
   * アセンブリソースをバイナリに変換
   */
  public assemble(source: string): Uint8Array {
    const lines = source.split('\n')
      .map(l => l.split(';')[0].trim()) // コメント除去
      .filter(l => l.length > 0);

    // --- Pass 1: ラベルの収集 ---
    let currentAddress = 0;
    const instructions: string[][] = [];

    for (const line of lines) {
      if (line.endsWith(':')) {
        const labelName = line.slice(0, -1);
        this.labels.set(labelName, currentAddress);
      } else {
        const parts = line.split(/[ ,]+/).filter(p => p.length > 0);
        instructions.push(parts);
        
        // 命令ごとのバイト数を計算（とりあえず簡易実装）
        const mnemonic = parts[0].toUpperCase();
        if (mnemonic === 'LD_A') currentAddress += 2; // 命令 + 即値
        else currentAddress += 1; // 命令のみ
      }
    }

    // --- Pass 2: バイナリ生成 ---
    const output = new Uint8Array(currentAddress);
    let pc = 0;

    for (const parts of instructions) {
      const mnemonic = parts[0].toUpperCase();
      const opcode = this.opcodes[mnemonic];

      if (opcode === undefined) {
        throw new Error(`Unknown mnemonic: ${mnemonic}`);
      }

      output[pc++] = opcode;

      // 引数がある場合の処理 (LD_A 10 など)
      if (mnemonic === 'LD_A') {
        const arg = parts[1];
        // ラベルか数値か判定
        const value = this.labels.has(arg) 
          ? this.labels.get(arg)! 
          : parseInt(arg, 10);
        output[pc++] = value & 0xFF;
      }
    }

    return output;
  }
}

// CLIとして実行可能にする
if (require.main === module) {
  const [,, src, dest] = process.argv;
  if (!src || !dest) {
    console.log('Usage: npx ts-node frisk-asm.ts <source.asm> <dest.bin>');
    process.exit(1);
  }

  const asm = new FriskAssembler();
  const source = fs.readFileSync(src, 'utf-8');
  const binary = asm.assemble(source);
  fs.writeFileSync(dest, binary);
  console.log(`Successfully assembled: ${src} -> ${dest} (${binary.length} bytes)`);
}
