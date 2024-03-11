output-list time%S1.4.1 instruction%B0.16.0 ARegister[]%D1.7.1 DRegister[]%D1.7.1 PC[]%D0.4.0 RAM16K[0]%D1.7.1 Memory[16384]%D1.7.1;

ROM32K load Rect.asm;
set Memory[0] 6;

repeat 100 {
   tick, tock;
}

output;