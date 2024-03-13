output-list time%S1.4.1 instruction%B0.16.0 ARegister[]%D1.7.1 DRegister[]%D1.7.1 PC[]%D0.4.0 Memory[0]%D1.7.1 Memory[1]%D1.7.1 Memory[2]%D1.7.1;

ROM32K load Max.asm;
set Memory[0] 16548, set Memory[1] 12944;

repeat 14 {
   tick, tock, output;
}
